# V4.3 — correção do classificador de matérias

A V4.2 continha `lib/materiaPorId.ts` e o import, mas `materiaDaQuestao()` não consultava o mapa.
Isso fazia o dashboard continuar classificando pelo texto de `topic`.

Corrigido:
- consulta `MATERIA_POR_ID[String(q.id)]` primeiro;
- fallback por `topic` permanece;
- Informática: 374;
- totais por matéria fecham 3.093;
- cache local `tsconfig.tsbuildinfo` removido do pacote.
