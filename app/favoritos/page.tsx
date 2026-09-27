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
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setCarregando(false);
      return;
    }

    const { data: favoritos, error: erroFavoritos } = await supabase
      .from("favoritos")
      .select("questao_id")
      .eq("user_id", userId);
    if (erroFavoritos) {
      setErro("Não foi possível carregar seus favoritos agora. Tente novamente.");
      setCarregando(false);
      return;
    }

    const ids = (favoritos ?? []).map((f) => f.questao_id);
    if (ids.length === 0) {
      setItens([]);
      setCarregando(false);
      return;
    }

    const { data: questoes, error: erroQuestoes } = await supabase
      .from("questoes")
      .select("*")
      .in("id", ids)
      .order("rank", { ascending: true });
    if (erroQuestoes) {
      setErro("Não foi possível carregar as questões favoritadas agora. Tente novamente.");
      setCarregando(false);
      return;
    }

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
    <div className="study-page mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Favoritos</h1>
      <p className="mt-1 text-ink-light/70">
        Questões que você marcou para revisar com calma.
      </p>

      <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-white/10 bg-white/60">
        {carregando ? (
          <p className="p-6 text-ink-light/60">Carregando…</p>
        ) : erro ? (
          <p className="p-6 text-errado">{erro}</p>
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
