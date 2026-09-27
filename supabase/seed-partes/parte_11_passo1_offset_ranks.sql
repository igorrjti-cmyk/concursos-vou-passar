-- Parte 11, passo 1 de 3 — RODAR PRIMEIRO.
-- Empurra o rank das 964 questões de Contabilidade já existentes para fora da faixa
-- 1..1958, evitando conflito de unicidade quando as novas questões (Português,
-- Informática, Matemática Financeira, Estatística) forem inseridas com os ranks
-- finais intercalados nos passos seguintes. É seguro rodar de novo se precisar
-- (basta rodar antes do passo 2 sempre).
update public.questoes set rank = rank + 100000;
