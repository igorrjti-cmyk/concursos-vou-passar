# V5.9 — Correção da fila de questões

Correção do travamento/repetição após responder poucas questões.

- `modo=inicio` e `modo=retomar` agora são reconhecidos como contexto de fila.
- `prioridade` também é reconhecida no contexto.
- A página da questão passa a paginar `questoes` e `progresso` com `fetchAllPages`, evitando o limite do PostgREST/Supabase.
- A próxima questão segue: P1+ inédita → P1 inédita → revisão vencida de erro/dúvida → P2 inédita → P3 inédita.
- P4 permanece fora do fluxo normal.
- Questão errada não reaparece imediatamente por `erroBoost`; volta quando `proxima_revisao` estiver vencida.
- Fallback defensivo procura questão inédita antes de encerrar a fila.
- Histórico, tentativas, XP, progresso e dados do Supabase não são apagados nem recalibrados.
