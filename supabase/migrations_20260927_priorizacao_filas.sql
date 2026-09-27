-- Priorização estratégica das questões sem apagar a classificação histórica.
-- Mantém: rank, band e score.
-- Acrescenta: prioridade_base e prioridade_faixa.
-- P0 fica reservado para lacunas do edital que ainda não têm questão no banco.

alter table public.questoes
  add column if not exists prioridade_base integer,
  add column if not exists prioridade_faixa text;

create index if not exists questoes_prioridade_idx
  on public.questoes (prioridade_base desc, rank asc);

-- Os valores abaixo são preenchidos pelo arquivo de seed gerado junto deste projeto.
-- Se a tabela já estiver populada, execute também:
-- supabase/seed-priorizacao.sql
