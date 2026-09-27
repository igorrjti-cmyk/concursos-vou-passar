"use client";

import { useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Questao } from "@/lib/types";

function BuscaGlobal() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Questao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const termoLimpo = termo.trim();
    if (!termoLimpo) return;
    setBuscando(true);
    setBuscou(true);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("questoes")
      .select("*")
      .or(
        `stem.ilike.%${termoLimpo}%,topic.ilike.%${termoLimpo}%,origin.ilike.%${termoLimpo}%`
      )
      .order("rank", { ascending: true })
      .limit(60);
    setResultados(data ?? []);
    setBuscando(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Buscar</h1>
      <p className="mt-1 text-ink-light/70">
        Pesquise por disciplina, assunto, banca ou palavra-chave no enunciado.
      </p>

      <form onSubmit={buscar} className="mt-6 flex gap-2">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Ex.: restos a pagar, FAFIPA, contabilidade de custos…"
          className="flex-1 rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-light disabled:opacity-40"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
        {!buscou ? (
          <p className="p-6 text-ink-light/60">Digite um termo e aperte buscar.</p>
        ) : buscando ? (
          <p className="p-6 text-ink-light/60">Buscando…</p>
        ) : resultados.length === 0 ? (
          <p className="p-6 text-ink-light/60">Nada encontrado para “{termo}”.</p>
        ) : (
          resultados.map((q) => (
            <Link
              key={q.id}
              href={`/questao/${q.id}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/80"
            >
              <span className="w-12 shrink-0 font-serif text-sm text-ink-light/50">#{q.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{q.topic}</p>
                <p className="truncate text-xs text-ink-light/60">{q.origin}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <BuscaGlobal />
    </AuthGate>
  );
}
