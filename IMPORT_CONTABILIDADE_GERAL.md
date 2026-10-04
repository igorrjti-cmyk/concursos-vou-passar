# Importação — Contabilidade Geral (TEC)

- Base anterior: **1.958 questões**.
- PDFs analisados: **529 ocorrências**, **528 IDs únicos**.
- IDs já existentes no projeto: **311**.
- Questões novas importadas: **217**.
- Total final em `data/questoes.json`: **2.175 questões únicas**.
- O caderno planejado de **220 questões novas/selecionadas** fica representado sem duplicação: em três tópicos (Rentabilidade/Lucratividade, Endividamento e Questões Mescladas), uma questão selecionada já existia na base, portanto foram acrescentados 217 novos IDs em vez de duplicar registros.
- Os **gabaritos dos PDFs do TEC** foram gravados no campo `answer`.
- Alternativas foram gravadas no campo `options`, incluindo itens Certo/Errado.
- Não foram inventadas resoluções comentadas: as novas questões ficam com `resolution: null`; o projeto pode gerar explicação por IA quando necessário.

Validações:
- IDs únicos no JSON final.
- Todas as 217 novas questões possuem enunciado, assunto, origem, ano, número da questão, alternativas e gabarito.
- Todo gabarito corresponde a uma alternativa existente.
