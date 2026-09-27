"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";

type LinhaTopico = {
  topico: string;
  feitas: number;
  certas: number;
};

function Desempenho() {
  const [linhas, setLinhas] = useState<LinhaTopico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setCarregando(false);
        return;
      }

      const { data: progresso } = await supabase
        .from("progresso")
        .select("questao_id,status")
        .eq("user_id", userId)
        .neq("status", "nao_iniciada");

      if (!progresso || progresso.length === 0) {
        setCarregando(false);
        return;
      }

      const ids = progresso.map((p) => p.questao_id);
      const { data: questoes } = await supabase
        .from("questoes")
        .select("id,topic")
        .in("id", ids);

      const topicoPorId = Object.fromEntries(
        (questoes ?? []).map((q) => [q.id, q.topic ?? "Sem tópico"])
      );

      const agregada: Record<string, LinhaTopico> = {};
      progresso.forEach((p) => {
        const topico = topicoPorId[p.questao_id] ?? "Sem tópico";
        if (!agregada[topico]) agregada[topico] = { topico, feitas: 0, certas: 0 };
        agregada[topico].feitas += 1;
        if (p.status === "feita_certo") agregada[topico].certas += 1;
      });

      setLinhas(
        Object.values(agregada).sort((a, b) => b.feitas - a.feitas)
      );
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Desempenho por tópico</h1>
      <p className="mt-1 text-ink-light/70">
        Onde focar antes da prova de 06/12.
      </p>

      <div className="mt-6 space-y-3">
        {carregando ? (
          <p className="text-ink-light/60">Carregando…</p>
        ) : linhas.length === 0 ? (
          <p className="text-ink-light/60">
            Responda algumas questões para ver seu desempenho aqui.
          </p>
        ) : (
          linhas.map((l) => {
            const pct = Math.round((l.certas / l.feitas) * 100);
            return (
              <div
                key={l.topico}
                className="rounded-2xl border border-white/10 bg-white/60 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{l.topico}</span>
                  <span className="text-ink-light/60">
                    {l.certas}/{l.feitas} ({pct}%)
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
                  <div
                    className={`h-1.5 rounded-full ${
                      pct >= 70 ? "bg-certo" : pct >= 40 ? "bg-gold" : "bg-errado"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Desempenho />
    </AuthGate>
  );
}
