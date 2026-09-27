"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao, StatusProgresso } from "@/lib/types";

const STATUS_LABEL: Record<StatusProgresso, string> = {
  nao_iniciada: "Não iniciada",
  feita_certo: "Acertou",
  feita_errado: "Errou",
  duvida: "Dúvida",
};

const STATUS_COLOR: Record<StatusProgresso, string> = {
  nao_iniciada: "bg-ink/10 text-ink-light",
  feita_certo: "bg-certo/10 text-certo",
  feita_errado: "bg-errado/10 text-errado",
  duvida: "bg-gold/20 text-gold",
};

const PAGE_SIZE = 40;

function FilaLista() {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [progressoMap, setProgressoMap] = useState<Record<string, StatusProgresso>>({});
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [filtro, setFiltro] = useState<"todas" | StatusProgresso>("todas");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const supabase = getSupabaseClient();

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const { data: progresso } = await supabase
          .from("progresso")
          .select("questao_id,status")
          .eq("user_id", userId);
        const map: Record<string, StatusProgresso> = {};
        (progresso ?? []).forEach((p: Pick<Progresso, "questao_id" | "status">) => {
          map[p.questao_id] = p.status;
        });
        setProgressoMap(map);
      }

      const { count } = await supabase
        .from("questoes")
        .select("id", { count: "exact", head: true });
      setTotal(count ?? 0);

      const from = pagina * PAGE_SIZE;
      const { data } = await supabase
        .from("questoes")
        .select("*")
        .order("rank", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      setQuestoes(data ?? []);
      setCarregando(false);
    })();
  }, [pagina]);

  const listaFiltrada = useMemo(() => {
    if (filtro === "todas") return questoes;
    return questoes.filter(
      (q) => (progressoMap[q.id] ?? "nao_iniciada") === filtro
    );
  }, [questoes, progressoMap, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Fila 1 → {total}</h1>
      <p className="mt-1 text-ink-light/70">Ordem de prioridade estratégica.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["todas", "nao_iniciada", "feita_certo", "feita_errado", "duvida"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1 text-xs ${
                filtro === f
                  ? "bg-ink text-paper"
                  : "bg-white/60 text-ink-light border border-ink/10"
              }`}
            >
              {f === "todas" ? "Todas" : STATUS_LABEL[f]}
            </button>
          )
        )}
      </div>

      <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
        {carregando ? (
          <p className="p-6 text-ink-light/60">Carregando…</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="p-6 text-ink-light/60">Nada nesta página com esse filtro.</p>
        ) : (
          listaFiltrada.map((q) => {
            const status = progressoMap[q.id] ?? "nao_iniciada";
            return (
              <Link
                key={q.id}
                href={`/questao/${q.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/80"
              >
                <span className="w-12 shrink-0 font-serif text-sm text-ink-light/50">
                  #{q.rank}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{q.topic}</span>
                <span className={`badge ${STATUS_COLOR[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          disabled={pagina === 0}
          onClick={() => setPagina((p) => Math.max(0, p - 1))}
          className="rounded-md border border-ink/10 px-3 py-1.5 disabled:opacity-30"
        >
          ← Anterior
        </button>
        <span className="text-ink-light/60">
          Página {pagina + 1} de {totalPaginas}
        </span>
        <button
          disabled={pagina + 1 >= totalPaginas}
          onClick={() => setPagina((p) => p + 1)}
          className="rounded-md border border-ink/10 px-3 py-1.5 disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <FilaLista />
    </AuthGate>
  );
}
