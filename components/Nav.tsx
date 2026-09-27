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
    <header className="sticky top-0 z-20 border-b border-ink/10 border-t-[3px] border-t-gold bg-ink text-paper pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setAberto(false)}
          className="font-serif text-lg tracking-tight"
        >
          FAFIPA Study OS
        </Link>

        {/* Navegação de mesa (md e acima) */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 pb-0.5 transition ${
                pathname === l.href
                  ? "border-gold-light text-paper"
                  : "border-transparent text-paper/70 hover:border-paper/30 hover:text-paper"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={sair}
            className="text-paper/50 transition hover:text-paper/80"
          >
            Sair
          </button>
        </nav>

        {/* Botão hambúrguer (abaixo de md) */}
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          className="flex h-9 w-9 items-center justify-center rounded-md text-paper transition hover:bg-paper/10 md:hidden"
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
        <nav className="flex flex-col border-t border-paper/10 bg-ink-dark px-4 py-2 text-sm md:hidden">
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
