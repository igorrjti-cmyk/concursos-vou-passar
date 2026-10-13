"use client";

import { useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { MATERIAS_TRILHA, TRILHA_TEORICA, type ProfundidadeTeoria, type StatusCobertura } from "@/lib/trilhaTeorica";
import { linksDoMaterial } from "@/lib/materiais";
import { linksDasVideoaulas } from "@/lib/videoaulas";

const depthStyle: Record<ProfundidadeTeoria,string> = {A:"border-emerald-400/20 bg-emerald-400/[.08] text-emerald-300",B:"border-blue-400/20 bg-blue-400/[.08] text-blue-300",C:"border-white/10 bg-white/[.04] text-white/40"};
const coverageLabel: Record<StatusCobertura,string> = {fechado:"Mapeado",parcial:"Parcial",pendente:"Pendente"};

function Trilha(){
  const [materia,setMateria]=useState("todas");
  const [nivel,setNivel]=useState<"todos"|ProfundidadeTeoria>("todos");
  const itens=useMemo(()=>TRILHA_TEORICA.filter(e=>(materia==="todas"||e.materia===materia)&&(nivel==="todos"||e.profundidade===nivel)).sort((a,b)=>a.ordem-b.ordem),[materia,nivel]);
  const fechados=TRILHA_TEORICA.filter(e=>e.cobertura==="fechado").length;
  const a=TRILHA_TEORICA.filter(e=>e.profundidade==="A").length;
  const pendentes=TRILHA_TEORICA.filter(e=>e.cobertura!=="fechado").length;
  return <main className="app-shell mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
    <section className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-gradient-to-br from-[#111a2c] via-[#0d1525] to-[#0a101d] p-6 sm:p-8">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/[.07] blur-3xl"/>
      <div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold/70">Trilha teórica · Curitiba 2026</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Do edital para a página certa.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">Recortes já auditados dos seus materiais. A = dominar, B = estudo dirigido, C = consulta. Esta camada é independente das 3.093 questões e não altera suas prioridades.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><Mini n={TRILHA_TEORICA.length} label="etapas mapeadas"/><Mini n={a} label="núcleos A"/><Mini n={pendentes} label="com ressalva/pendência"/></div></div>
    </section>
    <section className="mt-5 flex flex-col gap-3 rounded-[20px] border border-white/[.07] bg-white/[.025] p-4 sm:flex-row sm:items-center">
      <select value={materia} onChange={e=>setMateria(e.target.value)} className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#0c1423] px-3 text-sm text-white/70"><option value="todas">Todas as matérias</option>{MATERIAS_TRILHA.map(m=><option key={m}>{m}</option>)}</select>
      <div className="flex gap-2">{(["todos","A","B","C"] as const).map(n=><button key={n} onClick={()=>setNivel(n)} className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${nivel===n?"border-gold/30 bg-gold/[.1] text-gold":"border-white/[.07] bg-white/[.025] text-white/40"}`}>{n==="todos"?"Todos":`Nível ${n}`}</button>)}</div>
    </section>
    <section className="mt-5 space-y-3">{itens.map((e,i)=><article key={e.id} className="glass rounded-[20px] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] font-serif text-sm text-white/50">{String(i+1).padStart(2,"0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="badge border border-gold/15 bg-gold/[.07] text-gold">Edital {e.edital}</span><span className={`badge border ${depthStyle[e.profundidade]}`}>Teoria {e.profundidade}</span><span className="badge border border-white/10 bg-white/[.03] text-white/45">Questões {e.prioridade}</span><span className={`badge border ${e.cobertura==="fechado"?"border-emerald-400/15 text-emerald-300/70":e.cobertura==="parcial"?"border-amber-300/15 text-amber-200/70":"border-red-300/15 text-red-200/70"}`}>{coverageLabel[e.cobertura]}</span></div><h2 className="mt-3 font-serif text-xl text-white/90">{e.titulo}</h2><p className="mt-1 text-xs text-white/35">{e.materia}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><Info label="Material" value={e.material}/><Info label="Páginas / recorte" value={e.paginas}/></div><MaterialLinks material={e.material}/><VideoLinks material={e.material}/>{e.observacao&&<p className="mt-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2 text-xs leading-5 text-white/38">{e.observacao}</p>}</div></div></article>)}{!itens.length&&<div className="rounded-2xl border border-white/[.07] p-8 text-center text-sm text-white/35">Nenhuma etapa neste filtro.</div>}</section>
    <p className="mt-7 text-center text-[10px] uppercase tracking-[.2em] text-white/20">Trilha v1 · somente conteúdo já mapeado</p>
  </main>;
}
function MaterialLinks({material}:{material:string}){const links=linksDoMaterial(material);if(!links.length)return <div className="mt-3 inline-flex rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2 text-xs font-semibold text-white/25">Material pendente</div>;return <div className="mt-3 flex flex-wrap gap-2">{links.map(link=><a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-gold/20 bg-gold/[.08] px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/[.14]">Abrir {links.length>1?link.nome:"PDF"} ↗</a>)}</div>}
function VideoLinks({material}:{material:string}){const videos=linksDasVideoaulas(material);if(!videos.length)return null;return <div className="mt-3 flex flex-wrap gap-2">{videos.map(video=><a key={video.url} href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-blue-400/20 bg-blue-400/[.08] px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-400/[.14]">▶ Assistir {video.nome} ↗</a>)}</div>}
function Mini({n,label}:{n:number;label:string}){return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><b className="font-serif text-2xl text-white">{n}</b><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/30">{label}</p></div>}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/[.06] bg-[#08101d]/60 px-3 py-2.5"><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-white/25">{label}</p><p className="mt-1 text-sm text-white/65">{value}</p></div>}
export default function Page(){return <AuthGate><Nav/><Trilha/></AuthGate>}
