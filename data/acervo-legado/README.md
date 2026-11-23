# Acervo legado de questões

As 3.093 questões que já existiam no projeto foram preservadas no banco Supabase e no arquivo-fonte `data/questoes.json`.

Elas são classificadas como `concurso = LEGADO` e não ficam disponíveis para leitura no ambiente do aluno do TRT-4. Não foram apagadas nem convertidas em questões do TRT-4.

## Inclusão futura de questões TRT-4

Uma questão só deve ser disponibilizada no ambiente TRT-4 quando for validada para o edital e cadastrada com:

```json
{
  "concurso": "TRT4"
}
```

O script de importação considera `LEGADO` como padrão para impedir que o acervo antigo volte a ser exibido por engano.
