"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const items = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/fila", label: "Fila", icon: "list" },
  { href: "/revisao", label: "Revisão", icon: "clock" },
  { href: "/erros", label: "Erros", icon: "alert" },
];

const maisItens = [
  { href: "/favoritos", label: "Favoritos", icon: "star" },
  { href: "/metas", label: "Metas", icon: "target" },
  { href: "/simulados", label: "Simulados", icon: "timer" },
  { href: "/desempenho", label: "Desempenho", icon: "chart" },
  { href: "/buscar", label: "Buscar", icon: "search" },
];

function Icon({ name }: { name: string }) {
  const p: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="M12 4l9 16H3L12 4Z"/><path d="M12 9v5M12 17h.01"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    star: <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.7 6.8 19.5l1-5.8L3.6 9.6l5.8-.8L12 3.5Z"/>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
}

export default function MobileStudyBar() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  async function sair() {
    await getSupabaseClient().auth.signOut();
    window.location.href = "/";
  }

  const maisAtivo = maisItens.some((m) => pathname === m.href || pathname.startsWith(m.href));

  return (
    <>
      {maisAberto && (
        <div
          className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMaisAberto(false)}
        />
      )}
      {maisAberto && (
        <div className="fixed inset-x-0 bottom-0 z-[90] rounded-t-3xl border-t border-white/10 bg-[#0b1120] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:hidden">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
          <div className="grid grid-cols-3 gap-3">
            {maisItens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMaisAberto(false)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-2 py-4 text-xs text-white/80 transition hover:bg-white/[.08]"
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
            <button
              onClick={sair}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-2 py-4 text-xs text-white/50"
            >
              <Icon name="close" />
              Sair
            </button>
          </div>
        </div>
      )}

      <nav className="mobile-study-bar" aria-label="Navegação principal mobile">
        <div className="mobile-study-bar__inner" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`mobile-study-item ${active ? "is-active" : ""}`}>
                <span className="mobile-study-item__icon"><Icon name={item.icon} /></span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMaisAberto((v) => !v)}
            className={`mobile-study-item ${maisAtivo || maisAberto ? "is-active" : ""}`}
          >
            <span className="mobile-study-item__icon"><Icon name="more" /></span>
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
