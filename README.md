# FAFIPA Study OS — Contador Curitiba 2026

Fila priorizada de 965 questões (FAFIPA) com resolução individual, central de
erros, revisão espaçada e desempenho por tópico — rodando em Next.js +
Supabase + Vercel, com progresso sincronizado entre PC, celular e notebook.

## O que já vem pronto

- **965 questões** extraídas do seu painel HTML V5, já na ordem de prioridade
  (`rank` 1 → 965), em `data/questoes.json`.
- **160 resoluções individuais** (questões 1–160, camada núcleo prioritário)
  já incluídas no mesmo arquivo.
- Schema completo do Supabase em `supabase/schema.sql`.
- App Next.js com: painel, fila, tela de questão (responder + resolução +
  revisão espaçada), central de erros, desempenho por tópico e uma tela
  `/admin` para colar novos lotes de resolução conforme forem sendo gerados.

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
5. Vá em **Authentication → Providers → Email** e confirme que o login por
   **magic link** (OTP) está habilitado (é o padrão). Em
   **Authentication → URL Configuration**, adicione a URL do seu site na
   Vercel (você vai ter essa URL no passo 4) em *Redirect URLs*.

### 2. Configurar o projeto localmente
```bash
cd fafipa-study-os
npm install
cp .env.example .env.local
```
Edite `.env.local` com os três valores do passo 1 (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### 3. Popular o banco com as 965 questões
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
Abra `http://localhost:3000`, entre com seu e-mail (chega um link mágico) e
confira se a fila carrega.

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
3. Deploy. Copie a URL gerada (ex. `fafipa-study-os.vercel.app`) e cole em
   **Authentication → URL Configuration → Redirect URLs** no Supabase
   (passo 1.5), senão o link mágico não vai voltar para o site certo.

Pronto — o painel está no ar, com progresso salvo no Supabase (não mais no
navegador).

## Importando os próximos lotes de resolução

Enquanto as resoluções das camadas 161–320, 321–480 e 481–965 forem sendo
geradas (fora deste app), é só colar o JSON de cada lote na tela **Importar**
(`/admin`) do próprio site. O formato esperado é:

```json
[
  { "id": "3936169", "resolution": { "regra": "...", "passos": ["..."], "calculo": "...", "correta": "...", "erradas": ["..."], "fundamento": "...", "pegadinha": "..." } }
]
```

O `id` é o mesmo id do TEC Concursos que já está em `data/questoes.json` (e
visível em cada questão pelo link "Abrir no TEC"). A tela atualiza direto no
Supabase — sem precisar rodar o seed de novo.

## Estrutura do projeto

```
app/            páginas (painel, fila, questão, erros, revisão, desempenho, admin)
components/     Nav e AuthGate (login por link mágico)
lib/            cliente Supabase e tipos TypeScript
supabase/       schema.sql — rode isso no SQL Editor do Supabase
scripts/seed.mjs  importa data/questoes.json para o Supabase
data/questoes.json  as 965 questões + resoluções já extraídas do seu painel V6
```

## Próximos passos sugeridos

- Colar os lotes de resolução 161–320 → 321–480 → 481–965 em `/admin`
  conforme forem ficando prontos.
- Se quiser, dá para trocar o login por magic link por e-mail+senha depois —
  é só trocar `signInWithOtp` por `signInWithPassword` em
  `components/AuthGate.tsx`.
