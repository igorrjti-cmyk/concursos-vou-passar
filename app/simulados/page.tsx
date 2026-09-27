"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Simulado } from "@/lib/types";

function Simulados() {
  const router = useRouter();
  const [topicos, setTopicos] = useState<string[]>([]);
  const [topico, setTopico] = useState<string>("");
  const [quantidade, setQuantidade] = useState(10);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Simulado[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("questoes")
        .select("topic")
        .not("topic", "is", null);
      const unicos = Array.from(new Set((data ?? []).map((q) => q.topic as string))).sort();
      setTopicos(unicos);

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
      setCarregandoHistorico(false);
    })();
  }, []);

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

    let query = supabase.from("questoes").select("id").order("rank", { ascending: true });
    if (topico) query = query.eq("topic", topico);
    const { data: candidatas, error } = await query.limit(500);

    if (error || !candidatas || candidatas.length === 0) {
      setErro("Nenhuma questão encontrada para esse filtro.");
      setCriando(false);
      return;
    }

    const embaralhadas = [...candidatas].sort(() => Math.random() - 0.5).slice(0, quantidade);

    const { data: simulado, error: simError } = await supabase
      .from("simulados")
      .insert({ user_id: userId, topico: topico || null, quantidade: embaralhadas.length, total: embaralhadas.length })
      .select("*")
      .single();

    if (simError || !simulado) {
      setErro("Não foi possível criar o simulado.");
      setCriando(false);
      return;
    }

    const itens = embaralhadas.map((q, i) => ({
      simulado_id: simulado.id,
      questao_id: q.id,
      ordem: i,
    }));
    await supabase.from("simulado_itens").insert(itens);

    router.push(`/simulados/${simulado.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Simulados</h1>
      <p className="mt-1 text-ink-light/70">
        Monte uma prova rápida com cronômetro e veja seu desempenho no final.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/60 p-5">
        <label className="block text-sm text-ink">
          Disciplina / assunto
          <select
            value={topico}
            onChange={(e) => setTopico(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value="">Todos os assuntos</option>
            {topicos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-ink">
          Quantidade de questões
          <input
            type="number"
            min={5}
            max={100}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(5, Math.min(100, Number(e.target.value) || 10)))}
            className="mt-1 w-full rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>

        {erro && <p className="text-sm text-errado">{erro}</p>}

        <button
          onClick={iniciar}
          disabled={criando}
          className="w-full rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-[#171107] transition hover:bg-gold-light disabled:opacity-40"
        >
          {criando ? "Preparando…" : "Iniciar simulado"}
        </button>
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-lg text-ink">Histórico</h2>
        <div className="mt-3 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
          {carregandoHistorico ? (
            <p className="p-6 text-ink-light/60">Carregando…</p>
          ) : historico.length === 0 ? (
            <p className="p-6 text-ink-light/60">Nenhum simulado concluído ainda.</p>
          ) : (
            historico.map((s) => {
              const pct = s.total ? Math.round((s.acertos / s.total) * 100) : 0;
              const minutos = s.tempo_gasto_seg ? Math.round(s.tempo_gasto_seg / 60) : 0;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-ink">{s.topico ?? "Todos os assuntos"}</p>
                    <p className="text-xs text-ink-light/60">
                      {s.acertos}/{s.total} acertos · {minutos} min
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      pct >= 70 ? "bg-certo/10 text-certo" : pct >= 40 ? "bg-gold/20 text-gold" : "bg-errado/10 text-errado"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })
          )}
        </div>
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
