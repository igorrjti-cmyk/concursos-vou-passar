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
import { MATERIA_POR_ID } from "@/lib/materiaPorId";

const STATUS_LABEL: Record<StatusProgresso, string> = {
  nao_iniciada: "Não iniciada", feita_certo: "Acertou", feita_errado: "Errou", duvida: "Dúvida",
};
const STATUS_COLOR: Record<StatusProgresso, string> = {
  nao_iniciada: "bg-ink/10 text-ink-light", feita_certo: "bg-certo/10 text-certo", feita_errado: "bg-errado/10 text-errado", duvida: "bg-gold/20 text-gold",
};
const PAGE_SIZE = 40;
const MATERIAS = [
  "Contabilidade Pública / AFO", "Contabilidade Geral", "Português", "Legislação Municipal",
  "Contabilidade de Custos", "Informática", "Matemática Financeira", "Estatística",
];
const PRIORIDADES = ["P1+", "P1", "P2", "P3", "P4"] as const;
function materiaDaQuestao(q: Questao) {
  const t = q.topic ?? "";
  if (String(q.id).startsWith("LEG-AUT-") || /^(Lei Orgânica|Lei 1\.656|Lei 7\.671|LC 40|LC 101|Decreto 2\.05|Decreto 2\.06|Decretos 2\.051|Legislação Municipal)/.test(t)) return "Legislação Municipal";
  if (t.startsWith("AFO, Direito Financeiro e Contabilidade Pública")) return "Contabilidade Pública / AFO";
  if (t.startsWith("Língua Portuguesa") || t.startsWith("Literatura Brasileira")) return "Português";
  if (t.startsWith("Contabilidade Geral")) return "Contabilidade Geral";
  if (t.startsWith("Contabilidade de Custos")) return "Contabilidade de Custos";
  if (t.startsWith("Informática")) return "Informática";
  if (t.startsWith("Matemática Financeira")) return "Matemática Financeira";
  if (t.startsWith("Estatística")) return "Estatística";
  return "Outros";
}
function faixa(q: Questao) { return q.prioridade_faixa || prioridadeLabel(q.prioridade_base); }

function FilaLista() {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [progressoMap, setProgressoMap] = useState<Record<string, Progresso>>({});
  const [pagina, setPagina] = useState(0);
  const [statusFiltro, setStatusFiltro] = useState<"todas" | StatusProgresso>("todas");
  const [filaFiltro, setFilaFiltro] = useState<"todas" | FilaDinamica>("todas");
  const [materiaFiltro, setMateriaFiltro] = useState<"todas" | string>("todas");
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<"todas" | string>("todas");
  const [carregando, setCarregando] = useState(true);
  const [totalBanco, setTotalBanco] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [sessao, setSessao] = useState<{ ultimo_rank: number; ultima_questao_id: string | null; ultima_questao_aberta_id: string | null; ultima_aberta_em: string | null; atualizado_em: string } | null>(null);
  const [sessoesRecentes, setSessoesRecentes] = useState<Array<{ ultimo_rank:number; ultima_questao_id:string|null; atualizado_em:string; filtros:FilaFiltros }>>([]);
  const [salvandoInicio, setSalvandoInicio] = useState(false);

  useEffect(() => { setPagina(0); }, [materiaFiltro, filaFiltro, statusFiltro, prioridadeFiltro, busca]);

  const filtrosAtuais: FilaFiltros = {
    materia: materiaFiltro,
    fila: filaFiltro,
    status: statusFiltro,
    busca,
    prioridade: prioridadeFiltro,
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
  }, [materiaFiltro, filaFiltro, statusFiltro, prioridadeFiltro, busca]);

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
    let arr = questoes.filter(q => materiaFiltro === "todas" || materiaDaQuestao(q) === materiaFiltro);
    if (prioridadeFiltro !== "todas") arr = arr.filter(q => faixa(q) === prioridadeFiltro);
    const termo = busca.trim().toLowerCase();
    if (termo) arr = arr.filter(q => `${q.topic ?? ""} ${q.stem ?? ""} ${q.rank}`.toLowerCase().includes(termo));
    if (statusFiltro !== "todas") arr = arr.filter(q => (progressoMap[q.id]?.status ?? "nao_iniciada") === statusFiltro);
    if (filaFiltro !== "todas") arr = arr.filter(q => filaDinamica(q, progressoMap[q.id]) === filaFiltro);
    return [...arr].sort((a, b) => {
      const sa = filaSortScore(a, progressoMap[a.id]);
      const sb = filaSortScore(b, progressoMap[b.id]);
      return sb - sa || (a.rank - b.rank);
    });
  }, [questoes, progressoMap, statusFiltro, filaFiltro, materiaFiltro, prioridadeFiltro, busca]);

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
      if (!f || (f.materia !== "todas" && materiaDaQuestao(q) !== f.materia)) return false;
      if (f?.busca && !`${q.topic ?? ""} ${q.stem ?? ""} ${q.rank}`.toLowerCase().includes(f.busca.trim().toLowerCase())) return false;
      if (f?.status !== "todas" && (progressoMap[q.id]?.status ?? "nao_iniciada") !== f.status) return false;
      if (f?.prioridade && f.prioridade !== "todas" && faixa(q) !== f.prioridade) return false;
      if (f?.fila !== "todas" && filaDinamica(q, progressoMap[q.id]) !== f.fila) return false;
      return q.rank > s.ultimo_rank;
    }).sort((a,b) => a.rank - b.rank);
    return { ...s, proxima: candidatos[0] ?? null };
  }).filter(s => s.proxima || s.ultimo_rank > 0), [sessoesRecentes, questoes, progressoMap]);

  const resumoFiltros = (f: FilaFiltros) => {
    const materia = f.materia === "todas" ? "Todas as disciplinas" : f.materia;
    const detalhes = [f.prioridade && f.prioridade !== "todas" ? f.prioridade : null, f.fila !== "todas" ? FILA_LABEL[f.fila as FilaDinamica] : null, f.status !== "todas" ? STATUS_LABEL[f.status as StatusProgresso] : null].filter(Boolean);
    return detalhes.length ? `${materia} · ${detalhes.join(" · ")}` : materia;
  };

  const prioridadeCounts = useMemo(() => Object.fromEntries(PRIORIDADES.map(p => [p, questoes.filter(q => faixa(q) === p).length])) as Record<string, number>, [questoes]);
  const materiaCounts = useMemo(() => MATERIAS.map(m => {
    const itens = questoes.filter(q => materiaDaQuestao(q) === m);
    return { materia: m, total: itens.length, counts: Object.fromEntries(PRIORIDADES.map(p => [p, itens.filter(q => faixa(q) === p).length])) as Record<string, number> };
  }), [questoes]);

  const progressoResumo = useMemo(() => {
    const registros = Object.values(progressoMap);
    const concluidas = registros.filter(p => p.status === "feita_certo" || p.status === "feita_errado").length;
    const erros = registros.filter(p => p.status === "feita_errado").length;
    const duvidas = registros.filter(p => p.status === "duvida").length;
    const total = totalBanco ?? questoes.length;
    const pct = total ? Math.round((concluidas / total) * 100) : 0;
    return { concluidas, erros, duvidas, total, pct };
  }, [progressoMap, totalBanco, questoes.length]);

  const desempenhoResumo = useMemo(() => {
    const registros = Object.values(progressoMap);
    const certas = registros.filter(p => p.status === "feita_certo").length;
    const erradas = registros.filter(p => p.status === "feita_errado").length;
    const respondidas = certas + erradas;
    const acuracia = respondidas ? Math.round((certas / respondidas) * 100) : 0;
    const pendentes = Math.max(0, (totalBanco ?? questoes.length) - respondidas);
    return { certas, erradas, respondidas, acuracia, pendentes };
  }, [progressoMap, totalBanco, questoes.length]);

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
        <p className="queue-kicker">Visão do dia</p>
        <h1 className="queue-hero__title">Painel de Estudos</h1>
        <p className="queue-hero__desc">Veja o que estudar agora, acompanhe seu progresso e use as prioridades para concentrar tempo no que mais importa para a prova.</p>
        <div className="queue-hero__actions">
          <button type="button" onClick={comecarDoInicio} disabled={!primeira || salvandoInicio} className="queue-hero__action">
            {salvandoInicio ? "Preparando…" : "▶ Estudar agora"} <span>→</span>
          </button>
          {proximaRetomada ? (
            <Link href={`/questao/${proximaRetomada.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-hero__action queue-hero__action--resume">
              ↻ Continuar de onde parei <span>#{proximaRetomada.rank} →</span>
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

    <section className="mt-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {PRIORIDADES.map((p, i) => { const desc=["Núcleo indispensável","Alta prioridade","Complementar","Baixa prioridade","Fora do recorte/problema"][i]; const styles=["border-fuchsia-400/20 bg-fuchsia-500/[.08] text-fuchsia-300","border-rose-400/20 bg-rose-500/[.08] text-rose-300","border-amber-400/20 bg-amber-500/[.08] text-amber-300","border-sky-400/20 bg-sky-500/[.08] text-sky-300","border-slate-400/15 bg-slate-400/[.06] text-slate-300"][i]; return <button key={p} onClick={() => setPrioridadeFiltro(prioridadeFiltro===p?"todas":p)} className={`rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 ${styles} ${prioridadeFiltro===p?"ring-1 ring-white/30":""}`}><div className="text-xs font-bold">{p}</div><div className="mt-2 text-3xl font-semibold text-white">{prioridadeCounts[p] ?? 0}</div><div className="mt-1 text-[11px] opacity-70">{desc}</div></button> })}
      </div>
      <div className="mt-4 rounded-[24px] border border-white/[.06] bg-white/[.025] p-5">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300/70">Classificação do edital</p><h2 className="mt-1 font-serif text-xl text-white">Questões por matéria</h2></div><span className="text-xs text-white/35">{questoes.length} questões carregadas</span></div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{materiaCounts.map(m => <button key={m.materia} onClick={()=>setMateriaFiltro(materiaFiltro===m.materia?"todas":m.materia)} className={`rounded-2xl border p-3 text-left ${materiaFiltro===m.materia?"border-blue-400/30 bg-blue-400/[.08]":"border-white/[.05] bg-black/10"}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-white/75">{m.materia}</span><b className="text-lg text-white">{m.total}</b></div><div className="mt-3 flex gap-1 overflow-hidden rounded-full bg-white/[.04]">{PRIORIDADES.map((p,i)=>{const widths=m.total?m.counts[p]/m.total*100:0; const c=["bg-fuchsia-500","bg-rose-500","bg-amber-400","bg-sky-400","bg-slate-500"][i];return widths>0?<span key={p} className={`h-1.5 ${c}`} style={{width:`${widths}%`}}/>:null})}</div><div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-white/35">{PRIORIDADES.map(p=><span key={p}>{p} <b className="text-white/60">{m.counts[p]}</b></span>)}</div></button>)}</div>
      </div>
    </section>

    <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-[24px] border border-white/[.06] bg-white/[.025] p-5">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300/70">Seu desempenho</p><h2 className="mt-1 font-serif text-xl text-white">Como está sua preparação</h2></div>
          <span className="text-xs text-white/35">{desempenhoResumo.respondidas.toLocaleString("pt-BR")} respondidas</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[.05] bg-black/10 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/30">Taxa de acertos</p><b className="mt-2 block text-2xl text-white">{desempenhoResumo.acuracia}%</b></div>
          <button onClick={()=>setStatusFiltro("feita_errado")} className="rounded-2xl border border-rose-400/10 bg-rose-500/[.04] p-4 text-left"><p className="text-[10px] uppercase tracking-[.12em] text-rose-300/60">Erros</p><b className="mt-2 block text-2xl text-white">{progressoResumo.erros}</b></button>
          <button onClick={()=>setStatusFiltro("duvida")} className="rounded-2xl border border-amber-400/10 bg-amber-500/[.04] p-4 text-left"><p className="text-[10px] uppercase tracking-[.12em] text-amber-300/60">Dúvidas</p><b className="mt-2 block text-2xl text-white">{progressoResumo.duvidas}</b></button>
          <div className="rounded-2xl border border-white/[.05] bg-black/10 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/30">Pendentes</p><b className="mt-2 block text-2xl text-white">{desempenhoResumo.pendentes.toLocaleString("pt-BR")}</b></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/35">Use Erros e Dúvidas como atalhos de revisão. A prioridade P1+/P1 define o que mais importa; seu desempenho define o que precisa voltar primeiro.</p>
      </div>
      <div className="rounded-[24px] border border-white/[.06] bg-white/[.025] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300/70">Progresso geral</p><h2 className="mt-1 font-serif text-xl text-white">Cobertura do banco</h2>
        <div className="mt-4 flex items-center gap-5"><div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[9px] border-blue-500/70 bg-blue-500/[.05]"><div className="text-center"><b className="text-xl text-white">{progressoResumo.pct}%</b><div className="text-[9px] text-white/35">concluído</div></div></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white">{progressoResumo.concluidas.toLocaleString("pt-BR")} / {progressoResumo.total.toLocaleString("pt-BR")}</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-blue-500" style={{width:`${Math.min(100,progressoResumo.pct)}%`}}/></div><div className="mt-3 text-[10px] leading-4 text-white/35">Meta: avançar no núcleo P1+ sem deixar erros acumularem.</div></div></div>
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

    <div className="mt-7 mb-3 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300/70">Execução</p><h2 className="mt-1 font-serif text-2xl text-white">Plano de estudos</h2></div><span className="text-xs text-white/30">{lista.length} questões neste filtro</span></div>
    <section className="queue-controls">
      <div className="queue-status-tabs" role="tablist" aria-label="Status da fila">
        {(["todas", "nao_iniciada", "feita_errado", "duvida", "feita_certo"] as const).map(f => (
          <button key={f} onClick={() => setStatusFiltro(f)} className={`queue-status-tab ${statusFiltro === f ? "is-active" : ""}`}>
            {f === "todas" ? "Todas" : f === "nao_iniciada" ? "Não iniciadas" : f === "feita_errado" ? "Errei" : f === "duvida" ? "Dúvidas" : "Concluídas"}
          </button>
        ))}
      </div>
      <div className="queue-filter-row">
        <label className="queue-filter-input"><span>⌕</span><input placeholder="Buscar no plano de estudos..." aria-label="Buscar no plano de estudos" value={busca} onChange={e => setBusca(e.target.value)} /></label>
        <select value={materiaFiltro} onChange={e => setMateriaFiltro(e.target.value)} className="queue-filter-select">
          <option value="todas">Todas as matérias</option>{MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={prioridadeFiltro} onChange={e => setPrioridadeFiltro(e.target.value)} className="queue-filter-select">
          <option value="todas">Todas as prioridades</option>{PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    </section>

    <section className="queue-list">
      {carregando ? <p className="p-7 text-sm text-white/35">Preparando seu plano de estudos…</p> : visiveis.length === 0 ? <p className="p-7 text-sm text-white/35">Nada encontrado neste filtro.</p> : visiveis.map(q => {
        const p = progressoMap[q.id]; const status = p?.status ?? "nao_iniciada"; const fila = filaDinamica(q, p); const acc = accuracyOf(p);
        return <Link key={q.id} href={`/questao/${q.id}${filaQuery(filtrosAtuais, "retomar")}`} className="queue-item">
          <div className="queue-item__grid">
            <span className="queue-item__rank">#{q.rank}</span>
            <div className="queue-item__main">
              <div className="queue-item__chips">
                <span className="queue-chip is-priority">{faixa(q)}</span>
                <span className="queue-chip is-fila">{FILA_LABEL[fila]}</span>
                <span className="queue-chip">{STATUS_LABEL[status]}</span>
              </div>
              <p className="queue-item__topic">{q.topic}</p>
              <p className="queue-item__detail">{prioridadeTexto(q.prioridade_base)} · Score {q.score ?? "—"} · Classificação {faixa(q)}{acc !== null ? ` · ${Math.round(acc)}% de aproveitamento` : ""}</p>
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