-- Move o cálculo da fila (filaDinamica/filaSortScore, hoje em lib/prioridade.ts)
-- para dentro do banco, para as páginas pararem de baixar a tabela `questoes`
-- inteira (fetchAllPages) só para filtrar/ordenar no navegador.
--
-- auth.uid() é usado internamente em vez de receber o user_id como parâmetro,
-- para que ninguém consiga passar o id de outra pessoa e enxergar o
-- tentativas/acertos (progresso) de outro usuário através do resultado.
--
-- IMPORTANTE: se algum dia mudar a lógica em lib/prioridade.ts, replique a
-- mudança aqui também — as duas cópias precisam ficar em sincronia enquanto
-- não migrarmos 100% do cálculo para o banco.

create or replace function public.fila_base_filtrada(
  p_materia text default 'todas',
  p_fila text default 'todas',
  p_status text default 'todas',
  p_busca text default ''
)
returns table (
  id text,
  rank integer,
  prioridade_base integer,
  prioridade_faixa text,
  topic text,
  score integer,
  band text,
  status text,
  tentativas integer,
  acertos integer,
  acc numeric,
  fila text,
  sort_score numeric
)
language sql
stable
security invoker
as $$
  with j as (
    select
      q.id, q.rank, q.prioridade_base, q.prioridade_faixa, q.topic, q.score, q.band,
      coalesce(p.status, 'nao_iniciada') as status,
      p.tentativas, p.acertos,
      case
        when p.tentativas is null or p.tentativas = 0 or p.acertos is null then null
        else (p.acertos::numeric / p.tentativas) * 100
      end as acc
    from public.questoes q
    left join public.progresso p on p.questao_id = q.id and p.user_id = auth.uid()
    where (p_materia = 'todas' or q.topic like p_materia || ' - %')
      and (
        p_busca = '' or
        (coalesce(q.topic, '') || ' ' || q.stem || ' ' || q.rank::text) ilike '%' || p_busca || '%'
      )
  ),
  s as (
    select j.*,
      case
        when coalesce(prioridade_base, 0) < 65 then 'cobertura'
        when acc is null or acc < 70 or status in ('feita_errado', 'duvida') then 'ataque'
        when acc < 90 then 'consolidacao'
        else 'manutencao'
      end as fila,
      coalesce(prioridade_base, 0)
        + (case when acc is null then 0 when acc < 70 then 20 when acc < 90 then 8 else -8 end)
        + (case when status in ('feita_errado', 'duvida') then 12 else 0 end) as sort_score
    from j
  )
  select id, rank, prioridade_base, prioridade_faixa, topic, score, band,
         status, tentativas, acertos, acc, fila, sort_score
  from s
  where (p_status = 'todas' or status = p_status)
    and (p_fila = 'todas' or fila = p_fila);
$$;

-- Página pronta (já filtrada, ordenada e paginada) para a lista da fila.
-- total_count vem via window function, então o front sabe o total sem um
-- segundo round-trip.
create or replace function public.fila_pagina(
  p_materia text default 'todas',
  p_fila text default 'todas',
  p_status text default 'todas',
  p_busca text default '',
  p_ordenar_por text default 'score', -- 'score' (fila inteligente) ou 'rank' (sequência estável)
  p_limit integer default 40,
  p_offset integer default 0
)
returns table (
  id text,
  rank integer,
  prioridade_base integer,
  prioridade_faixa text,
  topic text,
  score integer,
  band text,
  status text,
  tentativas integer,
  acertos integer,
  acc numeric,
  fila text,
  sort_score numeric,
  total_count bigint
)
language sql
stable
security invoker
as $$
  select *, count(*) over() as total_count
  from public.fila_base_filtrada(p_materia, p_fila, p_status, p_busca)
  order by
    case when p_ordenar_por = 'rank' then rank end asc,
    case when p_ordenar_por = 'score' then sort_score end desc,
    rank asc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

-- Contagem por fila (ataque/consolidação/manutenção/cobertura) para os cards
-- de resumo — mesmos filtros da lista, sem trazer as linhas.
create or replace function public.fila_contagens(
  p_materia text default 'todas',
  p_fila text default 'todas',
  p_status text default 'todas',
  p_busca text default ''
)
returns table (fila text, total bigint)
language sql
stable
security invoker
as $$
  select fila, count(*) as total
  from public.fila_base_filtrada(p_materia, p_fila, p_status, p_busca)
  group by fila;
$$;

-- Substitui o "baixar tudo e ordenar por rank no cliente" que existia só para
-- achar a primeira questão da sequência e a próxima depois de ultimo_rank.
create or replace function public.fila_navegacao(
  p_materia text default 'todas',
  p_fila text default 'todas',
  p_status text default 'todas',
  p_busca text default '',
  p_ultimo_rank integer default 0
)
returns table (
  primeira_id text,
  primeira_rank integer,
  retomada_id text,
  retomada_rank integer
)
language sql
stable
security invoker
as $$
  with f as (
    select id, rank from public.fila_base_filtrada(p_materia, p_fila, p_status, p_busca)
  )
  select
    (select id from f order by rank asc limit 1),
    (select rank from f order by rank asc limit 1),
    (select id from f where rank > p_ultimo_rank order by rank asc limit 1),
    (select rank from f where rank > p_ultimo_rank order by rank asc limit 1);
$$;

grant execute on function public.fila_base_filtrada(text, text, text, text) to authenticated;
grant execute on function public.fila_pagina(text, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.fila_contagens(text, text, text, text) to authenticated;
grant execute on function public.fila_navegacao(text, text, text, text, integer) to authenticated;

-- Usado pela tela da questão (app/questao/[id]) quando ela é aberta sem vir de
-- uma fila filtrada: acha a próxima questão pela ordem de score (mesma lógica
-- de filaSortScore), sem baixar as 965+ questões + progresso no cliente.
create or replace function public.fila_proxima_sem_contexto(p_questao_atual_id text)
returns table (proxima_id text, proxima_rank integer)
language sql
stable
security invoker
as $$
  with atual as (
    select sort_score as s, rank as r
    from public.fila_base_filtrada('todas', 'todas', 'todas', '')
    where id = p_questao_atual_id
  )
  select f.id as proxima_id, f.rank as proxima_rank
  from public.fila_base_filtrada('todas', 'todas', 'todas', '') f, atual
  where f.id <> p_questao_atual_id
    and (f.sort_score < atual.s or (f.sort_score = atual.s and f.rank > atual.r))
  order by f.sort_score desc, f.rank asc
  limit 1;
$$;

grant execute on function public.fila_proxima_sem_contexto(text) to authenticated;
