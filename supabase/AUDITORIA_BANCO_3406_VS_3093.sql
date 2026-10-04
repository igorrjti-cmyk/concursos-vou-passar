-- Diagnóstico somente leitura. Não altera dados.
SELECT COUNT(*) AS total_questoes FROM public.questoes;

SELECT prioridade_faixa, COUNT(*) AS quantidade
FROM public.questoes
GROUP BY prioridade_faixa
ORDER BY prioridade_faixa;

SELECT
  CASE
    WHEN id::text LIKE 'LEG-AUT-%' OR topic ~ '^(Lei Orgânica|Lei 1\\.656|Lei 7\\.671|LC 40|LC 101|Decreto 2\\.05|Decreto 2\\.06|Decretos 2\\.051|Legislação Municipal)' THEN 'Legislação Municipal'
    WHEN topic LIKE 'AFO, Direito Financeiro e Contabilidade Pública%' THEN 'Contabilidade Pública / AFO'
    WHEN topic LIKE 'Língua Portuguesa%' OR topic LIKE 'Literatura Brasileira%' THEN 'Português'
    WHEN topic LIKE 'Contabilidade Geral%' THEN 'Contabilidade Geral'
    WHEN topic LIKE 'Contabilidade de Custos%' THEN 'Contabilidade de Custos'
    WHEN topic LIKE 'Informática%' THEN 'Informática'
    WHEN topic LIKE 'Matemática Financeira%' THEN 'Matemática Financeira'
    WHEN topic LIKE 'Estatística%' THEN 'Estatística'
    ELSE 'Outros'
  END AS materia,
  COUNT(*) AS quantidade
FROM public.questoes
GROUP BY 1
ORDER BY quantidade DESC;

-- Os registros em "Outros" são os primeiros candidatos a explicar
-- diferenças entre o total do banco e o banco curado do concurso.
SELECT id, rank, file, topic, prioridade_faixa
FROM public.questoes
WHERE NOT (
  id::text LIKE 'LEG-AUT-%'
  OR topic ~ '^(Lei Orgânica|Lei 1\\.656|Lei 7\\.671|LC 40|LC 101|Decreto 2\\.05|Decreto 2\\.06|Decretos 2\\.051|Legislação Municipal)'
  OR topic LIKE 'AFO, Direito Financeiro e Contabilidade Pública%'
  OR topic LIKE 'Língua Portuguesa%' OR topic LIKE 'Literatura Brasileira%'
  OR topic LIKE 'Contabilidade Geral%'
  OR topic LIKE 'Contabilidade de Custos%'
  OR topic LIKE 'Informática%'
  OR topic LIKE 'Matemática Financeira%'
  OR topic LIKE 'Estatística%'
)
ORDER BY rank;
