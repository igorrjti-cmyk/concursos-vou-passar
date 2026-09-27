"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/", label: "Painel", icon: "grid" },
  { href: "/fila", label: "Fila", icon: "list" },
  { href: "/erros", label: "Erros", icon: "alert" },
  { href: "/revisao", label: "Revisão", icon: "clock" },
  { href: "/desempenho", label: "Desempenho", icon: "chart" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
    alert: <><path d="M12 4l9 16H3L12 4Z"/><path d="M12 9v5M12 17h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    upload: <><path d="M12 16V4M8 8l4-4 4 4"/><path d="M5 20h14"/></>,
  };
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Nav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  async function sair() { await getSupabaseClient().auth.signOut(); window.location.href = "/"; }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[.07] bg-[#050810]/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setAberto(false)} className="group flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[.08] shadow-[0_0_30px_rgba(231,187,98,.08)]">
            <span className="absolute inset-1 rounded-xl border border-gold/10" />
            <span className="font-serif text-lg font-bold text-gold">F</span>
          </span>
          <span className="hidden min-[430px]:block"><span className="block text-sm font-semibold tracking-tight text-white">FAFIPA Study OS</span><span className="block text-[10px] uppercase tracking-[.18em] text-white/35">Contador · Curitiba</span></span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 rounded-2xl border border-white/[.08] bg-white/[.025] p-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return <Link key={l.href} href={l.href} className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-gold/[.13] text-gold shadow-[inset_0_0_0_1px_rgba(231,187,98,.12)]" : "text-white/50 hover:bg-white/[.05] hover:text-white/85"}`}><Icon name={l.icon}/>{l.label}</Link>;
          })}
        </nav>
        <button onClick={() => setAberto(v=>!v)} aria-label={aberto?"Fechar menu":"Abrir menu"} aria-expanded={aberto} className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-white/75 hidden"><Icon name={aberto?"alert":"list"}/></button>
        <button onClick={sair} className="hidden rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-medium text-white/45 transition hover:border-white/15 hover:text-white/80 lg:block">Sair</button>
      </div>
      {aberto && <nav className="border-t border-white/[.07] bg-[#070b14]/98 px-4 py-3 shadow-2xl hidden"><div className="grid grid-cols-2 gap-2">{links.map(l=>{const active=pathname===l.href|| (l.href!=="/"&&pathname.startsWith(l.href));return <Link key={l.href} href={l.href} onClick={()=>setAberto(false)} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${active?"bg-gold/10 text-gold":"text-white/60 hover:bg-white/5 hover:text-white"}`}><Icon name={l.icon}/>{l.label}</Link>})}</div><button onClick={sair} className="mt-2 w-full rounded-xl px-3 py-3 text-left text-sm text-white/40">Sair da conta</button></nav>}
    </header>
  );
}
