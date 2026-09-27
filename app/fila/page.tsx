"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao, StatusProgresso } from "@/lib/types";
import { FILA_DESC, FILA_LABEL, filaDinamica, filaSortScore, prioridadeLabel, prioridadeTexto, accuracyOf, type FilaDinamica } from "@/lib/prioridade";
import { fetchAllPages } from "@/lib/paginar";

const STATUS_LABEL: Record<StatusProgresso, string> = {
  nao_iniciada: "Não iniciada", feita_certo: "Acertou", feita_errado: "Errou", duvida: "Dúvida",
};
const STATUS_COLOR: Record<StatusProgresso, string> = {
  nao_iniciada: "bg-ink/10 text-ink-light", feita_certo: "bg-certo/10 text-certo", feita_errado: "bg-errado/10 text-errado", duvida: "bg-gold/20 text-gold",
};
const PAGE_SIZE = 40;
const MATERIAS = [
  "AFO, Direito Financeiro e Contabilidade Pública", "Língua Portuguesa (Português)", "Informática",
  "Contabilidade Geral", "Matemática Financeira", "Estatística", "Contabilidade de Custos",
];

function FilaLista() {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [progressoMap, setProgressoMap] = useState<Record<string, Progresso>>({});
  const [pagina, setPagina] = useState(0);
  const [statusFiltro, setStatusFiltro] = useState<"todas" | StatusProgresso>("todas");
  const [filaFiltro, setFilaFiltro] = useState<"todas" | FilaDinamica>("todas");
  const [materiaFiltro, setMateriaFiltro] = useState<"todas" | string>("todas");
  const [carregando, setCarregando] = useState(true);
  const [totalBanco, setTotalBanco] = useState<number | null>(null);

  useEffect(() => { setPagina(0); }, [materiaFiltro, filaFiltro, statusFiltro]);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const progresso = await fetchAllPages<Progresso>(async (from, to) =>
          await supabase.from("progresso").select("*", { count: "exact" }).eq("user_id", userId).range(from, to)
        );
        const map: Record<string, Progresso> = {};
        progresso.forEach((p) => { map[p.questao_id] = p; });
        setProgressoMap(map);
      }
      const { count: totalCount, error: totalError } = await supabase
        .from("questoes")
        .select("id", { count: "exact", head: true });
      if (totalError) throw totalError;
      setTotalBanco(totalCount ?? null);

      const data = await fetchAllPages<Questao>(async (from, to) =>
        await supabase
          .from("questoes")
          .select("*", { count: "exact" })
          .order("prioridade_base", { ascending: false, nullsFirst: false })
          .order("rank", { ascending: true })
          .range(from, to)
      );
      setQuestoes(data);
      setCarregando(false);
    })();
  }, []);

  const lista = useMemo(() => {
    let arr = questoes.filter(q => materiaFiltro === "todas" || (q.topic ?? "").startsWith(`${materiaFiltro} - `));
    if (statusFiltro !== "todas") arr = arr.filter(q => (progressoMap[q.id]?.status ?? "nao_iniciada") === statusFiltro);
    if (filaFiltro !== "todas") arr = arr.filter(q => filaDinamica(q, progressoMap[q.id]) === filaFiltro);
    return [...arr].sort((a, b) => {
      const sa = filaSortScore(a, progressoMap[a.id]);
      const sb = filaSortScore(b, progressoMap[b.id]);
      return sb - sa || (a.rank - b.rank);
    });
  }, [questoes, progressoMap, statusFiltro, filaFiltro, materiaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas - 1);
  const visiveis = lista.slice(paginaSegura * PAGE_SIZE, paginaSegura * PAGE_SIZE + PAGE_SIZE);

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="font-serif text-3xl text-ink">Filas inteligentes</h1><p className="mt-1 text-ink-light/70">A classificação histórica continua preservada; a fila agora combina importância estratégica e seu domínio.</p></div>
      <div className="text-right text-xs text-ink-light/50">
        <div>{lista.length} questões no filtro atual</div>
        <div>Banco: {totalBanco ?? "…"} · carregadas: {questoes.length}</div>
      </div>
    </div>

    <div className="mt-6 grid gap-2 sm:grid-cols-4">
      {(["todas", "ataque", "consolidacao", "manutencao", "cobertura"] as const).map(f => (
        <button key={f} onClick={() => setFilaFiltro(f)} className={`rounded-xl border px-3 py-3 text-left ${filaFiltro === f ? "border-gold bg-gold/10" : "border-ink/10 bg-white/50"}`}>
          <div className="text-xs font-semibold text-ink">{f === "todas" ? "Todas as filas" : FILA_LABEL[f]}</div>
          <div className="mt-1 text-[11px] text-ink-light/60">{f === "todas" ? "Ordem dinâmica" : FILA_DESC[f]}</div>
        </button>
      ))}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {(["todas", "nao_iniciada", "feita_certo", "feita_errado", "duvida"] as const).map(f => <button key={f} onClick={() => setStatusFiltro(f)} className={`rounded-full px-3 py-1 text-xs ${statusFiltro === f ? "bg-ink text-paper" : "bg-white/60 text-ink-light border border-ink/10"}`}>{f === "todas" ? "Todos os status" : STATUS_LABEL[f]}</button>)}
      <select value={materiaFiltro} onChange={e => setMateriaFiltro(e.target.value)} className="rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-xs text-ink-light">
        <option value="todas">Todas as matérias</option>{MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>

    <div className="mt-5 grid gap-2 sm:grid-cols-4">
      {(["ataque", "consolidacao", "manutencao", "cobertura"] as FilaDinamica[]).map(f => {
        const n = lista.filter(q => filaDinamica(q, progressoMap[q.id]) === f).length;
        return <div key={f} className="rounded-xl border border-ink/10 bg-white/50 p-3"><div className="text-[10px] uppercase tracking-wide text-ink-light/50">{FILA_LABEL[f]}</div><div className="mt-1 font-serif text-xl text-ink">{n}</div></div>;
      })}
    </div>

    <div className="mt-5 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
      {carregando ? <p className="p-6 text-ink-light/60">Carregando…</p> : visiveis.length === 0 ? <p className="p-6 text-ink-light/60">Nada neste filtro.</p> : visiveis.map(q => {
        const p = progressoMap[q.id]; const status = p?.status ?? "nao_iniciada"; const fila = filaDinamica(q, p); const acc = accuracyOf(p);
        return <Link key={q.id} href={`/questao/${q.id}`} className="block px-4 py-4 transition hover:bg-white/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-sm text-ink-light/50">Rank #{q.rank}</span>
            <span className="badge border border-ink/10 bg-white/60 text-ink-light">Score {q.score ?? "—"}</span>
            <span className="badge border border-ink/10 bg-white/60 text-ink-light">Banda {q.band ?? "—"}</span>
            <span className="badge bg-ink text-paper">{prioridadeLabel(q.prioridade_base)}</span>
            <span className="badge border border-ink/10 bg-white/60 text-ink-light">Base {q.prioridade_base ?? "—"}/100</span>
            <span className="badge border border-ink/10 bg-white/60 text-ink-light">{FILA_LABEL[fila]}</span>
            <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
            {acc !== null && <span className="text-[11px] text-ink-light/50">{Math.round(acc)}% ({p?.acertos}/{p?.tentativas})</span>}
          </div>
          <p className="mt-2 text-xs uppercase tracking-wide text-ink-light/50">{q.topic}</p>
          <p className="mt-1 text-sm text-ink">{prioridadeTexto(q.prioridade_base)}</p>
        </Link>;
      })}
    </div>

    <div className="mt-6 flex items-center justify-between text-sm">
      <button disabled={paginaSegura === 0} onClick={() => setPagina(p => Math.max(0, p - 1))} className="rounded-md border border-ink/10 px-3 py-1.5 disabled:opacity-30">← Anterior</button>
      <span className="text-ink-light/60">Página {paginaSegura + 1} de {totalPaginas}</span>
      <button disabled={paginaSegura + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="rounded-md border border-ink/10 px-3 py-1.5 disabled:opacity-30">Próxima →</button>
    </div>
  </div>;
}

export default function Page() { return <AuthGate><Nav/><FilaLista/></AuthGate>; }
