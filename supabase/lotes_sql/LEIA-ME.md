# SQL em lotes — Supabase

O SQL único excedeu o limite do SQL Editor web. Execute estes arquivos **um por vez**, nesta ordem:

1. `01-importar-47-custos.sql`
2. `02-resolucoes-contabilidade-geral.sql`
3. `03-resolucoes-publica-afo-direito-financeiro-parte-1.sql`
4. `04-resolucoes-publica-afo-direito-financeiro-parte-2.sql`
5. `05-resolucoes-custos.sql`
6. `06-validacao.sql`

Cada arquivo de alteração usa `BEGIN`/`COMMIT`. Se um lote falhar, não avance: copie a mensagem de erro para o ChatGPT. O arquivo 06 apenas consulta e não altera dados.
