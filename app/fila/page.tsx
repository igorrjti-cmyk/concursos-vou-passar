"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { StatusProgresso } from "@/lib/types";
import { FILA_DESC, FILA_LABEL, prioridadeLabel, prioridadeTexto, type FilaDinamica } from "@/lib/prioridade";
import { chaveFila, filaQuery, type FilaFiltros } from "@/lib/filaSessao";

const STATUS_LABEL: Record<StatusProgresso, string> = {
  nao_iniciada: "Não iniciada", feita_certo: "Acertou", feita_errado: "Errou", duvida: "Dúvida",
};
const PAGE_SIZE = 40;
const MATERIAS = [
  "AFO, Direito Financeiro e Contabilidade Pública", "Língua Portuguesa (Português)", "Informática",
  "Contabilidade Geral", "Matemática Financeira", "Estatística", "Contabilidade de Custos",
];

// Uma linha já vem pronta do banco (fila_pagina): sem stem/options/resolution,
// que a lista não usa mesmo — só o necessário pra renderizar o card.
type LinhaFila = {
  id: string;
  rank: number;
  prioridade_base: number | null;
  score: number | null;
  topic: string | null;
  status: StatusProgresso;
  tentativas: number | null;
  acertos: number | null;
  acc: number | null;
  fila: FilaDinamica;
};

type Contagens = Record<FilaDinamica, number>;
const CONTAGENS_VAZIAS: Contagens = { ataque: 0, consolidacao: 0, manutencao: 0, cobertura: 0 };

function useDebounced<T>(valor: T, atrasoMs: number): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), atrasoMs);
    return () => clearTimeout(t);
  }, [valor, atrasoMs]);
  return debounced;
}

function FilaLista() {
  const [pagina, setPagina] = useState(0);
  const [statusFiltro, setStatusFiltro] = useState<"todas" | StatusProgresso>("todas");
  const [filaFiltro, setFilaFiltro] = useState<"todas" | FilaDinamica>("todas");
  const [materiaFiltro, setMateriaFiltro] = useState<"todas" | string>("todas");
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca.trim(), 300);

  const [linhas, setLinhas] = useState<LinhaFila[]>([]);
  const [totalFiltro, setTotalFiltro] = useState(0);
  const [totalBanco, setTotalBanco] = useState<number | null>(null);
  const [contagens, setContagens] = useState<Contagens>(CONTAGENS_VAZIAS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [sessao, setSessao] = useState<{ ultimo_rank: number; ultima_questao_id: string | null } | null>(null);
  const [nav, setNav] = useState<{ primeiraId: string | null; primeiraRank: number | null; retomadaId: string | null; retomadaRank: number | null }>({
    primeiraId: null, primeiraRank: null, retomadaId: null, retomadaRank: null,
  });
  const [salvandoInicio, setSalvandoInicio] = useState(false);

  useEffect(() => { setPagina(0); }, [materiaFiltro, filaFiltro, statusFiltro, buscaDebounced]);

  const filtrosAtuais: FilaFiltros = {
    materia: materiaFiltro,
    fila: filaFiltro,
    status: statusFiltro,
    busca: buscaDebounced,
  };
  const rpcFiltros = { p_materia: materiaFiltro, p_fila: filaFiltro, p_status: statusFiltro, p_busca: buscaDebounced };

  // Total do banco: só uma contagem (head:true não traz linhas), não precisa de RPC.
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { count } = await supabase.from("questoes").select("id", { count: "exact", head: true });
      setTotalBanco(count ?? null);
    })();
  }, []);

  // Sessão de retomada (posição salva por combinação de filtros).
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
  }, [materiaFiltro, filaFiltro, statusFiltro, buscaDebounced]);

  // Página atual da fila — o banco já filtra, ordena (score) e pagina.
  useEffect(() => {
    (async () => {
      setCarregando(true);
      setErro(null);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("fila_pagina", {
        ...rpcFiltros,
        p_ordenar_por: "score",
        p_limit: PAGE_SIZE,
        p_offset: pagina * PAGE_SIZE,
      });
      if (error) {
        setErro("Não foi possível carregar a fila agora. Tente novamente em instantes.");
        setLinhas([]); setTotalFiltro(0);
      } else {
        const linhasBanco = (data ?? []) as (LinhaFila & { total_count: number })[];
        setLinhas(linhasBanco);
        setTotalFiltro(linhasBanco[0]?.total_count ?? 0);
      }
      setCarregando(false);
    })();
  }, [materiaFiltro, filaFiltro, statusFiltro, buscaDebounced, pagina]);

  // Contagens por fila para os cards de resumo (mesmos filtros, sem paginação).
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("fila_contagens", rpcFiltros);
      if (error) { setContagens(CONTAGENS_VAZIAS); return; }
      const mapa = { ...CONTAGENS_VAZIAS };
      (data ?? []).forEach((row: { fila: FilaDinamica; total: number }) => { mapa[row.fila] = row.total; });
      setContagens(mapa);
    })();
  }, [materiaFiltro, filaFiltro, statusFiltro, buscaDebounced]);

  // Navegação (primeira questão da sequência + próxima depois de ultimo_rank).
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("fila_navegacao", {
        ...rpcFiltros,
        p_ultimo_rank: sessao?.ultimo_rank ?? 0,
      });
      if (error) { setNav({ primeiraId: null, primeiraRank: null, retomadaId: null, retomadaRank: null }); return; }
      const linha = (data ?? [])[0];
      setNav({
        primeiraId: linha?.primeira_id ?? null,
        primeiraRank: linha?.primeira_rank ?? null,
        retomadaId: linha?.retomada_id ?? null,
        retomadaRank: linha?.retomada_rank ?? null,
      });
    })();
  }, [materiaFiltro, filaFiltro, statusFiltro, buscaDebounced, sessao]);

  async function comecarDoInicio() {
    if (!nav.primeiraId || salvandoInicio) return;
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
      window.location.href = `/questao/${nav.primeiraId}${filaQuery(filtrosAtuais, "inicio")}`;
    } finally {
      setSalvandoInicio(false);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(totalFiltro / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas - 1);
  const proximaRetomada = nav.retomadaId ? { id: nav.retomadaId, rank: nav.retomadaRank } : null;

  return <div className="queue-page mx-auto px-4 py-7 sm:px-6 lg:px-8">
    <section className="queue-hero">
      <div className="relative z-10">
        <p className="queue-kicker">Central de estudo</p>
        <h1 className="queue-hero__title">Fila de estudos</h1>
        <p className="queue-hero__desc">Sua sequência personalizada de questões. A prioridade combina importância estratégica, histórico de respostas e domínio do conteúdo.</p>
        <div className="queue-hero__actions">
          <button type="button" onClick={comecarDoInicio} disabled={!nav.primeiraId || salvandoInicio} className="queue-hero__action">
            {salvandoInicio ? "Preparando…" : "▶ Começar do início"} <span>→</span>
          </button>
          {proximaRetomada && (
            <Link href={`/questao/${proximaRetomada.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-hero__action queue-hero__action--resume">
              ↻ Começar de onde parei <span>#{proximaRetomada.rank} →</span>
            </Link>
          )}
        </div>
      </div>
      <div className="queue-hero__meta"><div>{totalFiltro} questões no filtro atual</div><div className="mt-1">Banco: {totalBanco ?? "…"}</div></div>
    </section>

    <section className="queue-strategy" aria-label="Resumo das filas">
      {(["ataque", "consolidacao", "manutencao", "cobertura"] as FilaDinamica[]).map(f => (
        <button key={f} onClick={() => setFilaFiltro(f)} className={`queue-strategy-card text-left ${filaFiltro === f ? "ring-1 ring-blue-400/30" : ""}`}>
          <div className="queue-strategy-card__top"><span className="queue-strategy-card__dot"/><span className="queue-strategy-card__label">{FILA_LABEL[f]}</span></div>
          <div className="queue-strategy-card__count">{contagens[f]}</div>
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
      {erro ? <p className="p-7 text-sm text-errado">{erro}</p> : carregando ? <p className="p-7 text-sm text-white/35">Preparando sua fila inteligente…</p> : linhas.length === 0 ? <p className="p-7 text-sm text-white/35">Nada encontrado neste filtro.</p> : linhas.map(q => {
        const acc = q.acc;
        return <Link key={q.id} href={`/questao/${q.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-item">
          <div className="queue-item__grid">
            <span className="queue-item__rank">#{q.rank}</span>
            <div className="queue-item__main">
              <div className="queue-item__chips">
                <span className="queue-chip is-priority">{prioridadeLabel(q.prioridade_base)}</span>
                <span className="queue-chip is-fila">{FILA_LABEL[q.fila]}</span>
                <span className="queue-chip">{STATUS_LABEL[q.status]}</span>
              </div>
              <p className="queue-item__topic">{q.topic}</p>
              <p className="queue-item__detail">{prioridadeTexto(q.prioridade_base)} · Score {q.score ?? "—"} · Base {q.prioridade_base ?? "—"}/100{acc !== null ? ` · ${Math.round(acc)}% de aproveitamento` : ""}</p>
            </div>
            <div className="queue-item__side"><span className="queue-item__status" style={{color: q.status === "feita_errado" ? "#ff7373" : q.status === "feita_certo" ? "#55d6a2" : "#70a7ff"}}>{acc !== null ? `${Math.round(acc)}%` : "Nova"}</span><span className="queue-item__score">{q.tentativas ?? 0} tentativas</span></div>
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
