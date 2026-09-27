"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao } from "@/lib/types";

const CAMADAS = [
  { nome: "Núcleo prioritário", de: 1, ate: 160, cor: "bg-errado" },
  { nome: "Reforço", de: 161, ate: 320, cor: "bg-gold" },
  { nome: "Expansão", de: 321, ate: 480, cor: "bg-ink-light" },
  { nome: "Banco complementar", de: 481, ate: 965, cor: "bg-ink/40" },
];

function Dashboard() {
  const [proxima, setProxima] = useState<Questao | null>(null);
  const [totalFeitas, setTotalFeitas] = useState(0);
  const [totalCertas, setTotalCertas] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [revisoesHoje, setRevisoesHoje] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { count: total } = await supabase
        .from("questoes")
        .select("id", { count: "exact", head: true });
      setTotalQuestoes(total ?? 0);

      if (userId) {
        const { data: progresso } = await supabase
          .from("progresso")
          .select("questao_id,status,proxima_revisao")
          .eq("user_id", userId);

        const feitas = (progresso ?? []).filter(
          (p: Pick<Progresso, "status">) => p.status !== "nao_iniciada"
        );
        setTotalFeitas(feitas.length);
        setTotalCertas(
          feitas.filter((p: Pick<Progresso, "status">) => p.status === "feita_certo")
            .length
        );

        const hoje = new Date().toISOString().slice(0, 10);
        setRevisoesHoje(
          (progresso ?? []).filter(
            (p: Pick<Progresso, "proxima_revisao">) =>
              p.proxima_revisao && p.proxima_revisao <= hoje
          ).length
        );

        const feitasIds = new Set(feitas.map((p: Pick<Progresso, "questao_id">) => p.questao_id));
        const { data: questoes } = await supabase
          .from("questoes")
          .select("*")
          .order("rank", { ascending: true })
          .limit(400);
        const next = (questoes ?? []).find((q: Questao) => !feitasIds.has(q.id));
        setProxima(next ?? null);
      } else {
        const { data: questoes } = await supabase
          .from("questoes")
          .select("*")
          .order("rank", { ascending: true })
          .limit(1);
        setProxima(questoes?.[0] ?? null);
      }
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-gold/80">Study OS · 2026</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">O que estudar hoje?</h1>
      <p className="mt-1 text-ink-light/70">
        Contador — Prefeitura de Curitiba (FAFIPA), 2026.
      </p></div><div className="rounded-2xl border border-gold/15 bg-gold/5 px-4 py-3 text-xs font-semibold tracking-wide text-gold/80">FOCO · CONTADOR CURITIBA</div></div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Questões feitas" value={`${totalFeitas} / ${totalQuestoes}`} />
        <StatCard
          label="Aproveitamento"
          value={totalFeitas ? `${Math.round((totalCertas / totalFeitas) * 100)}%` : "—"}
        />
        <StatCard label="Revisões pendentes hoje" value={String(revisoesHoje)} />
      </div>

      <section className="mt-10">
        {carregando ? (
          <p className="text-ink-light/60">Carregando sua fila…</p>
        ) : proxima ? (
          <Link
            href={`/questao/${proxima.id}`}
            className="group block rounded-2xl border border-white/10 bg-white/70 p-6 shadow-[0_16px_40px_rgba(0,0,0,.20)] transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white/80"
          >
            <div className="flex items-center justify-between">
              <span className="badge bg-ink text-paper">Fila #{proxima.rank}</span>
              {proxima.resolution && (
                <span className="badge bg-gold/20 text-gold">com resolução</span>
              )}
            </div>
            <p className="mt-3 text-sm text-ink-light/70">{proxima.topic}</p>
            <p className="mt-2 line-clamp-3 font-serif text-lg text-ink">
              {proxima.stem}
            </p>
            <p className="mt-4 text-sm font-medium text-gold">
              Continuar a fila →
            </p>
          </Link>
        ) : (
          <p className="rounded-lg border border-ink/10 bg-white/70 p-6 text-ink-light/70">
            Você concluiu todas as questões da fila. 🎉
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">Camadas</h2>
        <div className="mt-4 space-y-2">
          {CAMADAS.map((c) => (
            <div
              key={c.nome}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/50 px-4 py-3 transition hover:border-gold/25 hover:bg-white/70"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${c.cor}`} />
                <span className="text-sm text-ink">{c.nome}</span>
              </div>
              <span className="text-xs text-ink-light/60">
                {c.de}–{c.ate}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-5 shadow-[0_14px_35px_rgba(0,0,0,.18)]">
      <p className="text-xs uppercase tracking-wide text-ink-light/50">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Dashboard />
    </AuthGate>
  );
}
