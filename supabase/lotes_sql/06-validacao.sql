-- PASSO 6 - Validação. Este arquivo NÃO altera dados.
SELECT
  COUNT(*) AS total_questoes,
  COUNT(DISTINCT id) AS ids_unicos,
  COUNT(*) FILTER (WHERE resolution IS NOT NULL) AS com_resolucao,
  COUNT(*) FILTER (WHERE prioridade_base IS NOT NULL) AS com_prioridade
FROM questoes;

SELECT prioridade_faixa, COUNT(*) AS quantidade
FROM questoes
GROUP BY prioridade_faixa
ORDER BY prioridade_faixa;

SELECT
  COUNT(*) FILTER (WHERE topic ILIKE '%Contabilidade Geral%' AND resolution IS NOT NULL) AS geral_resolvidas,
  COUNT(*) FILTER (WHERE topic ILIKE '%Contabilidade de Custos%' AND resolution IS NOT NULL) AS custos_resolvidas,
  COUNT(*) FILTER (WHERE (topic ILIKE '%Contabilidade Pública%' OR topic ILIKE '%Administração Financeira%' OR topic ILIKE '%AFO%' OR topic ILIKE '%Direito Financeiro%' OR topic ILIKE '%LRF%' OR topic ILIKE '%Lei de Responsabilidade Fiscal%') AND resolution IS NOT NULL) AS publica_afo_df_resolvidas
FROM questoes;
