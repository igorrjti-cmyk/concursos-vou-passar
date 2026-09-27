"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/fila", label: "Fila", icon: "list" },
  { href: "/revisao", label: "Revisão", icon: "clock" },
  { href: "/erros", label: "Erros", icon: "alert" },
  { href: "/desempenho", label: "Desempenho", icon: "chart" },
];

function Icon({ name }: { name: string }) {
  const p: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="M12 4l9 16H3L12 4Z"/><path d="M12 9v5M12 17h.01"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
}

export default function MobileStudyBar() {
  const pathname = usePathname();
  return (
    <nav className="mobile-study-bar" aria-label="Navegação principal mobile">
      <div className="mobile-study-bar__inner">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`mobile-study-item ${active ? "is-active" : ""}`}>
              <span className="mobile-study-item__icon"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
