-- FAFIPA Study OS — Migração V6 + V7
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
-- (idempotente: pode rodar de novo sem quebrar nada)

-- ============================================================
-- 1) PROGRESSO — campos de revisão espaçada avançada
-- ============================================================
alter table public.progresso
  add column if not exists review_stage text not null default 'novo'
    check (review_stage in ('novo','erro','acertou','dificil','facil','dominado')),
  add column if not exists next_review_at date,
  add column if not exists mastery_level integer not null default 0,
  add column if not exists success_count integer not null default 0,
  add column if not exists error_count integer not null default 0,
  add column if not exists last_seen_at timestamptz;

create index if not exists progresso_next_review_idx on public.progresso (user_id, next_review_at);

-- ============================================================
-- 2) FAVORITOS
-- ============================================================
create table if not exists public.favoritos (
  user_id uuid not null references auth.users (id) on delete cascade,
  questao_id text not null references public.questoes (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, questao_id)
);

alter table public.favoritos enable row level security;
drop policy if exists "favoritos: proprio usuario" on public.favoritos;
create policy "favoritos: proprio usuario" on public.favoritos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 3) METAS DIÁRIAS (configuração do usuário)
-- ============================================================
create table if not exists public.metas_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  questoes_dia integer not null default 20,
  revisoes_dia integer not null default 10,
  minutos_dia integer not null default 30,
  updated_at timestamptz not null default now()
);

alter table public.metas_config enable row level security;
drop policy if exists "metas_config: proprio usuario" on public.metas_config;
create policy "metas_config: proprio usuario" on public.metas_config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4) GAMIFICAÇÃO — xp, nível, streak
-- ============================================================
create table if not exists public.gamificacao (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0,
  nivel integer not null default 1,
  streak_atual integer not null default 0,
  streak_recorde integer not null default 0,
  ultima_atividade date,
  ultimo_bonus_meta date,
  updated_at timestamptz not null default now()
);

alter table public.gamificacao enable row level security;
drop policy if exists "gamificacao: proprio usuario" on public.gamificacao;
create policy "gamificacao: proprio usuario" on public.gamificacao
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 5) CONQUISTAS (medalhas)
-- ============================================================
create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  codigo text not null,
  conquistada_em timestamptz not null default now(),
  unique (user_id, codigo)
);

alter table public.conquistas enable row level security;
drop policy if exists "conquistas: proprio usuario" on public.conquistas;
create policy "conquistas: proprio usuario" on public.conquistas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 6) SIMULADOS
-- ============================================================
create table if not exists public.simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topico text,
  quantidade integer not null,
  tempo_gasto_seg integer,
  acertos integer not null default 0,
  total integer not null default 0,
  status text not null default 'em_andamento' check (status in ('em_andamento','concluido')),
  criado_em timestamptz not null default now(),
  finalizado_em timestamptz
);

create table if not exists public.simulado_itens (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados (id) on delete cascade,
  questao_id text not null references public.questoes (id),
  ordem integer not null,
  alternativa_marcada text,
  acertou boolean
);

alter table public.simulados enable row level security;
drop policy if exists "simulados: proprio usuario" on public.simulados;
create policy "simulados: proprio usuario" on public.simulados
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.simulado_itens enable row level security;
drop policy if exists "simulado_itens: proprio usuario" on public.simulado_itens;
create policy "simulado_itens: proprio usuario" on public.simulado_itens
  for all using (
    exists (select 1 from public.simulados s where s.id = simulado_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.simulados s where s.id = simulado_id and s.user_id = auth.uid())
  );

-- ============================================================
-- 7) EXPLICAÇÕES DA IA (cache — não é por usuário, é por questão)
-- ============================================================
create table if not exists public.explicacoes_ia (
  questao_id text primary key references public.questoes (id) on delete cascade,
  explicacao_simplificada text,
  pegadinha text,
  macete text,
  gerado_em timestamptz not null default now()
);

alter table public.explicacoes_ia enable row level security;
drop policy if exists "explicacoes_ia: leitura publica" on public.explicacoes_ia;
create policy "explicacoes_ia: leitura publica" on public.explicacoes_ia
  for select using (true);
drop policy if exists "explicacoes_ia: usuario logado grava" on public.explicacoes_ia;
create policy "explicacoes_ia: usuario logado grava" on public.explicacoes_ia
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- 8) INSIGHTS DA IA (cache por usuário, 1 por dia)
-- ============================================================
create table if not exists public.insights_ia (
  user_id uuid not null references auth.users (id) on delete cascade,
  gerado_em date not null default current_date,
  conteudo jsonb not null,
  primary key (user_id, gerado_em)
);

alter table public.insights_ia enable row level security;
drop policy if exists "insights_ia: proprio usuario" on public.insights_ia;
create policy "insights_ia: proprio usuario" on public.insights_ia
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 9) registrar_tentativa_v2 — grava resposta + revisão espaçada +
--    gamificação (xp, nível, streak, conquistas) num único passo
-- ============================================================
create or replace function public.registrar_tentativa_v2(
  p_questao_id text,
  p_alternativa text,
  p_acertou boolean,
  p_tempo_seg integer default null,
  p_dificuldade text default null, -- 'dificil' | 'medio' | 'facil' (só importa quando acertou)
  p_confianca integer default null,
  p_observacao text default null
) returns jsonb
language plpgsql
security invoker
as $$
declare
  v_prog record;
  v_mastery integer;
  v_success integer;
  v_error integer;
  v_stage text;
  v_dias integer;
  v_next date;
  v_revisao_bonus boolean := false;
  v_xp_ganho integer := 0;
  v_gam record;
  v_hoje date := current_date;
  v_conquistas_novas text[] := array[]::text[];
begin
  insert into public.tentativas (user_id, questao_id, alternativa_marcada, acertou, tempo_resolucao_seg)
  values (auth.uid(), p_questao_id, p_alternativa, p_acertou, p_tempo_seg);

  select * into v_prog from public.progresso
    where user_id = auth.uid() and questao_id = p_questao_id;

  v_revisao_bonus := found and coalesce(v_prog.tentativas, 0) > 0;
  v_mastery := coalesce(v_prog.mastery_level, 0);
  v_success := coalesce(v_prog.success_count, 0);
  v_error := coalesce(v_prog.error_count, 0);

  if p_acertou then
    v_success := v_success + 1;
    v_mastery := v_mastery + 1;
    if v_mastery >= 4 then
      v_stage := 'dominado'; v_dias := 30;
    elsif p_dificuldade = 'facil' then
      v_stage := 'facil'; v_dias := 15;
    elsif p_dificuldade = 'dificil' then
      v_stage := 'dificil'; v_dias := 3;
    else
      v_stage := 'acertou'; v_dias := 7;
    end if;
  else
    v_error := v_error + 1;
    v_mastery := 0;
    v_stage := 'erro'; v_dias := 1;
  end if;

  v_next := v_hoje + v_dias;

  insert into public.progresso (
    user_id, questao_id, status, tentativas, acertos,
    confianca, observacao, tempo_resolucao_seg, ultima_resolucao, proxima_revisao,
    review_stage, next_review_at, mastery_level, success_count, error_count, last_seen_at
  ) values (
    auth.uid(), p_questao_id,
    case when p_acertou then 'feita_certo' else 'feita_errado' end,
    1, case when p_acertou then 1 else 0 end,
    p_confianca, p_observacao, p_tempo_seg, now(), v_next,
    v_stage, v_next, v_mastery, v_success, v_error, now()
  )
  on conflict (user_id, questao_id) do update
  set status = case when p_acertou then 'feita_certo' else 'feita_errado' end,
      tentativas = public.progresso.tentativas + 1,
      acertos = public.progresso.acertos + case when p_acertou then 1 else 0 end,
      confianca = coalesce(p_confianca, public.progresso.confianca),
      observacao = coalesce(p_observacao, public.progresso.observacao),
      tempo_resolucao_seg = coalesce(p_tempo_seg, public.progresso.tempo_resolucao_seg),
      ultima_resolucao = now(),
      proxima_revisao = v_next,
      review_stage = v_stage,
      next_review_at = v_next,
      mastery_level = v_mastery,
      success_count = v_success,
      error_count = v_error,
      last_seen_at = now(),
      updated_at = now();

  -- Gamificação: XP (10 por acerto, +5 extra se era uma revisão) e streak diário
  if p_acertou then
    v_xp_ganho := 10 + (case when v_revisao_bonus then 5 else 0 end);
  end if;

  select * into v_gam from public.gamificacao where user_id = auth.uid();

  insert into public.gamificacao (user_id, xp, nivel, streak_atual, streak_recorde, ultima_atividade)
  values (auth.uid(), v_xp_ganho, greatest(1, floor(v_xp_ganho / 100.0) + 1)::int, 1, 1, v_hoje)
  on conflict (user_id) do update
  set xp = public.gamificacao.xp + v_xp_ganho,
      nivel = greatest(1, floor((public.gamificacao.xp + v_xp_ganho) / 100.0) + 1)::int,
      streak_atual = case
        when public.gamificacao.ultima_atividade = v_hoje then public.gamificacao.streak_atual
        when public.gamificacao.ultima_atividade = v_hoje - 1 then public.gamificacao.streak_atual + 1
        else 1
      end,
      streak_recorde = greatest(
        public.gamificacao.streak_recorde,
        case
          when public.gamificacao.ultima_atividade = v_hoje then public.gamificacao.streak_atual
          when public.gamificacao.ultima_atividade = v_hoje - 1 then public.gamificacao.streak_atual + 1
          else 1
        end
      ),
      ultima_atividade = v_hoje,
      updated_at = now();

  select * into v_gam from public.gamificacao where user_id = auth.uid();

  -- Conquistas por streak
  if v_gam.streak_atual >= 7 then
    insert into public.conquistas (user_id, codigo) values (auth.uid(), 'streak_7')
      on conflict (user_id, codigo) do nothing
      returning codigo into v_stage; -- reaproveitando variável só p/ checar insert
    if v_stage = 'streak_7' then v_conquistas_novas := array_append(v_conquistas_novas, 'streak_7'); end if;
  end if;
  if v_gam.streak_atual >= 30 then
    insert into public.conquistas (user_id, codigo) values (auth.uid(), 'streak_30')
      on conflict (user_id, codigo) do nothing
      returning codigo into v_stage;
    if v_stage = 'streak_30' then v_conquistas_novas := array_append(v_conquistas_novas, 'streak_30'); end if;
  end if;
  if v_gam.streak_atual >= 100 then
    insert into public.conquistas (user_id, codigo) values (auth.uid(), 'streak_100')
      on conflict (user_id, codigo) do nothing
      returning codigo into v_stage;
    if v_stage = 'streak_100' then v_conquistas_novas := array_append(v_conquistas_novas, 'streak_100'); end if;
  end if;

  return jsonb_build_object(
    'xp_ganho', v_xp_ganho,
    'xp_total', v_gam.xp,
    'nivel', v_gam.nivel,
    'streak_atual', v_gam.streak_atual,
    'conquistas_novas', to_jsonb(v_conquistas_novas)
  );
end;
$$;

-- ============================================================
-- 10) conceder_bonus_meta — dá +50xp uma vez por dia quando a meta bate
-- ============================================================
create or replace function public.conceder_bonus_meta(
  p_questoes_feitas integer,
  p_revisoes_feitas integer,
  p_minutos_feitos integer
) returns jsonb
language plpgsql
security invoker
as $$
declare
  v_cfg record;
  v_gam record;
  v_hoje date := current_date;
  v_bateu boolean;
begin
  select * into v_cfg from public.metas_config where user_id = auth.uid();
  if not found then
    insert into public.metas_config (user_id) values (auth.uid()) returning * into v_cfg;
  end if;

  v_bateu := p_questoes_feitas >= v_cfg.questoes_dia
    and p_revisoes_feitas >= v_cfg.revisoes_dia
    and p_minutos_feitos >= v_cfg.minutos_dia;

  select * into v_gam from public.gamificacao where user_id = auth.uid();
  if not found then
    insert into public.gamificacao (user_id) values (auth.uid()) returning * into v_gam;
  end if;

  if v_bateu and (v_gam.ultimo_bonus_meta is distinct from v_hoje) then
    update public.gamificacao
      set xp = xp + 50,
          nivel = greatest(1, floor((xp + 50) / 100.0) + 1)::int,
          ultimo_bonus_meta = v_hoje,
          updated_at = now()
      where user_id = auth.uid()
      returning * into v_gam;
    return jsonb_build_object('concedido', true, 'xp_total', v_gam.xp, 'nivel', v_gam.nivel);
  end if;

  return jsonb_build_object('concedido', false, 'xp_total', v_gam.xp, 'nivel', v_gam.nivel);
end;
$$;
