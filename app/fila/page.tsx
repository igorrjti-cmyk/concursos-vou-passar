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
  const [sessao, setSessao] = useState<{ ultimo_rank: number; ultima_questao_id: string | null; ultima_questao_aberta_id: string | null; ultima_aberta_em: string | null; atualizado_em: string } | null>(null);
  const [sessoesRecentes, setSessoesRecentes] = useState<Array<{ ultimo_rank:number; ultima_questao_id:string|null; atualizado_em:string; filtros:FilaFiltros }>>([]);
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
        .select("ultimo_rank,ultima_questao_id,ultima_questao_aberta_id,ultima_aberta_em,atualizado_em")
        .eq("user_id", userId)
        .eq("filtro_chave", chaveFila(filtrosAtuais))
        .maybeSingle();
      setSessao(data ?? null);

      const { data: recentes } = await supabase
        .from("sessoes_fila")
        .select("ultimo_rank,ultima_questao_id,atualizado_em,filtros")
        .eq("user_id", userId)
        .order("atualizado_em", { ascending: false })
        .limit(6);
      setSessoesRecentes((recentes ?? []) as Array<{ ultimo_rank:number; ultima_questao_id:string|null; atualizado_em:string; filtros:FilaFiltros }>);
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
        ultima_questao_aberta_id: null,
        ultima_aberta_em: null,
      }, { onConflict: "user_id,filtro_chave" });
      window.location.href = `/questao/${primeira.id}${filaQuery(filtrosAtuais, "inicio")}`;
    } finally {
      setSalvandoInicio(false);
    }
  }

  const sessoesComProxima = useMemo(() => sessoesRecentes.map(s => {
    const f = s.filtros;
    let candidatos = questoes.filter(q => {
      if (!f || f.materia !== "todas" && !(q.topic ?? "").startsWith(`${f.materia} - `)) return false;
      if (f?.busca && !`${q.topic ?? ""} ${q.stem ?? ""} ${q.rank}`.toLowerCase().includes(f.busca.trim().toLowerCase())) return false;
      if (f?.status !== "todas" && (progressoMap[q.id]?.status ?? "nao_iniciada") !== f.status) return false;
      if (f?.fila !== "todas" && filaDinamica(q, progressoMap[q.id]) !== f.fila) return false;
      return q.rank > s.ultimo_rank;
    }).sort((a,b) => a.rank - b.rank);
    return { ...s, proxima: candidatos[0] ?? null };
  }).filter(s => s.proxima || s.ultimo_rank > 0), [sessoesRecentes, questoes, progressoMap]);

  const resumoFiltros = (f: FilaFiltros) => {
    const materia = f.materia === "todas" ? "Todas as disciplinas" : f.materia;
    const detalhes = [f.fila !== "todas" ? FILA_LABEL[f.fila as FilaDinamica] : null, f.status !== "todas" ? STATUS_LABEL[f.status as StatusProgresso] : null].filter(Boolean);
    return detalhes.length ? `${materia} · ${detalhes.join(" · ")}` : materia;
  };

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

    {sessao && (proximaRetomada || sessao.ultimo_rank) && (
      <section className="mt-5 overflow-hidden rounded-[24px] border border-gold/15 bg-gradient-to-r from-gold/[.07] via-white/[.025] to-transparent p-5 shadow-[0_20px_60px_rgba(0,0,0,.18)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold/70">Sua sessão</p>
            <h2 className="mt-1 font-serif text-xl text-white">Você parou no Rank #{sessao.ultimo_rank}</h2>
            <p className="mt-1 text-xs text-white/40">Próxima questão: {proximaRetomada ? `Rank #${proximaRetomada.rank}` : "sequência concluída"}</p>
            {sessao.atualizado_em && <p className="mt-2 text-[10px] text-white/25">Última resposta salva em {new Date(sessao.atualizado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>}
          </div>
          {proximaRetomada && <Link href={`/questao/${proximaRetomada.id}${filaQuery(filtrosAtuais, "retomar")}`} className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gold px-5 py-3 text-sm font-bold text-[#161006] shadow-[0_10px_30px_rgba(231,187,98,.16)] transition hover:-translate-y-0.5 hover:bg-[#f0c975]">Continuar estudo <span className="ml-2">→</span></Link>}
        </div>
      </section>
    )}

    {sessoesComProxima.length > 0 && (
      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold/70">Histórico rápido</p><h2 className="mt-1 font-serif text-xl text-white">Continue suas sessões</h2></div><span className="text-[10px] text-white/25">{sessoesComProxima.length} recentes</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sessoesComProxima.map((s) => <div key={chaveFila(s.filtros)} className="glass rounded-[20px] border border-white/[.06] p-4">
            <p className="line-clamp-2 text-xs font-semibold leading-5 text-white/70">{resumoFiltros(s.filtros)}</p>
            <div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[.16em] text-white/25">Último Rank</p><p className="mt-1 font-serif text-2xl text-white">#{s.ultimo_rank}</p></div>{s.proxima ? <div className="text-right"><p className="text-[10px] uppercase tracking-[.16em] text-white/25">Próxima</p><p className="mt-1 text-sm font-semibold text-gold">#{s.proxima.rank}</p></div> : <span className="text-xs text-green-300/60">Concluída</span>}</div>
            <p className="mt-3 text-[10px] text-white/20">{new Date(s.atualizado_em).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" })}</p>
            {s.proxima && <Link href={`/questao/${s.proxima.id}${filaQuery(s.filtros, "retomar")}`} className="mt-4 flex items-center justify-center rounded-xl border border-gold/15 bg-gold/[.06] px-3 py-2.5 text-xs font-bold text-gold transition hover:bg-gold/[.1]">Continuar →</Link>}
          </div>)}
        </div>
      </section>
    )}

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
