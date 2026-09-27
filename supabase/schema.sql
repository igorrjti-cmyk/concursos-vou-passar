-- FAFIPA Study OS — schema do Supabase
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run

-- ============================================================
-- 1) QUESTOES — banco de questões, fila 1→965 já priorizada
-- ============================================================
create table if not exists public.questoes (
  id text primary key,                 -- id da questão no TEC Concursos
  rank integer not null unique,        -- classificação histórica/original do banco (preservada)
  prioridade_base integer,              -- prioridade estratégica nova (0-100)
  prioridade_faixa text,                -- P1/P2/P3/P4; P0 é reservado a lacunas sem questão
  topic text,
  origin text,
  file_source text,                    -- caderno de origem (ex.: "Caderno Contabilidade Pública Parte 2")
  stem text not null,                  -- enunciado
  options jsonb not null,              -- [["A","texto"], ["B","texto"], ...]
  answer text not null,                -- gabarito, ex. "B"
  year integer,
  qnum integer,
  score integer,
  band text,
  resolution jsonb,                    -- {regra, passos[], calculo, correta, erradas[], fundamento, pegadinha, cobranca}
  summary text,
  tec_link text generated always as (
    'https://www.tecconcursos.com.br/questoes/' || id
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists questoes_rank_idx on public.questoes (rank);
create index if not exists questoes_prioridade_idx on public.questoes (prioridade_base desc, rank asc);
create index if not exists questoes_topic_idx on public.questoes (topic);

-- Leitura pública das questões (não há dado sensível aqui; login continua exigido
-- para gravar progresso). Se preferir travar, troque "true" por uma checagem de auth.
alter table public.questoes enable row level security;
drop policy if exists "questoes: leitura publica" on public.questoes;
create policy "questoes: leitura publica" on public.questoes
  for select using (true);

-- Como este é um app de uso pessoal (você é o único usuário autenticado),
-- qualquer usuário logado pode atualizar o campo de resolução pela tela
-- /admin (usada para colar os lotes de resolução gerados fora do app).
drop policy if exists "questoes: usuario logado atualiza resolucao" on public.questoes;
create policy "questoes: usuario logado atualiza resolucao" on public.questoes
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 2) PROGRESSO — 1 linha por usuário x questão
-- ============================================================
create table if not exists public.progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  questao_id text not null references public.questoes (id) on delete cascade,
  status text not null default 'nao_iniciada'
    check (status in ('nao_iniciada', 'feita_certo', 'feita_errado', 'duvida')),
  tentativas integer not null default 0,
  acertos integer not null default 0,
  confianca integer check (confianca between 1 and 5),
  observacao text,
  tempo_resolucao_seg integer,
  ultima_resolucao timestamptz,
  proxima_revisao date,
  updated_at timestamptz not null default now(),
  unique (user_id, questao_id)
);

create index if not exists progresso_user_idx on public.progresso (user_id);
create index if not exists progresso_status_idx on public.progresso (user_id, status);
create index if not exists progresso_revisao_idx on public.progresso (user_id, proxima_revisao);

alter table public.progresso enable row level security;
drop policy if exists "progresso: proprio usuario" on public.progresso;
create policy "progresso: proprio usuario" on public.progresso
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 3) TENTATIVAS — histórico de cada resposta (opcional, mas útil
--    para a central de erros e para medir evolução ao longo do tempo)
-- ============================================================
create table if not exists public.tentativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  questao_id text not null references public.questoes (id) on delete cascade,
  alternativa_marcada text,
  acertou boolean not null,
  tempo_resolucao_seg integer,
  criado_em timestamptz not null default now()
);

create index if not exists tentativas_user_idx on public.tentativas (user_id, criado_em desc);
create index if not exists tentativas_questao_idx on public.tentativas (user_id, questao_id);

alter table public.tentativas enable row level security;
drop policy if exists "tentativas: proprio usuario" on public.tentativas;
create policy "tentativas: proprio usuario" on public.tentativas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Função utilitária: registrar uma tentativa e atualizar o progresso
-- num único passo (evita duas viagens ao banco a partir do app)
-- ============================================================
create or replace function public.registrar_tentativa(
  p_questao_id text,
  p_alternativa text,
  p_acertou boolean,
  p_tempo_seg integer default null,
  p_confianca integer default null,
  p_observacao text default null,
  p_proxima_revisao date default null
) returns void
language plpgsql
security invoker
as $$
begin
  insert into public.tentativas (user_id, questao_id, alternativa_marcada, acertou, tempo_resolucao_seg)
  values (auth.uid(), p_questao_id, p_alternativa, p_acertou, p_tempo_seg);

  insert into public.progresso (
    user_id, questao_id, status, tentativas, acertos,
    confianca, observacao, tempo_resolucao_seg, ultima_resolucao, proxima_revisao
  )
  values (
    auth.uid(), p_questao_id,
    case when p_acertou then 'feita_certo' else 'feita_errado' end,
    1, case when p_acertou then 1 else 0 end,
    p_confianca, p_observacao, p_tempo_seg, now(), p_proxima_revisao
  )
  on conflict (user_id, questao_id) do update
  set status = case when p_acertou then 'feita_certo' else 'feita_errado' end,
      tentativas = public.progresso.tentativas + 1,
      acertos = public.progresso.acertos + case when p_acertou then 1 else 0 end,
      confianca = coalesce(p_confianca, public.progresso.confianca),
      observacao = coalesce(p_observacao, public.progresso.observacao),
      tempo_resolucao_seg = coalesce(p_tempo_seg, public.progresso.tempo_resolucao_seg),
      ultima_resolucao = now(),
      proxima_revisao = coalesce(p_proxima_revisao, public.progresso.proxima_revisao),
      updated_at = now();
end;
$$;

-- ============================================================
-- 11) SESSÕES DA FILA — posição de estudo por combinação de filtros
-- ============================================================
create table if not exists public.sessoes_fila (
  user_id uuid not null references auth.users (id) on delete cascade,
  filtro_chave text not null,
  filtros jsonb not null default '{}'::jsonb,
  ultimo_rank integer not null default 0,
  ultima_questao_id text references public.questoes (id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, filtro_chave)
);

create index if not exists sessoes_fila_user_idx on public.sessoes_fila (user_id, atualizado_em desc);

alter table public.sessoes_fila enable row level security;
drop policy if exists "sessoes_fila: proprio usuario" on public.sessoes_fila;
create policy "sessoes_fila: proprio usuario" on public.sessoes_fila
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
