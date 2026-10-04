-- Execute somente depois dos 8 lotes. Não altera dados.
SELECT
  COUNT(*) AS total_questoes,
  COUNT(DISTINCT id) AS ids_unicos,
  COUNT(*) FILTER (WHERE resolution IS NOT NULL) AS com_resolucao,
  COUNT(*) FILTER (WHERE prioridade_base IS NOT NULL) AS com_prioridade
FROM public.questoes;

SELECT
  COUNT(*) FILTER (WHERE topic ILIKE '%Contabilidade Geral%' AND resolution IS NOT NULL) AS geral_resolvidas,
  COUNT(*) FILTER (WHERE topic ILIKE '%Contabilidade de Custos%' AND resolution IS NOT NULL) AS custos_resolvidas,
  COUNT(*) FILTER (WHERE (topic ILIKE '%Contabilidade Pública%' OR topic ILIKE '%Administração Financeira%' OR topic ILIKE '%AFO%' OR topic ILIKE '%Direito Financeiro%' OR topic ILIKE '%LRF%' OR topic ILIKE '%Lei de Responsabilidade Fiscal%') AND resolution IS NOT NULL) AS publica_afo_df_resolvidas
FROM public.questoes;

SELECT
  COUNT(*) FILTER (WHERE rank BETWEEN 1959 AND 2175) AS geral_novas_presentes,
  COUNT(*) FILTER (WHERE rank BETWEEN 2176 AND 2335) AS publica_novas_presentes,
  COUNT(*) FILTER (WHERE rank BETWEEN 2336 AND 2382) AS custos_novas_presentes
FROM public.questoes;
