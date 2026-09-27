"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Gamificacao, InsightsIA } from "@/lib/types";

type LinhaTopico = { topico: string; feitas: number; certas: number };
type DiaEvolucao = { dia: string; total: number };

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-4">
      <p className="text-xs uppercase tracking-wide text-ink-light/50">{label}</p>
      <p className="mt-1 font-serif text-xl text-ink">{value}</p>
    </div>
  );
}

function BarraTopico({ l }: { l: LinhaTopico }) {
  const pct = l.feitas ? Math.round((l.certas / l.feitas) * 100) : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/60 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-ink">{l.topico}</span>
        <span className="shrink-0 text-ink-light/60">
          {l.certas}/{l.feitas} ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
        <div
          className={`h-1.5 rounded-full ${pct >= 70 ? "bg-certo" : pct >= 40 ? "bg-gold" : "bg-errado"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function GraficoDias({ dados, titulo }: { dados: DiaEvolucao[]; titulo: string }) {
  const max = Math.max(1, ...dados.map((d) => d.total));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-4">
      <p className="text-xs uppercase tracking-wide text-ink-light/50">{titulo}</p>
      <div className="mt-3 flex items-end gap-1.5" style={{ height: 72 }}>
        {dados.map((d) => (
          <div key={d.dia} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gold/70"
              style={{ height: `${Math.max(4, (d.total / max) * 60)}px` }}
              title={`${d.dia}: ${d.total}`}
            />
            <span className="text-[9px] text-ink-light/40">{d.dia}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Desempenho() {
  const [linhas, setLinhas] = useState<LinhaTopico[]>([]);
  const [gam, setGam] = useState<Gamificacao | null>(null);
  const [hoje, setHoje] = useState({ feitas: 0, certas: 0, erradas: 0 });
  const [revisoesPendentes, setRevisoesPendentes] = useState(0);
  const [semanal, setSemanal] = useState<DiaEvolucao[]>([]);
  const [mensal, setMensal] = useState<DiaEvolucao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [insights, setInsights] = useState<InsightsIA | null>(null);
  const [gerandoInsights, setGerandoInsights] = useState(false);
  const [erroInsights, setErroInsights] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setCarregando(false);
        return;
      }

      const { data: gamData } = await supabase
        .from("gamificacao")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setGam((gamData as Gamificacao) ?? null);

      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const { data: tentativasHoje } = await supabase
        .from("tentativas")
        .select("acertou")
        .eq("user_id", userId)
        .gte("criado_em", hojeInicio.toISOString());
      const listaHoje = tentativasHoje ?? [];
      setHoje({
        feitas: listaHoje.length,
        certas: listaHoje.filter((t) => t.acertou).length,
        erradas: listaHoje.filter((t) => !t.acertou).length,
      });

      const hojeStr = new Date().toISOString().slice(0, 10);
      const { count: pendentes } = await supabase
        .from("progresso")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("next_review_at", hojeStr);
      setRevisoesPendentes(pendentes ?? 0);

      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 29);
      trintaDiasAtras.setHours(0, 0, 0, 0);
      const { data: tentativas30d } = await supabase
        .from("tentativas")
        .select("criado_em")
        .eq("user_id", userId)
        .gte("criado_em", trintaDiasAtras.toISOString());

      const porDia: Record<string, number> = {};
      (tentativas30d ?? []).forEach((t) => {
        const dia = t.criado_em.slice(0, 10);
        porDia[dia] = (porDia[dia] ?? 0) + 1;
      });

      const dias7: DiaEvolucao[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        dias7.push({ dia: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3), total: porDia[iso] ?? 0 });
      }
      setSemanal(dias7);

      const semanas: DiaEvolucao[] = [];
      for (let i = 3; i >= 0; i--) {
        let total = 0;
        for (let d = 0; d < 7; d++) {
          const data = new Date();
          data.setDate(data.getDate() - i * 7 - d);
          total += porDia[data.toISOString().slice(0, 10)] ?? 0;
        }
        semanas.push({ dia: i === 0 ? "atual" : `-${i}sem`, total });
      }
      setMensal(semanas);

      const { data: progresso } = await supabase
        .from("progresso")
        .select("questao_id,status")
        .eq("user_id", userId)
        .neq("status", "nao_iniciada");

      if (progresso && progresso.length > 0) {
        const ids = progresso.map((p) => p.questao_id);
        const { data: questoes } = await supabase.from("questoes").select("id,topic").in("id", ids);
        const topicoPorId = Object.fromEntries((questoes ?? []).map((q) => [q.id, q.topic ?? "Sem tópico"]));
        const agregada: Record<string, LinhaTopico> = {};
        progresso.forEach((p) => {
          const topico = topicoPorId[p.questao_id] ?? "Sem tópico";
          if (!agregada[topico]) agregada[topico] = { topico, feitas: 0, certas: 0 };
          agregada[topico].feitas += 1;
          if (p.status === "feita_certo") agregada[topico].certas += 1;
        });
        setLinhas(Object.values(agregada).sort((a, b) => b.feitas - a.feitas));
      }

      setCarregando(false);
    })();
  }, []);

  const comVolumeMinimo = linhas.filter((l) => l.feitas >= 3);
  const fortes = [...comVolumeMinimo].sort((a, b) => b.certas / b.feitas - a.certas / a.feitas).slice(0, 3);
  const fracas = [...comVolumeMinimo].sort((a, b) => a.certas / a.feitas - b.certas / b.feitas).slice(0, 3);

  async function gerarInsights() {
    setGerandoInsights(true);
    setErroInsights(null);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch("/api/insights", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Falha ao gerar insights.");
      setInsights(json.insights as InsightsIA);
    } catch (e) {
      setErroInsights((e as Error).message);
    } finally {
      setGerandoInsights(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Desempenho</h1>
      <p className="mt-1 text-ink-light/70">Onde focar antes da prova de 06/12.</p>

      {carregando ? (
        <p className="mt-6 text-ink-light/60">Carregando…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Hoje: respondidas" value={String(hoje.feitas)} />
            <StatCard label="Hoje: acertos" value={String(hoje.certas)} />
            <StatCard label="Hoje: erros" value={String(hoje.erradas)} />
            <StatCard label="Revisões pendentes" value={String(revisoesPendentes)} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <StatCard label="XP" value={String(gam?.xp ?? 0)} />
            <StatCard label="Nível" value={String(gam?.nivel ?? 1)} />
            <StatCard label="🔥 Streak" value={String(gam?.streak_atual ?? 0)} />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <GraficoDias dados={semanal} titulo="Últimos 7 dias" />
            <GraficoDias dados={mensal} titulo="Últimas 4 semanas" />
          </div>

          {comVolumeMinimo.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-lg text-ink">Disciplinas mais fortes</h2>
                <div className="mt-3 space-y-2">
                  {fortes.map((l) => (
                    <BarraTopico key={l.topico} l={l} />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-serif text-lg text-ink">Disciplinas mais fracas</h2>
                <div className="mt-3 space-y-2">
                  {fracas.map((l) => (
                    <BarraTopico key={l.topico} l={l} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-serif text-lg text-ink">Todos os assuntos</h2>
            <div className="mt-3 space-y-2">
              {linhas.length === 0 ? (
                <p className="text-ink-light/60">Responda algumas questões para ver seu desempenho aqui.</p>
              ) : (
                linhas.map((l) => <BarraTopico key={l.topico} l={l} />)
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg text-ink">Insights inteligentes</h2>
              <button
                onClick={gerarInsights}
                disabled={gerandoInsights}
                className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-ink-light disabled:opacity-40"
              >
                {gerandoInsights ? "Analisando…" : "Gerar com IA"}
              </button>
            </div>
            {erroInsights && <p className="mt-2 text-sm text-errado">{erroInsights}</p>}
            {insights && (
              <div className="mt-4 space-y-4 text-sm text-ink">
                {insights.pontos_fortes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-light/50">Pontos fortes</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {insights.pontos_fortes.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.pontos_fracos.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-light/50">Pontos fracos</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {insights.pontos_fracos.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.observacoes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-light/50">Observações</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {insights.observacoes.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Desempenho />
    </AuthGate>
  );
}
