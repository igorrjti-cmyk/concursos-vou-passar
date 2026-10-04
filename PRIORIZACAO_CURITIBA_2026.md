# Priorização Curitiba 2026 — FAFIPA

Esta versão incorpora as Partes 4 e 5 de **CASP, AFO e Direito Financeiro** e grava a prioridade diretamente em `data/questoes.json`.

## Regra da fila

1. Questão já errada ou marcada como dúvida recebe prioridade dinâmica máxima.
2. Dentro do banco não dominado, prevalece a prioridade estratégica do assunto.
3. Questões FAFIPA recebem bônus de atualidade: 2026 > 2025 > 2024 > 2022/2023 > anteriores.
4. Questões recentes de outras bancas entram como complemento, sem ultrapassar o núcleo FAFIPA quando o assunto já está bem coberto.

## Núcleo CASP + AFO + Direito Financeiro

Prioridade máxima para PCASP/MCASP 11; receita; despesa; DCASP; LRF; Lei 4.320; PPA/LDO/LOA; restos a pagar; princípios; créditos adicionais; RREO/RGF; Estrutura Conceitual/NBC TSP; patrimônio/mensuração; NBC TSP 34.

Tópicos específicos de Curitiba (IPC/MSC/SIM-AM/EFD-Reinf/DCTFWeb/PASEP/CDP/DIPR/SIOPE/SIOPS) devem receber prioridade alta quando existirem no banco; lacunas sem questão continuam exigindo revisão teórica dirigida.

## Dados

- 2.335 questões únicas no JSON final.
- +160 questões importadas das Partes 4 e 5 de Contabilidade Pública.
- `scripts/seed.mjs` agora envia `prioridade_base` e `prioridade_faixa` ao Supabase.
- `supabase/seed-priorizacao.sql` foi regenerado para o banco atual.
