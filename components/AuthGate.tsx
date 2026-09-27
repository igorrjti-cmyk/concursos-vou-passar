"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) setErro(error.message === "Invalid login credentials"
      ? "E-mail ou senha incorretos."
      : error.message);
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-light/70">
        Carregando…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 border-t-[3px] border-t-gold bg-white/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,.38)] backdrop-blur-xl">
          <h1 className="font-serif text-2xl text-ink">FAFIPA Study OS</h1>
          <p className="mt-2 text-sm text-ink-light/80">
            Contador — Prefeitura de Curitiba. Entre com seu e-mail e senha
            para acessar sua fila e seu progresso.
          </p>
          <form onSubmit={entrar} className="mt-6 space-y-3">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition focus:border-gold focus:bg-white/10"
            />
            <input
              type="password"
              required
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition focus:border-gold focus:bg-white/10"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-[#171107] shadow-lg shadow-gold/10 transition hover:bg-gold-light disabled:opacity-60"
            >
              {enviando ? "Entrando…" : "Entrar"}
            </button>
            {erro && <p className="text-sm text-errado">{erro}</p>}
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
