"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Questao } from "@/lib/types";

type ItemErro = Questao & {
  status: string;
  error_count: number;
  ultima_resolucao: string | null;
  observacao: string | null;
};

type Aba = "todos" | "hoje" | "recorrentes" | "disciplina";

function CentralErros() {
  const [itens, setItens] = useState<ItemErro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>("todos");

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
        .select("questao_id,status,error_count,ultima_resolucao,observacao")
        .eq("user_id", userId)
        .in("status", ["feita_errado", "duvida"]);

      const ids = (progresso ?? []).map((p) => p.questao_id);
      if (ids.length === 0) {
        setCarregando(false);
        return;
      }

      const { data: questoes } = await supabase
        .from("questoes")
        .select("*")
        .in("id", ids)
        .order("rank", { ascending: true });

      const infoMap = Object.fromEntries((progresso ?? []).map((p) => [p.questao_id, p]));

      setItens(
        (questoes ?? []).map((q: Questao) => ({
          ...q,
          status: infoMap[q.id]?.status,
          error_count: infoMap[q.id]?.error_count ?? 0,
          ultima_resolucao: infoMap[q.id]?.ultima_resolucao ?? null,
          observacao: infoMap[q.id]?.observacao ?? null,
        }))
      );
      setCarregando(false);
    })();
  }, []);

  const hojeStr = new Date().toISOString().slice(0, 10);

  const filtrados = useMemo(() => {
    if (aba === "hoje") {
      return itens.filter((q) => q.ultima_resolucao?.slice(0, 10) === hojeStr);
    }
    if (aba === "recorrentes") {
      return itens.filter((q) => q.error_count >= 2);
    }
    return itens;
  }, [itens, aba, hojeStr]);

  const porDisciplina = useMemo(() => {
    const grupos: Record<string, ItemErro[]> = {};
    itens.forEach((q) => {
      const chave = q.topic ?? "Sem disciplina";
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(q);
    });
    return Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
  }, [itens]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Central de erros</h1>
      <p className="mt-1 text-ink-light/70">
        Tudo que você está errando ou marcou como dúvida.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos"],
            ["hoje", "Hoje"],
            ["recorrentes", "Recorrentes"],
            ["disciplina", "Por disciplina"],
          ] as [Aba, string][]
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={`rounded-full px-3 py-1 text-xs ${
              aba === valor ? "bg-ink text-paper" : "bg-white/60 text-ink-light border border-ink/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "disciplina" ? (
        <div className="mt-6 space-y-4">
          {carregando ? (
            <p className="text-ink-light/60">Carregando…</p>
          ) : porDisciplina.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/60 p-6 text-ink-light/60">
              Nenhum erro ou dúvida registrada ainda. 👍
            </p>
          ) : (
            porDisciplina.map(([disciplina, qs]) => (
              <div key={disciplina} className="rounded-2xl border border-white/10 bg-white/60">
                <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2 text-sm">
                  <span className="text-ink">{disciplina}</span>
                  <span className="text-ink-light/60">{qs.length} questão(ões)</span>
                </div>
                <div className="divide-y divide-ink/10">
                  {qs.map((q) => (
                    <ItemLinha key={q.id} q={q} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
          {carregando ? (
            <p className="p-6 text-ink-light/60">Carregando…</p>
          ) : filtrados.length === 0 ? (
            <p className="p-6 text-ink-light/60">Nada por aqui. 👍</p>
          ) : (
            filtrados.map((q) => <ItemLinha key={q.id} q={q} />)
          )}
        </div>
      )}
    </div>
  );
}

function ItemLinha({ q }: { q: ItemErro }) {
  return (
    <Link
      href={`/questao/${q.id}`}
      className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/80"
    >
      <span className="w-12 shrink-0 font-serif text-sm text-ink-light/50">#{q.rank}</span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{q.topic}</span>
        {q.observacao && (
          <span className="block truncate text-xs text-ink-light/60">{q.observacao}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`badge ${
            q.status === "duvida" ? "bg-gold/20 text-gold" : "bg-errado/10 text-errado"
          }`}
        >
          {q.status === "duvida" ? "Dúvida" : `Errou (${q.error_count}x)`}
        </span>
        {q.ultima_resolucao && (
          <span className="text-[10px] text-ink-light/50">
            {new Date(q.ultima_resolucao).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <CentralErros />
    </AuthGate>
  );
}
