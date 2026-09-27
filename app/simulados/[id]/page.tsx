"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Questao, Simulado, SimuladoItem } from "@/lib/types";

function formatarTempo(seg: number) {
  const m = Math.floor(seg / 60)
    .toString()
    .padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type ItemComQuestao = SimuladoItem & { questao: Questao };

function RodarSimulado({ id }: { id: string }) {
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [itens, setItens] = useState<ItemComQuestao[]>([]);
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: sim } = await supabase.from("simulados").select("*").eq("id", id).maybeSingle();
      setSimulado(sim ?? null);

      if (sim?.status === "concluido") {
        setCarregando(false);
        return;
      }

      const { data: simItens } = await supabase
        .from("simulado_itens")
        .select("*")
        .eq("simulado_id", id)
        .order("ordem", { ascending: true });

      const ids = (simItens ?? []).map((i) => i.questao_id);
      const { data: questoes } = await supabase.from("questoes").select("*").in("id", ids);
      const questaoPorId = Object.fromEntries((questoes ?? []).map((q) => [q.id, q]));

      const combinados = (simItens ?? [])
        .map((i) => ({ ...i, questao: questaoPorId[i.questao_id] }))
        .filter((i): i is ItemComQuestao => !!i.questao);

      setItens(combinados);
      setCarregando(false);

      intervalRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  async function responderEAvancar() {
    if (!selecionada || !itens[indice]) return;
    const item = itens[indice];
    const acertou = selecionada === item.questao.answer;
    const supabase = getSupabaseClient();
    await supabase
      .from("simulado_itens")
      .update({ alternativa_marcada: selecionada, acertou })
      .eq("id", item.id);

    setItens((prev) => {
      const cp = [...prev];
      cp[indice] = { ...cp[indice], alternativa_marcada: selecionada, acertou };
      return cp;
    });

    if (indice + 1 < itens.length) {
      setIndice(indice + 1);
      setSelecionada(null);
    } else {
      await finalizar();
    }
  }

  async function finalizar() {
    setFinalizando(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const supabase = getSupabaseClient();
    const { data: itensFinais } = await supabase
      .from("simulado_itens")
      .select("acertou")
      .eq("simulado_id", id);
    const acertos = (itensFinais ?? []).filter((i) => i.acertou).length;
    const total = (itensFinais ?? []).length;
    const { data: atualizado } = await supabase
      .from("simulados")
      .update({
        status: "concluido",
        acertos,
        total,
        tempo_gasto_seg: segundos,
        finalizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    setSimulado(atualizado ?? null);
    setFinalizando(false);
  }

  if (carregando) {
    return <p className="px-4 py-8 sm:px-6 sm:py-10 text-ink-light/60">Carregando simulado…</p>;
  }

  if (!simulado) {
    return <p className="px-4 py-8 sm:px-6 sm:py-10 text-ink-light/60">Simulado não encontrado.</p>;
  }

  if (simulado.status === "concluido") {
    const pct = simulado.total ? Math.round((simulado.acertos / simulado.total) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-serif text-3xl text-ink">Resultado do simulado</h1>
        <p className="mt-1 text-ink-light/70">{simulado.topico ?? "Todos os assuntos"}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Resumo label="Acertos" valor={`${simulado.acertos}/${simulado.total}`} />
          <Resumo label="Percentual" valor={`${pct}%`} />
          <Resumo
            label="Tempo"
            valor={simulado.tempo_gasto_seg ? formatarTempo(simulado.tempo_gasto_seg) : "—"}
          />
        </div>

        <div className="mt-8">
          <Link href="/simulados" className="text-sm text-gold hover:underline">
            ← Voltar para simulados
          </Link>
        </div>
      </div>
    );
  }

  const item = itens[indice];
  if (!item) {
    return <p className="px-4 py-8 sm:px-6 sm:py-10 text-ink-light/60">Nenhuma questão neste simulado.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-5 sm:px-6 sm:py-10 md:pb-10">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-light/70">
          Questão {indice + 1} de {itens.length}
        </span>
        <span className="badge bg-ink text-paper">⏱ {formatarTempo(segundos)}</span>
      </div>

      <p className="mt-4 whitespace-pre-line font-serif text-[1.05rem] leading-8 text-ink sm:text-lg">
        {item.questao.stem}
      </p>

      <div className="mt-6 space-y-2">
        {item.questao.options.map(([letra, texto]) => (
          <button
            key={letra}
            onClick={() => setSelecionada(letra)}
            className={`question-option w-full rounded-2xl border px-4 py-4 text-left text-[0.93rem] leading-6 transition duration-150 ${
              selecionada === letra ? "border-gold bg-gold/10" : "border-ink/15 bg-white/60 hover:border-gold"
            }`}
          >
            <span className="mr-2 font-medium">{letra})</span>
            {texto}
          </button>
        ))}
      </div>

      <button
        disabled={!selecionada || finalizando}
        onClick={responderEAvancar}
        className="mobile-action mt-6 min-h-12 w-full rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-[#171107] shadow-lg shadow-gold/10 transition hover:bg-gold-light disabled:opacity-40"
      >
        {finalizando
          ? "Calculando resultado…"
          : indice + 1 < itens.length
          ? "Próxima questão →"
          : "Finalizar simulado"}
      </button>
    </div>
  );
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-ink-light/50">{label}</p>
      <p className="mt-1 font-serif text-xl text-ink">{valor}</p>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AuthGate>
      <Nav />
      <RodarSimulado id={params.id} />
    </AuthGate>
  );
}
