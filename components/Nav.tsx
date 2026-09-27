"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/", label: "Painel" },
  { href: "/fila", label: "Fila" },
  { href: "/erros", label: "Central de erros" },
  { href: "/revisao", label: "Revisão" },
  { href: "/desempenho", label: "Desempenho" },
  { href: "/admin", label: "Importar" },
];

export default function Nav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  async function sair() {
    await getSupabaseClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 border-t-[3px] border-t-gold bg-ink-dark/95 text-paper shadow-[0_10px_35px_rgba(0,0,0,.28)] backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          onClick={() => setAberto(false)}
          className="font-serif text-lg font-semibold tracking-tight text-paper"
        >
          FAFIPA Study OS
        </Link>

        {/* Navegação de mesa (md e acima) */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[.04] p-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 transition ${
                pathname === l.href
                  ? "bg-gold/15 text-gold-light"
                  : "border-transparent text-paper/65 hover:bg-white/5 hover:text-paper"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={sair}
            className="rounded-full px-3 py-1.5 text-paper/50 transition hover:bg-white/5 hover:text-paper/90"
          >
            Sair
          </button>
        </nav>

        {/* Botão hambúrguer (abaixo de md) */}
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-paper transition hover:bg-white/10 md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            {aberto ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Painel de navegação mobile */}
      {aberto && (
        <nav className="flex flex-col border-t border-white/10 bg-ink-dark/98 px-4 py-3 text-sm shadow-2xl md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className={`rounded-md px-2 py-2.5 transition ${
                pathname === l.href
                  ? "text-gold-light"
                  : "text-paper/70 hover:text-paper"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={sair}
            className="mt-1 rounded-md px-2 py-2.5 text-left text-paper/50 transition hover:text-paper/80"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  );
}
