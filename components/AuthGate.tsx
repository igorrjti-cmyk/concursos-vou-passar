"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) setErro(error.message);
    else setEnviado(true);
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
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-white/60 p-8 shadow-sm">
          <h1 className="font-serif text-2xl text-ink">FAFIPA Study OS</h1>
          <p className="mt-2 text-sm text-ink-light/80">
            Contador — Prefeitura de Curitiba. Entre com seu e-mail para
            acessar sua fila e seu progresso.
          </p>
          {enviado ? (
            <p className="mt-6 rounded-md bg-gold/10 p-3 text-sm text-ink">
              Link de acesso enviado para <strong>{email}</strong>. Abra seu
              e-mail para entrar.
            </p>
          ) : (
            <form onSubmit={enviarLink} className="mt-6 space-y-3">
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper transition hover:bg-ink-light"
              >
                Enviar link de acesso
              </button>
              {erro && <p className="text-sm text-errado">{erro}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
