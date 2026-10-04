# FAFIPA Study OS — Contador Curitiba 2026

Fila priorizada de questões (FAFIPA) com resolução individual, central de
erros, revisão espaçada automática, favoritos, metas diárias, gamificação
(XP/nível/streak/medalhas), simulados com cronômetro, busca global,
dashboard de desempenho e um explicador de questões com IA (Gemini) —
rodando em Next.js + Supabase + Vercel, com progresso sincronizado entre PC,
celular e notebook.

## O que já vem pronto

- **964 questões** extraídas do seu painel HTML V5, já na ordem de prioridade
  (`rank` 1 → 965, com um número pulado por causa de uma duplicata removida),
  em `data/questoes.json` — depois ampliado para **2.175 questões** com a
  entrada de Português, Informática, Matemática Financeira e Estatística.
- **160+ resoluções individuais** já incluídas no mesmo arquivo.
- Schema completo do Supabase em `supabase/schema.sql`, mais as migrações de
  priorização (`migrations_20260927_priorizacao_filas.sql`) e de
  gamificação/IA (`migrations_20260927_v6v7_gamificacao_ia.sql`).
- App Next.js com: painel, filas inteligentes (A/B/C/D por prioridade e
  domínio), tela de questão (responder + resolução + explicação por IA +
  revisão espaçada + favoritar), central de erros (hoje/recorrentes/por
  disciplina), revisão, favoritos, metas diárias, simulados com cronômetro,
  desempenho (XP/nível/streak + insights por IA) e busca global. A antiga
  tela `/admin` de colar resoluções manualmente foi removida.

## Passo a passo do deploy

### 1. Criar o projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) → **New project**.
2. Anote a **senha do banco** que você definir.
3. Quando o projeto terminar de provisionar, vá em **SQL Editor** → **New
   query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
4. Vá em **Project Settings → API** e anote:
   - `Project URL`
   - `anon public key`
   - `service_role key` (fica em "Project API keys" — mantenha em segredo)
5. O login deste app é por **e-mail + senha** (não há tela de cadastro
   pública). Crie seu usuário manualmente em **Authentication → Users →
   Add user**, preenchendo e-mail e senha e marcando **Auto Confirm User**
   (assim ele já entra confirmado, sem precisar clicar em link de
   e-mail). Se quiser trocar a senha depois, edite o mesmo usuário ali.

### 2. Configurar o projeto localmente
```bash
cd fafipa-study-os
npm install
cp .env.example .env.local
```
Edite `.env.local` com os três valores do passo 1 (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### 3. Popular o banco com as 964 questões

**Opção A — sem terminal (recomendado se você não usa Node.js):**
Use os arquivos prontos em `supabase/seed-partes/` (`parte_01.sql` até
`parte_10.sql`). No Supabase, vá em **SQL Editor → New query**, abra cada
arquivo num editor de texto, cole o conteúdo e clique **Run** — um de cada
vez, na ordem. Todos usam `on conflict (id) do update`, então é seguro rodar
de novo se precisar. Se algum arquivo der o erro "Query is too large", me
avise qual número que eu divido ele em partes menores.

**Opção B — com terminal e Node.js instalado:**
```bash
npm run seed
```
Isso grava todas as questões (com as 160 resoluções já prontas) de uma vez.
Rode de novo sempre que quiser reimportar `data/questoes.json` (ele
sobrescreve pelo `id`, então é seguro rodar mais de uma vez).

Teste localmente antes de publicar:
```bash
npm run dev
```
Abra `http://localhost:3000`, entre com o e-mail e a senha que você criou no
passo 1.5 e confira se a fila carrega.

### 4. Subir para o GitHub
```bash
git init
git add .
git commit -m "FAFIPA Study OS — versão inicial"
gh repo create fafipa-study-os --private --source=. --push
# (ou crie o repo pelo site do GitHub e rode git remote add origin ... && git push)
```

### 5. Deploy na Vercel
1. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o
   repositório `fafipa-study-os`.
2. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a `service_role` **não** vai para a
   Vercel — ela só é usada localmente pelo `npm run seed`).
3. Deploy. Como o login é por e-mail+senha, não é preciso configurar
   Redirect URLs no Supabase.

Pronto — o painel está no ar, com progresso salvo no Supabase (não mais no
navegador).

## Adicionando novas resoluções (a tela /admin foi removida)

A antiga tela `/admin` de colar JSON de resolução foi removida na V6/V7.
Agora há duas formas de preencher a `resolution` de uma questão:

1. **Manual, direto no banco** — gere um `UPDATE public.questoes SET resolution = ...
   WHERE id = '...'` e rode no SQL Editor do Supabase (é o que fizemos até
   aqui pelas conversas anteriores).
2. **Automático, sob demanda, pela IA (V7)** — dentro da tela de qualquer
   questão respondida, o aluno pode clicar em "Gerar com IA" no bloco
   "Explicação simplificada": o Gemini gera uma explicação simplificada +
   pegadinha + macete (não substitui a `resolution` oficial, mas cobre o
   mesmo objetivo de ajudar a entender a questão) e fica em cache — nunca
   chama a IA duas vezes para a mesma questão.

## Estrutura do projeto

```
app/                páginas: painel, fila, questão, erros, revisão,
                     favoritos, metas, simulados, desempenho, buscar
app/api/explicar     rota de API — explicador híbrido com Gemini (V7)
app/api/insights     rota de API — insights inteligentes com Gemini (V7)
lib/ai/              cliente Gemini, prompts e schemas (V7)
lib/supabaseServer.ts cliente Supabase para as rotas de API
lib/prioridade.ts    fila dinâmica (Ataque/Consolidação/Manutenção/Cobertura)
lib/paginar.ts        pagina consultas do Supabase acima de 1.000 linhas
components/          Nav (desktop) e MobileStudyBar (barra fixa mobile)
supabase/schema.sql                       schema base
supabase/migrations_20260927_priorizacao_filas.sql  prioridade_base / filas dinâmicas
supabase/migrations_20260927_v6v7_gamificacao_ia.sql revisão espaçada avançada,
                     favoritos, metas, gamificação, conquistas, simulados, cache de IA
supabase/seed-partes/           964+994 questões em blocos prontos para colar
scripts/seed.mjs     importa data/questoes.json via terminal (alternativa)
data/questoes.json   as 2.175 questões (1.958 anteriores + 217 novas de Contabilidade Geral)
```

## Atualização — Português, Informática, Matemática Financeira e Estatística
entraram na fila (setembro/2026)

O banco cresceu de **964 para 1.958 questões**. Foram extraídas e priorizadas as
questões dos 6 cadernos novos que você mandou (Português Partes 1 e 2,
Informática Partes 1 e 2, Matemática Financeira e Estatística), com base no
edital verticalizado do Contador — Prefeitura de Curitiba (FAFIPA):

- A Prova Objetiva tem **40 questões, todas eliminatórias e classificatórias**,
  valendo 2,00 pontos cada: 5 de Língua Portuguesa, 5 de Noções de Informática e
  30 de Conhecimentos Específicos.
- Dentro dos 30 de Específicos, pela contagem de itens do edital verticalizado,
  a fatia estimada é: ~23 de Contabilidade/AFO/Direito Financeiro (já 100%
  coberta pelas 964 questões originais), ~3 de Matemática Financeira, ~2 de
  Estatística e ~2 de Legislação Municipal (sem material ainda).
- **Português e Informática são menores em volume mas eliminatórias e muito
  repetitivas de banca para banca** (atalhos, fórmulas de Excel, protocolos) —
  alto retorno por hora de estudo. Por isso entram logo depois do topo do
  banco de Contabilidade (rank 716–1489), não no fim da fila.
- **Matemática Financeira e Estatística** têm menos questões na prova mas são
  muito mecânicas (fórmulas fixas) — entram intercaladas com a banda média/C
  de Contabilidade (rank 1490–1958).
- As **964 questões de Contabilidade mantiveram seu score/band originais** — só
  o `rank` foi recalculado para abrir espaço às novas matérias na posição
  correta, e 439 delas ganharam a resolução que estava faltando (lote
  cumulativo de resoluções 121–560 que você mandou no zip).

### Rodando a atualização no Supabase

Os arquivos ficam em `supabase/seed-partes/`, numerados na ordem certa —
**rode-os em ordem crescente, um de cada vez, no SQL Editor**:

1. `parte_11_passo1_offset_ranks.sql` — roda sozinho, sem risco: só empurra o
   rank das 964 questões antigas para uma faixa alta (rank + 100000), abrindo
   espaço para o rank final das questões novas sem violar a restrição de
   unicidade.
2. `parte_12` a `parte_19_passo2_novas_materias.sql` — inserem as 994 questões
   novas (Português, Informática, Matemática Financeira, Estatística) já no
   rank final e intercalado.
3. `parte_20` a `parte_26_passo3_reindex_e_resolucoes.sql` — trazem as 964
   questões de Contabilidade de volta ao rank final correto e gravam as 439
   resoluções novas.

Se algum arquivo der "Query is too large" no SQL Editor, me avise qual número
que eu quebro em partes menores. `data/questoes.json` já está com as 2.175
questões e pode ser usado direto com `npm run seed` em vez do SQL manual, se
preferir.

## Próximos passos sugeridos

- As ~994 questões novas ainda não têm o campo `resolution` preenchido — vá
  gerando os lotes de resolução (mesmo formato do `/admin`) e colando por lá,
  matéria por matéria; sugiro começar por Informática e Português (maior
  prioridade) e depois Matemática Financeira/Estatística.
- Ainda falta Legislação Municipal no banco (Lei Orgânica de Curitiba,
  Estatuto do Servidor, Código Tributário Municipal etc.) — não veio caderno
  de questões dessa matéria; se você tiver ou gerar um, mando entrar na fila
  também, provavelmente na mesma faixa de prioridade de Matemática
  Financeira/Estatística.

## Priorização estratégica de questões (2026-09-27)

A classificação histórica foi preservada:
- `rank`: ordem histórica/priorização anterior do banco;
- `band`: A/B/C original;
- `score`: score original.

Foi acrescentada uma camada independente:
- `prioridade_base`: 0–100, calculada a partir de aderência ao núcleo do edital, frequência do tópico no banco, band, rank histórico, tópicos centrais e sinal de recência FAFIPA;
- `prioridade_faixa`: P1/P2/P3/P4. P0 continua reservado a lacunas do edital que ainda não possuem questão suficiente no banco.

As filas dinâmicas são:
- **Fila A — Ataque:** alta importância + baixo domínio;
- **Fila B — Consolidação:** alta importância + domínio intermediário;
- **Fila C — Manutenção:** alta importância + domínio alto;
- **Fila D — Cobertura:** complemento/expansão.

A fila dinâmica usa o histórico da tabela `progresso` e não apaga a classificação anterior.

### Aplicação no Supabase
1. Execute `supabase/migrations_20260927_priorizacao_filas.sql`.
2. Depois execute `supabase/seed-priorizacao.sql`.
3. O app passa a ordenar a fila pela prioridade estratégica e pelo domínio do usuário.

## Correção da paginação do banco

A tela **Filas inteligentes** não usa 1.000 como limite do banco. A busca é paginada em blocos de até 1.000 linhas e a tela também consulta o `count` exato da tabela `questoes`. No cabeçalho ela mostra `Banco: X · carregadas: Y`.

- Se aparecer **Banco: 1958 · carregadas: 1958**, as 1.958 questões foram carregadas.
- Se aparecer **Banco: 1000 · carregadas: 1000**, o banco Supabase atualmente tem somente 1.000 questões; nesse caso, é necessário concluir a carga dos arquivos `supabase/seed-partes/parte_01.sql` até `parte_24...` na ordem indicada.
- Se `Banco` for maior que `carregadas`, existe uma falha de paginação/permissão a investigar; a tela não deve tratar 1.000 como total.

A classificação anterior continua junto da nova camada: **Rank + Score + Banda A/B/C** permanecem visíveis, enquanto **P1–P4, prioridade base e Fila A/B/C/D** são a camada estratégica/dinâmica.

## V6 + V7 — revisão espaçada avançada, gamificação, simulados e IA

### Rodar a migração
No SQL Editor do Supabase, depois do `schema.sql` e da
`migrations_20260927_priorizacao_filas.sql`, rode também:
```
supabase/migrations_20260927_v6v7_gamificacao_ia.sql
```
Ela adiciona: campos de revisão espaçada avançada em `progresso`
(`review_stage`, `next_review_at`, `mastery_level`, `success_count`,
`error_count`, `last_seen_at`); as tabelas `favoritos`, `metas_config`,
`gamificacao`, `conquistas`, `simulados`, `simulado_itens`, `explicacoes_ia`
e `insights_ia`; e as funções `registrar_tentativa_v2` (substitui a
`registrar_tentativa` antiga) e `conceder_bonus_meta`.

### Revisão espaçada automática
Toda resposta correta pede uma auto-avaliação (difícil / normal / fácil)
antes de gravar, e o sistema agenda a próxima revisão:

| Resultado                      | Próxima revisão |
|---------------------------------|------------------|
| Errou                            | 1 dia            |
| Acertou com dificuldade          | 3 dias           |
| Acertou (normal)                 | 7 dias           |
| Acertou fácil                     | 15 dias          |
| Dominado (4+ acertos seguidos)    | 30 dias          |

### Gamificação
10 XP por acerto (+5 se a questão já tinha sido respondida antes — ou seja,
era uma revisão), +50 XP quando bate a meta diária, nível calculado a partir
do XP total, streak de dias seguidos e medalhas por sequência de 7/30/100
dias — tudo isso é calculado dentro de `registrar_tentativa_v2` no banco.

### Chave do Gemini (IA)
1. Gere uma chave gratuita em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Coloque em `GEMINI_API_KEY` no `.env.local` (local) e nas env vars do
   projeto na Vercel (produção) — nunca em variável `NEXT_PUBLIC_`, pois só é
   usada nas rotas `app/api/explicar` e `app/api/insights` (servidor).

### Não implementado (por decisão de escopo)
PWA / funcionamento offline, plano de estudos automático e ranking entre
usuários ficaram de fora intencionalmente.

## Retomada da Fila por filtro

A Fila agora grava a posição de estudo por combinação de filtros (matéria, fila, status e busca). A posição usa o `rank` estável das questões.

Antes de publicar esta versão, rode no Supabase:

`supabase/migrations_20260927_sessoes_fila.sql`

Na Fila aparecem os comandos **Começar do início** e **Começar de onde parei**. A retomada só avança o ponto salvo depois que a resposta da questão é registrada, para que fechar a página sem responder não faça o aluno perder a questão atual.

## Curitiba 2026 — priorização FAFIPA

A versão atual usa `prioridade_base`/`prioridade_faixa` para ordenar o banco por aderência ao edital e padrão FAFIPA. Erros e dúvidas recebem precedência dinâmica. Veja `PRIORIZACAO_CURITIBA_2026.md`.
