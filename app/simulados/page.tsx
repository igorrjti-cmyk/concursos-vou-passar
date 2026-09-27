"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Simulado } from "@/lib/types";

type QuestaoCatalogo = {
  id: string;
  topic: string | null;
};

type Assunto = {
  nome: string;
  topico: string;
  quantidade: number;
};

type Disciplina = {
  nome: string;
  assuntos: Assunto[];
  quantidade: number;
};

const PAGE_SIZE = 500;

function splitTopic(topic: string) {
  const separator = " - ";
  const index = topic.indexOf(separator);
  if (index === -1) return { disciplina: topic.trim(), assunto: "Geral" };
  return {
    disciplina: topic.slice(0, index).trim(),
    assunto: topic.slice(index + separator.length).trim(),
  };
}

function isValidTopic(topic: string | null): topic is string {
  if (!topic?.trim()) return false;
  // Alguns registros antigos carregam URLs de rodapé do material como topic.
  return !/^https?:\/\//i.test(topic.trim());
}

async function fetchAll<T>(
  loader: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loader(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function Simulados() {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<QuestaoCatalogo[]>([]);
  const [disciplina, setDisciplina] = useState("");
  const [topico, setTopico] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [criando, setCriando] = useState(false);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Simulado[]>([]);
  const [disciplinaAberta, setDisciplinaAberta] = useState(false);
  const [assuntoAberto, setAssuntoAberto] = useState(false);
  const [buscaDisciplina, setBuscaDisciplina] = useState("");
  const [atalho, setAtalho] = useState<"rapido" | "focado" | "erros" | "revisao" | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      try {
        // Supabase limita uma resposta única a 1.000 linhas em muitos projetos.
        // Paginar aqui garante que nenhum assunto fique fora do catálogo.
        const questoes = await fetchAll<QuestaoCatalogo>(async (from, to) =>
          await supabase
            .from("questoes")
            .select("id, topic")
            .not("topic", "is", null)
            .range(from, to)
        );
        setCatalogo(questoes.filter((q) => isValidTopic(q.topic)));
      } catch {
        setErro("Não foi possível carregar todas as disciplinas e assuntos.");
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (userId) {
          const { data: sims } = await supabase
            .from("simulados")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "concluido")
            .order("finalizado_em", { ascending: false })
            .limit(15);
          setHistorico(sims ?? []);
        }
      } finally {
        setCarregandoHistorico(false);
        setCarregandoCatalogo(false);
      }
    })();
  }, []);

  const disciplinas = useMemo<Disciplina[]>(() => {
    const map = new Map<string, Map<string, number>>();

    for (const q of catalogo) {
      if (!q.topic) continue;
      const { disciplina, assunto } = splitTopic(q.topic);
      if (!disciplina) continue;
      if (!map.has(disciplina)) map.set(disciplina, new Map());
      const assuntos = map.get(disciplina)!;
      assuntos.set(assunto, (assuntos.get(assunto) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([nome, assuntosMap]) => {
        const assuntos = Array.from(assuntosMap.entries())
          .map(([assunto, quantidade]) => ({
            nome: assunto,
            topico: `${nome} - ${assunto}`,
            quantidade,
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        return {
          nome,
          assuntos,
          quantidade: assuntos.reduce((sum, a) => sum + a.quantidade, 0),
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [catalogo]);

  const disciplinasFiltradas = disciplinas.filter((d) => d.nome.toLowerCase().includes(buscaDisciplina.toLowerCase()));
  const disciplinaAtual = disciplinas.find((d) => d.nome === disciplina);
  const assuntos = disciplinaAtual?.assuntos ?? [];

  function mudarDisciplina(value: string) {
    setDisciplina(value);
    setTopico("");
  }

  async function iniciar() {
    setErro(null);
    setCriando(true);
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setErro("Faça login para iniciar um simulado.");
      setCriando(false);
      return;
    }

    try {
      const candidatas = (await fetchAll<QuestaoCatalogo>(async (from, to) => {
        let query = supabase.from("questoes").select("id, topic").order("rank", { ascending: true });
        if (topico) {
          query = query.eq("topic", topico);
        } else if (disciplina) {
          query = query.ilike("topic", `${disciplina} - %`);
        }
        return await query.range(from, to);
      })).filter((q) => isValidTopic(q.topic));

      if (candidatas.length === 0) {
        setErro("Nenhuma questão encontrada para esse filtro.");
        setCriando(false);
        return;
      }

      // Fisher-Yates: sorteio uniforme entre todas as candidatas, não só as primeiras 500.
      const embaralhadas = [...candidatas];
      for (let i = embaralhadas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]];
      }
      const selecionadas = embaralhadas.slice(0, quantidade);

      const { data: simulado, error: simError } = await supabase
        .from("simulados")
        .insert({
          user_id: userId,
          topico: topico || (disciplina ? disciplina : null),
          quantidade: selecionadas.length,
          total: selecionadas.length,
        })
        .select("*")
        .single();

      if (simError || !simulado) {
        setErro("Não foi possível criar o simulado.");
        setCriando(false);
        return;
      }

      const itens = selecionadas.map((q, i) => ({
        simulado_id: simulado.id,
        questao_id: q.id,
        ordem: i,
      }));

      const { error: itensError } = await supabase.from("simulado_itens").insert(itens);
      if (itensError) {
        setErro("O simulado foi criado, mas não foi possível adicionar as questões.");
        setCriando(false);
        return;
      }

      router.push(`/simulados/${simulado.id}`);
    } catch {
      setErro("Não foi possível carregar as questões do simulado.");
      setCriando(false);
    }
  }

  return (
    <div className="study-page mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
      <section className="sim-hero">
        <div>
          <p className="sim-kicker">Central de simulados</p>
          <h1>O que você quer treinar hoje?</h1>
          <p>Monte um treino rápido, foque uma disciplina ou transforme seus erros em novas questões.</p>
        </div>
        <div className="sim-hero__stat"><strong>{catalogo.length.toLocaleString("pt-BR")}</strong><span>questões disponíveis</span></div>
      </section>

      <section className="sim-shortcuts" aria-label="Atalhos de estudo">
        {([
          ["rapido", "⚡", "Rápido", "10 questões variadas"],
          ["focado", "🎯", "Focado", "Escolha disciplina/assunto"],
          ["erros", "✕", "Meus erros", "Treine seus pontos fracos"],
          ["revisao", "↻", "Revisão", "Retome o que precisa"],
        ] as const).map(([id, icon, title, desc]) => (
          <button key={id} type="button" onClick={() => { if (id === "erros") { router.push("/erros"); return; } if (id === "revisao") { router.push("/revisao"); return; } setAtalho(id); if (id === "rapido") { setDisciplina(""); setTopico(""); setQuantidade(10); } }} className={`sim-shortcut ${atalho === id ? "is-active" : ""}`}>
            <span className="sim-shortcut__icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span>
          </button>
        ))}
      </section>

      <div className="sim-layout">
        <section className="sim-builder glass">
          <div className="sim-section-head"><div><p>Montar personalizado</p><h2>Configure seu treino</h2></div><span className="sim-live">● catálogo atualizado</span></div>

          <div className="sim-fields">
            <div className="sim-field">
              <label>Disciplina</label>
              <button type="button" disabled={carregandoCatalogo} onClick={() => { setDisciplinaAberta(v => !v); setAssuntoAberto(false); }} className="sim-select">
                <span>📚 {disciplina || "Todas as disciplinas"}</span><span>⌄</span>
              </button>
              {disciplinaAberta && <div className="sim-popover">
                <input autoFocus value={buscaDisciplina} onChange={e => setBuscaDisciplina(e.target.value)} placeholder="🔎 Buscar disciplina..." />
                <button type="button" onClick={() => { mudarDisciplina(""); setDisciplinaAberta(false); }} className="sim-option is-all"><span>✓ Todas as disciplinas</span><em>{catalogo.length}</em></button>
                {disciplinasFiltradas.map(d => <button type="button" key={d.nome} onClick={() => { mudarDisciplina(d.nome); setDisciplinaAberta(false); }} className={`sim-option ${disciplina === d.nome ? "is-selected" : ""}`}><span>📘 {d.nome}<small>{d.assuntos.length} assuntos</small></span><em>{d.quantidade}</em></button>)}
              </div>}
            </div>

            <div className="sim-field">
              <label>Assunto</label>
              <button type="button" disabled={!disciplina || carregandoCatalogo} onClick={() => { setAssuntoAberto(v => !v); setDisciplinaAberta(false); }} className="sim-select"><span>🔎 {topico ? topico.split(" - ").slice(1).join(" - ") : "Todos os assuntos"}</span><span>⌄</span></button>
              {assuntoAberto && <div className="sim-popover sim-popover--subjects">
                <button type="button" onClick={() => { setTopico(""); setAssuntoAberto(false); }} className="sim-option is-all"><span>✓ Todos os assuntos</span><em>{disciplinaAtual?.quantidade ?? 0}</em></button>
                {assuntos.map(a => <button type="button" key={a.topico} onClick={() => { setTopico(a.topico); setAssuntoAberto(false); }} className={`sim-option ${topico === a.topico ? "is-selected" : ""}`}><span>📖 {a.nome}</span><em>{a.quantidade}</em></button>)}
              </div>}
            </div>
          </div>

          <div className="sim-quantity">
            <label>Quantidade</label>
            <div className="sim-quantity__buttons">
              {[5, 10, 20, 30, 50, 100].map(n => <button key={n} type="button" onClick={() => setQuantidade(n)} className={quantidade === n ? "is-active" : ""}>{n}</button>)}
              <input aria-label="Quantidade personalizada" type="number" min={5} max={100} value={quantidade} onChange={e => setQuantidade(Math.max(5, Math.min(100, Number(e.target.value) || 10)))} />
            </div>
          </div>

          <div className="sim-summary"><div><span>📊</span><div><b>{catalogo.length.toLocaleString("pt-BR")} questões disponíveis</b><small>{disciplinas.length} disciplinas · {disciplinas.reduce((n, d) => n + d.assuntos.length, 0)} assuntos</small></div></div><strong>{Math.min(quantidade, disciplinaAtual?.quantidade ?? catalogo.length)} selecionáveis</strong></div>

          {erro && <p className="sim-error">{erro}</p>}
          <button onClick={iniciar} disabled={criando || carregandoCatalogo} className="sim-start">{criando ? "Preparando simulado…" : "▶ COMEÇAR SIMULADO"}</button>
        </section>

        <aside className="sim-history">
          <div className="sim-section-head"><div><p>Seu histórico</p><h2>Últimos simulados</h2></div><span className="sim-link">Ver todos</span></div>
          <div className="sim-history-list">
            {carregandoHistorico ? <p className="sim-empty">Carregando…</p> : historico.length === 0 ? <p className="sim-empty">Nenhum simulado concluído ainda.</p> : historico.map(s => {
              const pct = s.total ? Math.round((s.acertos / s.total) * 100) : 0;
              const minutos = s.tempo_gasto_seg ? Math.round(s.tempo_gasto_seg / 60) : 0;
              return <article key={s.id} className="sim-history-card"><div className="sim-history-card__top"><span>SIMULADO</span><strong>{pct}%</strong></div><h3>{s.topico ?? "Todas as disciplinas"}</h3><p>{s.acertos}/{s.total} acertos · {minutos} min</p><div><button type="button" onClick={() => router.push(`/simulados/${s.id}`)}>Ver resultado</button><button type="button" onClick={() => { setDisciplina(""); setTopico(""); setQuantidade(s.total || 10); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Refazer</button></div></article>;
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Simulados />
    </AuthGate>
  );
}
