-- Metadados e prioridade específica da banca FAFIPA.
alter table public.questoes
  add column if not exists banca text,
  add column if not exists is_fafipa boolean not null default false,
  add column if not exists prioridade_fafipa integer not null default 0;

create index if not exists questoes_fafipa_idx
  on public.questoes (is_fafipa desc, prioridade_fafipa desc, prioridade_base desc, rank asc);
