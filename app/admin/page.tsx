"use client";

import { useState } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EXEMPLO = `[
  {
    "id": "3936169",
    "resolution": {
      "regra": "...",
      "passos": ["...", "..."],
      "calculo": "Não há cálculo.",
      "correta": "...",
      "erradas": ["A) ...", "B) ..."],
      "fundamento": "...",
      "pegadinha": "..."
    }
  }
]`;

function ImportarResolucoes() {
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function importar() {
    setStatus(null);
    let lote: { id: string; resolution: unknown }[];
    try {
      lote = JSON.parse(texto);
      if (!Array.isArray(lote)) throw new Error("O JSON precisa ser uma lista.");
    } catch (e) {
      setStatus(`JSON inválido: ${(e as Error).message}`);
      return;
    }

    setEnviando(true);
    const supabase = getSupabaseClient();
    let ok = 0;
    let falhas = 0;
    for (const item of lote) {
      if (!item.id || !item.resolution) {
        falhas++;
        continue;
      }
      const { error } = await supabase
        .from("questoes")
        .update({ resolution: item.resolution })
        .eq("id", item.id);
      if (error) falhas++;
      else ok++;
    }
    setEnviando(false);
    setStatus(`${ok} resolução(ões) gravada(s). ${falhas} falha(s).`);
    if (ok > 0) setTexto("");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Importar resoluções</h1>
      <p className="mt-1 text-ink-light/70">
        Cole aqui o lote de resoluções (JSON com <code>id</code> e{" "}
        <code>resolution</code> de cada questão) gerado fora do app. Cada
        questão é atualizada pelo <code>id</code> do TEC Concursos.
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={EXEMPLO}
        rows={16}
        className="mt-6 w-full rounded-md border border-ink/15 bg-white/70 p-4 font-mono text-xs outline-none focus:border-gold"
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={importar}
          disabled={enviando || !texto.trim()}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-light disabled:opacity-40"
        >
          {enviando ? "Gravando…" : "Gravar no banco"}
        </button>
        {status && <p className="text-sm text-ink-light/70">{status}</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <ImportarResolucoes />
    </AuthGate>
  );
}
