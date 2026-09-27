"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao, StatusProgresso } from "@/lib/types";
import { FILA_DESC, FILA_LABEL, filaDinamica, filaSortScore, prioridadeLabel, prioridadeTexto, accuracyOf, type FilaDinamica } from "@/lib/prioridade";
import { fetchAllPages } from "@/lib/paginar";
import { chaveFila, filaQuery, type FilaFiltros } from "@/lib/filaSessao";

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
  const [busca, setBusca] = useState("");
  const [sessao, setSessao] = useState<{ ultimo_rank: number; ultima_questao_id: string | null } | null>(null);
  const [salvandoInicio, setSalvandoInicio] = useState(false);

  useEffect(() => { setPagina(0); }, [materiaFiltro, filaFiltro, statusFiltro, busca]);

  const filtrosAtuais: FilaFiltros = {
    materia: materiaFiltro,
    fila: filaFiltro,
    status: statusFiltro,
    busca,
  };

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) { setSessao(null); return; }
      const { data } = await supabase
        .from("sessoes_fila")
        .select("ultimo_rank,ultima_questao_id")
        .eq("user_id", userId)
        .eq("filtro_chave", chaveFila(filtrosAtuais))
        .maybeSingle();
      setSessao(data ?? null);
    })();
  }, [materiaFiltro, filaFiltro, statusFiltro, busca]);

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
    const termo = busca.trim().toLowerCase();
    if (termo) arr = arr.filter(q => `${q.topic ?? ""} ${q.stem ?? ""} ${q.rank}`.toLowerCase().includes(termo));
    if (statusFiltro !== "todas") arr = arr.filter(q => (progressoMap[q.id]?.status ?? "nao_iniciada") === statusFiltro);
    if (filaFiltro !== "todas") arr = arr.filter(q => filaDinamica(q, progressoMap[q.id]) === filaFiltro);
    return [...arr].sort((a, b) => {
      const sa = filaSortScore(a, progressoMap[a.id]);
      const sb = filaSortScore(b, progressoMap[b.id]);
      return sb - sa || (a.rank - b.rank);
    });
  }, [questoes, progressoMap, statusFiltro, filaFiltro, materiaFiltro, busca]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas - 1);
  const visiveis = lista.slice(paginaSegura * PAGE_SIZE, paginaSegura * PAGE_SIZE + PAGE_SIZE);

  // A posição de retomada usa o rank estável do banco, enquanto a exibição
  // continua respeitando a prioridade inteligente da Fila.
  const sequenciaRank = useMemo(() => [...lista].sort((a, b) => a.rank - b.rank), [lista]);
  const primeira = sequenciaRank[0] ?? null;
  const proximaRetomada = sessao?.ultimo_rank
    ? sequenciaRank.find(q => q.rank > sessao.ultimo_rank) ?? null
    : null;

  async function comecarDoInicio() {
    if (!primeira || salvandoInicio) return;
    setSalvandoInicio(true);
    try {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      await supabase.from("sessoes_fila").upsert({
        user_id: userId,
        filtro_chave: chaveFila(filtrosAtuais),
        filtros: filtrosAtuais,
        ultimo_rank: 0,
        ultima_questao_id: null,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "user_id,filtro_chave" });
      window.location.href = `/questao/${primeira.id}${filaQuery(filtrosAtuais, "inicio")}`;
    } finally {
      setSalvandoInicio(false);
    }
  }

  const counts = useMemo(() => {
    const all = lista;
    return {
      ataque: all.filter(q => filaDinamica(q, progressoMap[q.id]) === "ataque").length,
      consolidacao: all.filter(q => filaDinamica(q, progressoMap[q.id]) === "consolidacao").length,
      manutencao: all.filter(q => filaDinamica(q, progressoMap[q.id]) === "manutencao").length,
      cobertura: all.filter(q => filaDinamica(q, progressoMap[q.id]) === "cobertura").length,
    };
  }, [lista, progressoMap]);

  return <div className="queue-page mx-auto px-4 py-7 sm:px-6 lg:px-8">
    <section className="queue-hero">
      <div className="relative z-10">
        <p className="queue-kicker">Central de estudo</p>
        <h1 className="queue-hero__title">Fila de estudos</h1>
        <p className="queue-hero__desc">Sua sequência personalizada de questões. A prioridade combina importância estratégica, histórico de respostas e domínio do conteúdo.</p>
        <div className="queue-hero__actions">
          <button type="button" onClick={comecarDoInicio} disabled={!primeira || salvandoInicio} className="queue-hero__action">
            {salvandoInicio ? "Preparando…" : "▶ Começar do início"} <span>→</span>
          </button>
          {proximaRetomada ? (
            <Link href={`/questao/${proximaRetomada.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-hero__action queue-hero__action--resume">
              ↻ Começar de onde parei <span>#{proximaRetomada.rank} →</span>
            </Link>
          ) : (
            <button type="button" disabled className="queue-hero__action queue-hero__action--resume opacity-50">
              ↻ {sessao?.ultimo_rank ? "Sequência concluída" : "Ainda não iniciada"}
              <span>{sessao?.ultimo_rank ? `após #${sessao.ultimo_rank}` : "—"}</span>
            </button>
          )}
        </div>
      </div>
      <div className="queue-hero__meta">
        <div>{lista.length} questões no filtro atual</div>
        <div className="mt-1">Banco: {totalBanco ?? "…"}</div>
        <div className="mt-2 text-blue-200/70">
          {sessao?.ultimo_rank ? `Última posição salva: Rank #${sessao.ultimo_rank}` : "Nenhuma posição salva neste filtro"}
        </div>
      </div>
    </section>

    <section className="queue-strategy" aria-label="Resumo das filas">
      {(["ataque", "consolidacao", "manutencao", "cobertura"] as FilaDinamica[]).map(f => (
        <button key={f} onClick={() => setFilaFiltro(f)} className={`queue-strategy-card text-left ${filaFiltro === f ? "ring-1 ring-blue-400/30" : ""}`}>
          <div className="queue-strategy-card__top"><span className="queue-strategy-card__dot"/><span className="queue-strategy-card__label">{FILA_LABEL[f]}</span></div>
          <div className="queue-strategy-card__count">{counts[f]}</div>
          <div className="queue-strategy-card__desc">{FILA_DESC[f]}</div>
        </button>
      ))}
    </section>

    <section className="queue-controls">
      <div className="queue-status-tabs" role="tablist" aria-label="Status da fila">
        {(["todas", "nao_iniciada", "feita_errado", "duvida", "feita_certo"] as const).map(f => (
          <button key={f} onClick={() => setStatusFiltro(f)} className={`queue-status-tab ${statusFiltro === f ? "is-active" : ""}`}>
            {f === "todas" ? "Todas" : f === "nao_iniciada" ? "Não iniciadas" : f === "feita_errado" ? "Errei" : f === "duvida" ? "Dúvidas" : "Concluídas"}
          </button>
        ))}
      </div>
      <div className="queue-filter-row">
        <label className="queue-filter-input"><span>⌕</span><input placeholder="Buscar na fila de estudos..." aria-label="Buscar na fila" value={busca} onChange={e => setBusca(e.target.value)} /></label>
        <select value={materiaFiltro} onChange={e => setMateriaFiltro(e.target.value)} className="queue-filter-select">
          <option value="todas">Todas as matérias</option>{MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </section>

    <section className="queue-list">
      {carregando ? <p className="p-7 text-sm text-white/35">Preparando sua fila inteligente…</p> : visiveis.length === 0 ? <p className="p-7 text-sm text-white/35">Nada encontrado neste filtro.</p> : visiveis.map(q => {
        const p = progressoMap[q.id]; const status = p?.status ?? "nao_iniciada"; const fila = filaDinamica(q, p); const acc = accuracyOf(p);
        return <Link key={q.id} href={`/questao/${q.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-item">
          <div className="queue-item__grid">
            <span className="queue-item__rank">#{q.rank}</span>
            <div className="queue-item__main">
              <div className="queue-item__chips">
                <span className="queue-chip is-priority">{prioridadeLabel(q.prioridade_base)}</span>
                <span className="queue-chip is-fila">{FILA_LABEL[fila]}</span>
                <span className="queue-chip">{STATUS_LABEL[status]}</span>
              </div>
              <p className="queue-item__topic">{q.topic}</p>
              <p className="queue-item__detail">{prioridadeTexto(q.prioridade_base)} · Score {q.score ?? "—"} · Base {q.prioridade_base ?? "—"}/100{acc !== null ? ` · ${Math.round(acc)}% de aproveitamento` : ""}</p>
            </div>
            <div className="queue-item__side"><span className="queue-item__status" style={{color: status === "feita_errado" ? "#ff7373" : status === "feita_certo" ? "#55d6a2" : "#70a7ff"}}>{acc !== null ? `${Math.round(acc)}%` : "Nova"}</span><span className="queue-item__score">{p?.tentativas ?? 0} tentativas</span></div>
            <span className="queue-item__arrow">›</span>
          </div>
        </Link>;
      })}
    </section>

    <div className="queue-pagination">
      <button disabled={paginaSegura === 0} onClick={() => setPagina(p => Math.max(0, p - 1))} className="queue-page-button">← Anterior</button>
      <span className="queue-page-info">Página {paginaSegura + 1} de {totalPaginas}</span>
      <button disabled={paginaSegura + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="queue-page-button">Próxima →</button>
    </div>
  </div>;
}

export default function Page() { return <AuthGate><Nav/><FilaLista/></AuthGate>; }
