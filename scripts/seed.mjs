// Popula a tabela `questoes` no Supabase a partir de data/questoes.json.
// Rode uma vez, localmente, depois de configurar .env.local:
//   npm install
//   npm run seed
//
// Usa a SERVICE ROLE KEY (não a anon key) porque grava em lote ignorando RLS.
// Nunca rode este script a partir de código exposto ao navegador.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY em .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const raw = await readFile(new URL("../data/questoes.json", import.meta.url));
  const questoes = JSON.parse(raw.toString());
  console.log(`Lidas ${questoes.length} questões de data/questoes.json`);

  const linhas = questoes.map((q) => ({
    id: q.id,
    rank: q.rank,
    prioridade_base: q.prioridade_base ?? null,
    prioridade_faixa: q.prioridade_faixa ?? null,
    topic: q.topic,
    origin: q.origin,
    file_source: q.file,
    stem: q.stem,
    options: q.options,
    answer: q.answer,
    year: q.year,
    qnum: q.qnum,
    score: q.score,
    band: q.band,
    resolution: q.resolution,
    summary: q.summary,
  }));

  const BATCH = 200;
  let gravadas = 0;
  for (let i = 0; i < linhas.length; i += BATCH) {
    const lote = linhas.slice(i, i + BATCH);
    const { error } = await supabase
      .from("questoes")
      .upsert(lote, { onConflict: "id" });
    if (error) {
      console.error(`Erro no lote ${i}-${i + lote.length}:`, error.message);
      process.exit(1);
    }
    gravadas += lote.length;
    console.log(`Gravadas ${gravadas} / ${linhas.length}`);
  }

  console.log("Seed concluído.");
}

main();
