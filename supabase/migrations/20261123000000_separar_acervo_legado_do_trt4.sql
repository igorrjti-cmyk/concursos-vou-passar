-- Separa o acervo antigo do banco de questões do concurso TRT-4.
-- Todas as questões já existentes recebem LEGADO pelo DEFAULT e permanecem armazenadas.
alter table public.questoes
  add column if not exists concurso text not null default 'LEGADO';

alter table public.questoes
  drop constraint if exists questoes_concurso_check;

alter table public.questoes
  add constraint questoes_concurso_check
  check (concurso in ('LEGADO', 'TRT4'));

create index if not exists questoes_concurso_rank_idx
  on public.questoes (concurso, rank);

alter table public.questoes enable row level security;

drop policy if exists "questoes: somente concurso TRT4" on public.questoes;

create policy "questoes: somente concurso TRT4"
  on public.questoes
  as restrictive
  for select
  to public
  using (concurso = 'TRT4');
