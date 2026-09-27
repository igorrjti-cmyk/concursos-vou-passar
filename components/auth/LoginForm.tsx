"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
      <p className="font-serif text-lg text-white">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-white/25">{label}</p>
    </div>
  );
}

function Brand() {
  return (
    <div className="relative hidden overflow-hidden p-10 md:flex md:flex-col md:justify-between">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[.08] font-serif text-xl font-bold text-gold">
          F
        </div>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.24em] text-gold/70">
          FAFIPA Study OS · 2026
        </p>
        <h1 className="mt-3 max-w-md font-serif text-4xl font-semibold leading-tight text-white">
          Estude com <span className="text-gradient">clareza.</span>
          <br />
          Revise com propósito.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/40">
          Seu centro de preparação para Contador — Prefeitura de Curitiba, com fila de questões,
          erros e revisão espaçada em um só lugar.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard value="965+" label="questões" />
        <StatCard value="24/7" label="acesso" />
        <StatCard value="OS" label="de estudo" />
      </div>
    </div>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050810] px-4 py-10">
      <div className="absolute left-[-12%] top-[-10%] h-[420px] w-[420px] rounded-full bg-gold/[.08] blur-[110px]" />
      <div className="absolute bottom-[-18%] right-[-8%] h-[420px] w-[420px] rounded-full bg-blue-500/[.08] blur-[120px]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/[.08] bg-[#0a101d]/90 shadow-[0_40px_120px_rgba(0,0,0,.5)] backdrop-blur-2xl md:grid-cols-[1.05fr_.95fr]">
        <Brand />
        <div className="border-l border-white/[.06] p-7 sm:p-10">
          <div className="mx-auto max-w-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/30">Área do aluno</p>
            <h2 className="mt-2 font-serif text-3xl text-white">Bem-vindo de volta.</h2>
            <p className="mt-2 text-sm leading-6 text-white/40">Entre para continuar exatamente de onde parou.</p>
            <form onSubmit={entrar} className="mt-8 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/45">E-mail</span>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-gold/60 focus:ring-4 focus:ring-gold/[.06]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/45">Senha</span>
                <input
                  type="password"
                  required
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-gold/60 focus:ring-4 focus:ring-gold/[.06]"
                />
              </label>
              <button
                type="submit"
                disabled={enviando}
                className="mt-3 w-full rounded-2xl bg-gold px-4 py-3.5 text-sm font-bold text-[#151006] shadow-[0_14px_35px_rgba(231,187,98,.16)] transition hover:-translate-y-0.5 hover:bg-[#f0c975] disabled:opacity-50"
              >
                {enviando ? "Entrando…" : "Entrar no Study OS →"}
              </button>
              {erro && (
                <p className="rounded-xl border border-red-400/15 bg-red-400/[.06] px-3 py-2.5 text-xs text-red-300">
                  {erro}
                </p>
              )}
            </form>
            <p className="mt-7 text-center text-[10px] leading-5 text-white/20">
              Ambiente privado de estudos · seus dados de progresso ficam vinculados à sua conta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
