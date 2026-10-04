# V5.1 — Estudar agora inteligente

O botão **Estudar agora** agora escolhe a próxima questão pela seguinte ordem:

1. P1+ ainda não respondidas
2. P1 ainda não respondidas
3. questões marcadas como erro ou dúvida
4. P2 ainda não respondidas
5. P3 ainda não respondidas

P4 é excluída do fluxo normal.

Dentro da mesma etapa, o sistema considera prioridade, matéria e rank. A retomada de uma sessão já iniciada continua usando a posição salva, para preservar compatibilidade com o histórico atual.

Esta é uma primeira versão deliberadamente simples; ela usa somente dados que o sistema já possui e não exige migration ou SQL novo.
