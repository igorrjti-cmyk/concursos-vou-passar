"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Questao } from "@/lib/types";

function Revisao() {
  const [itens, setItens] = useState<(Questao & { proxima_revisao: string })[]>([]);
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

      const hoje = new Date().toISOString().slice(0, 10);
      const { data: progresso } = await supabase
        .from("progresso")
        .select("questao_id,proxima_revisao")
        .eq("user_id", userId)
        .not("proxima_revisao", "is", null)
        .lte("proxima_revisao", hoje)
        .order("proxima_revisao", { ascending: true });

      const ids = (progresso ?? []).map((p) => p.questao_id);
      if (ids.length === 0) {
        setCarregando(false);
        return;
      }

      const { data: questoes } = await supabase
        .from("questoes")
        .select("*")
        .in("id", ids);

      const revisaoMap = Object.fromEntries(
        (progresso ?? []).map((p) => [p.questao_id, p.proxima_revisao])
      );

      const ordenado = (questoes ?? [])
        .map((q: Questao) => ({ ...q, proxima_revisao: revisaoMap[q.id] }))
        .sort((a, b) => a.proxima_revisao.localeCompare(b.proxima_revisao));

      setItens(ordenado);
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Revisão espaçada</h1>
      <p className="mt-1 text-ink-light/70">Questões prontas para revisar hoje.</p>

      <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
        {carregando ? (
          <p className="p-6 text-ink-light/60">Carregando…</p>
        ) : itens.length === 0 ? (
          <p className="p-6 text-ink-light/60">Nada agendado para hoje.</p>
        ) : (
          itens.map((q) => (
            <Link
              key={q.id}
              href={`/questao/${q.id}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/80"
            >
              <span className="w-12 shrink-0 font-serif text-sm text-ink-light/50">
                #{q.rank}
              </span>
              <span className="flex-1 truncate text-sm text-ink">{q.topic}</span>
              <span className="badge bg-ink/10 text-ink-light">
                desde {q.proxima_revisao}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Revisao />
    </AuthGate>
  );
}
