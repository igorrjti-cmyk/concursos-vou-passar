"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Questao } from "@/lib/types";

function Favoritos() {
  const [itens, setItens] = useState<Questao[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setCarregando(false);
      return;
    }

    const { data: favoritos } = await supabase
      .from("favoritos")
      .select("questao_id")
      .eq("user_id", userId);

    const ids = (favoritos ?? []).map((f) => f.questao_id);
    if (ids.length === 0) {
      setItens([]);
      setCarregando(false);
      return;
    }

    const { data: questoes } = await supabase
      .from("questoes")
      .select("*")
      .in("id", ids)
      .order("rank", { ascending: true });

    setItens(questoes ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(questaoId: string) {
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from("favoritos")
      .delete()
      .eq("user_id", userId)
      .eq("questao_id", questaoId);
    setItens((prev) => prev.filter((q) => q.id !== questaoId));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Favoritos</h1>
      <p className="mt-1 text-ink-light/70">
        Questões que você marcou para revisar com calma.
      </p>

      <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
        {carregando ? (
          <p className="p-6 text-ink-light/60">Carregando…</p>
        ) : itens.length === 0 ? (
          <p className="p-6 text-ink-light/60">
            Nenhum favorito ainda. Toque na estrela ☆ dentro de uma questão para
            adicionar.
          </p>
        ) : (
          itens.map((q) => (
            <div key={q.id} className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`/questao/${q.id}`}
                className="flex flex-1 items-center gap-4 truncate transition hover:opacity-80"
              >
                <span className="w-12 shrink-0 font-serif text-sm text-ink-light/50">
                  #{q.rank}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{q.topic}</span>
              </Link>
              <button
                onClick={() => remover(q.id)}
                aria-label="Remover dos favoritos"
                className="shrink-0 text-lg text-gold"
              >
                ★
              </button>
            </div>
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
      <Favoritos />
    </AuthGate>
  );
}
