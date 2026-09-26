"use client";

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

  async function sair() {
    await getSupabaseClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg tracking-tight">
          FAFIPA Study OS
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname === l.href
                  ? "text-gold-light"
                  : "text-paper/70 transition hover:text-paper"
              }
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
      </div>
    </header>
  );
}
