# SQL compactado

O projeto foi enxugado para evitar carregar scripts históricos de importação/auditoria no deploy.

## Mantidos
- `supabase/migrations_20260927_fila_no_banco.sql`
- `supabase/migrations_20260927_priorizacao_filas.sql`
- `supabase/migrations_20260927_sessoes_fila.sql`
- `supabase/migrations_20260927_v6v7_gamificacao_ia.sql`
- `supabase/schema.sql`

## Removidos do pacote
Foram removidos 44 scripts SQL históricos, principalmente:
- `supabase/seed-partes/`
- `supabase/sincronizar_377_faltantes/`
- `supabase/lotes_sql/`
- seeds/auditoria pontuais já executados

Esses arquivos não são necessários para o funcionamento do frontend em produção.
As correções operacionais do banco devem ser guardadas separadamente do pacote de deploy.
