-- FAFIPA Study OS — posição de estudo por combinação de filtros da Fila.
-- Rode no Supabase > SQL Editor > New query > Run.

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
