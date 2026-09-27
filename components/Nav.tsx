"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/", label: "Início", icon: "grid" },
  { href: "/fila", label: "Fila de estudos", short: "Fila", icon: "list" },
  { href: "/revisao", label: "Revisão", icon: "clock" },
  { href: "/erros", label: "Erros", icon: "alert" },
  { href: "/favoritos", label: "Favoritos", icon: "star" },
  { href: "/metas", label: "Metas", icon: "target" },
  { href: "/simulados", label: "Simulados", icon: "timer" },
  { href: "/desempenho", label: "Desempenho", icon: "chart" },
  { href: "/buscar", label: "Buscar questões", short: "Buscar", icon: "search" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
    alert: <><path d="M12 4l9 16H3L12 4Z"/><path d="M12 9v5M12 17h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    star: <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.7 6.8 19.5l1-5.8L3.6 9.6l5.8-.8L12 3.5Z"/>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  };
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Nav() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function sair() {
    await getSupabaseClient().auth.signOut();
    window.location.href = "/";
  }

  function active(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  function submitBusca(e: React.FormEvent) {
    e.preventDefault();
    const q = busca.trim();
    if (q) window.location.href = `/buscar?q=${encodeURIComponent(q)}`;
    else window.location.href = "/buscar";
  }

  return (
    <div className="nav-shell">
      <header className="study-topbar">
        <div className="study-topbar__brand">
          <Link href="/" className="study-brand" aria-label="FAFIPA Study OS">
            <span className="study-brand__mark"><span>F</span></span>
            <span className="study-brand__copy">
              <strong>FAFIPA Study OS</strong>
              <small>Contador · Curitiba</small>
            </span>
          </Link>
        </div>

        <form onSubmit={submitBusca} className="study-search">
          <Icon name="search" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar questões, temas, leis..." aria-label="Buscar questões" />
          <kbd>⌘ K</kbd>
        </form>

        <div className="study-topbar__actions">
          <div className="study-progress-pill" title="Seu progresso geral">
            <span className="study-progress-pill__flame">🔥</span>
            <span className="study-progress-pill__copy"><b>Seu progresso</b><span><i /></span></span>
            <strong>42%</strong>
          </div>
          <button className="study-icon-button" aria-label="Notificações"><Icon name="bell" /><span className="study-notification-dot" /></button>
          <button className="study-icon-button hidden sm:flex" aria-label="Tema"><Icon name="moon" /></button>
          <button className="study-profile" aria-label="Perfil">
            <span className="study-profile__avatar"><Icon name="user" /></span>
            <span className="study-profile__text"><b>{email ? email.split("@")[0] : "Aluno"}</b><small>Estudante</small></span>
          </button>
          <button onClick={sair} className="study-logout">Sair</button>
        </div>
      </header>

      <aside className="study-sidebar" aria-label="Navegação principal">
        <Link href="/" className="study-sidebar__brand" aria-label="FAFIPA Study OS">
          <span className="study-brand__mark"><span>F</span></span>
          <span className="study-brand__copy"><strong>FAFIPA Study OS</strong><small>Contador · Curitiba</small></span>
        </Link>
        <div className="study-sidebar__section">
          <p className="study-sidebar__label">Estudar</p>
          {links.slice(0, 4).map(l => (
            <Link key={l.href} href={l.href} className={`study-side-link ${active(l.href) ? "is-active" : ""}`}>
              <span className="study-side-link__icon"><Icon name={l.icon}/></span>
              <span>{l.label}</span>
              {l.href === "/fila" && <em>Prioridade</em>}
            </Link>
          ))}
        </div>
        <div className="study-sidebar__section">
          <p className="study-sidebar__label">Organizar</p>
          {links.slice(4, 7).map(l => (
            <Link key={l.href} href={l.href} className={`study-side-link ${active(l.href) ? "is-active" : ""}`}>
              <span className="study-side-link__icon"><Icon name={l.icon}/></span><span>{l.label}</span>
            </Link>
          ))}
        </div>
        <div className="study-sidebar__section">
          <p className="study-sidebar__label">Acompanhar</p>
          {links.slice(7).map(l => (
            <Link key={l.href} href={l.href} className={`study-side-link ${active(l.href) ? "is-active" : ""}`}>
              <span className="study-side-link__icon"><Icon name={l.icon}/></span><span>{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="study-sidebar__goal">
          <div className="study-sidebar__goal-icon"><Icon name="target"/></div>
          <p>Disciplina hoje,<br/><b>resultado amanhã.</b></p>
          <div className="study-sidebar__goal-bars"><i/><i/><i/><i/><i/></div>
        </div>
      </aside>
    </div>
  );
}
