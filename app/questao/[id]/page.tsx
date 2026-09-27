"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao } from "@/lib/types";
import { filaDinamica, FILA_LABEL, prioridadeLabel, prioridadeTexto, filaSortScore } from "@/lib/prioridade";

const REVISOES = [
  { label: "1 dia", dias: 1 },
  { label: "3 dias", dias: 3 },
  { label: "7 dias", dias: 7 },
  { label: "14 dias", dias: 14 },
];

function isoDaqui(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function QuestaoDetalhe({ id }: { id: string }) {
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [inicio] = useState(() => Date.now());
  const [proxima, setProxima] = useState<Questao | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: q } = await supabase
        .from("questoes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setQuestao(q ?? null);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const { data: p } = await supabase
          .from("progresso")
          .select("*")
          .eq("user_id", userId)
          .eq("questao_id", id)
          .maybeSingle();
        setProgresso(p ?? null);
        setObservacao(p?.observacao ?? "");
        if (p && p.status !== "nao_iniciada") setRespondida(true);
      }

      if (q) {
        const { data: allQuestions } = await supabase
          .from("questoes")
          .select("*")
          .order("prioridade_base", { ascending: false, nullsFirst: false })
          .order("rank", { ascending: true });
        const { data: allProgress } = userId
          ? await supabase.from("progresso").select("*").eq("user_id", userId)
          : { data: [] as Progresso[] };
        const progressMap = Object.fromEntries((allProgress ?? []).map((p: Progresso) => [p.questao_id, p]));
        const candidatos = (allQuestions ?? []).filter((x: Questao) => x.id !== q.id);
        candidatos.sort((a: Questao, b: Questao) => filaSortScore(b, progressMap[b.id]) - filaSortScore(a, progressMap[a.id]) || a.rank - b.rank);
        setProxima(candidatos[0] ?? null);
      }
    })();
  }, [id]);

  async function responder() {
    if (!questao || !selecionada) return;
    setSalvando(true);
    const acertou = selecionada === questao.answer;
    const tempo = Math.round((Date.now() - inicio) / 1000);
    const supabase = getSupabaseClient();
    await supabase.rpc("registrar_tentativa", {
      p_questao_id: questao.id,
      p_alternativa: selecionada,
      p_acertou: acertou,
      p_tempo_seg: tempo,
      p_confianca: null,
      p_observacao: null,
      p_proxima_revisao: null,
    });
    setRespondida(true);
    setSalvando(false);
  }

  async function marcarRevisao(dias: number) {
    if (!questao) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from("progresso")
      .update({ proxima_revisao: isoDaqui(dias) })
      .eq("user_id", userId)
      .eq("questao_id", questao.id);
  }

  async function marcarDuvida() {
    if (!questao) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from("progresso")
      .upsert(
        { user_id: userId, questao_id: questao.id, status: "duvida" },
        { onConflict: "user_id,questao_id" }
      );
  }

  async function salvarObservacao() {
    if (!questao) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from("progresso")
      .upsert(
        { user_id: userId, questao_id: questao.id, observacao },
        { onConflict: "user_id,questao_id" }
      );
  }

  if (!questao) {
    return <p className="px-4 py-8 sm:px-6 sm:py-10 text-ink-light/60">Carregando questão…</p>;
  }

  const acertou = selecionada === questao.answer;

  return (
    <main className="study-question-shell mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:py-10 md:pb-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2"><span className="badge bg-ink text-paper">Rank #{questao.rank}</span><span className="badge border border-gold/20 bg-gold/10 text-gold">{prioridadeLabel(questao.prioridade_base)} · {questao.prioridade_base ?? "—"}/100</span><span className="badge border border-ink/10 bg-white/60 text-ink-light">{FILA_LABEL[filaDinamica(questao, progresso ?? undefined)]}</span></div>
        <a
          href={questao.tec_link}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-light/60 underline hover:text-gold"
        >
          Abrir no TEC ↗
        </a>
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-ink-light/50">
        {questao.topic}
      </p>
      <p className="mt-3 whitespace-pre-line font-serif text-[1.05rem] leading-8 text-ink sm:text-lg">
        {questao.stem}
      </p>

      <div className="mt-6 space-y-2">
        {questao.options.map(([letra, texto]) => {
          const escolhida = selecionada === letra;
          const mostrarResultado = respondida;
          let estilo = "border-ink/15 bg-white/60 hover:border-gold";
          if (mostrarResultado && letra === questao.answer) {
            estilo = "border-certo bg-certo/10";
          } else if (mostrarResultado && escolhida && letra !== questao.answer) {
            estilo = "border-errado bg-errado/10";
          } else if (escolhida) {
            estilo = "border-gold bg-gold/10";
          }
          return (
            <button
              key={letra}
              disabled={respondida}
              onClick={() => setSelecionada(letra)}
              className={`question-option w-full rounded-2xl border px-4 py-4 text-left text-[0.93rem] leading-6 transition duration-150 ${estilo}`}
            >
              <span className="mr-2 font-medium">{letra})</span>
              {texto}
            </button>
          );
        })}
      </div>

      {!respondida ? (
        <button
          disabled={!selecionada || salvando}
          onClick={responder}
          className="mobile-action mt-6 min-h-12 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-[#171107] shadow-lg shadow-gold/10 transition hover:bg-gold-light disabled:opacity-40"
        >
          {salvando ? "Registrando…" : "Responder"}
        </button>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="study-result-banner">
            <span className="study-result-dot" />
            <div><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Resultado</span><span className="text-sm font-semibold text-white">{acertou ? "Resposta correta" : "Resposta incorreta"}</span></div>
          </div>
          <p
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              acertou ? "bg-certo/10 text-certo" : "bg-errado/10 text-errado"
            }`}
          >
            {acertou
              ? "Você acertou."
              : `Você errou. Gabarito: ${questao.answer}.`}
          </p>

          {questao.resolution ? (
            <Resolucao resolution={questao.resolution} />
          ) : (
            <p className="rounded-md border border-ink/10 bg-white/50 p-4 text-sm text-ink-light/70">
              Resolução individual ainda não gravada para esta questão (fica
              marcada para a próxima rodada).
            </p>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-ink-light/50">
              Revisão espaçada
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REVISOES.map((r) => (
                <button
                  key={r.dias}
                  onClick={() => marcarRevisao(r.dias)}
                  className="rounded-full border border-ink/15 bg-white/60 px-3 py-1 text-xs text-ink transition hover:border-gold"
                >
                  Revisar em {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink-light/50">
              Observação pessoal
            </p>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              onBlur={salvarObservacao}
              rows={2}
              placeholder="Ex.: revisar regra de restos a pagar antes da prova"
              className="mt-2 w-full rounded-md border border-ink/15 bg-white/60 p-3 text-sm outline-none focus:border-gold"
            />
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 pt-6">
            <button
              onClick={marcarDuvida}
              className="text-sm text-gold hover:underline"
            >
              Marcar como dúvida
            </button>
            {proxima ? (
              <Link
                href={`/questao/${proxima.id}`}
                className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-light"
              >
                Próxima da fila →
              </Link>
            ) : (
              <Link href="/" className="text-sm text-ink-light/60 hover:text-ink">
                Fim da fila — voltar ao painel
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Resolucao({ resolution }: { resolution: NonNullable<Questao["resolution"]> }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-[0_18px_45px_rgba(0,0,0,.18)]">
      <h2 className="font-serif text-lg text-ink">Resolução</h2>

      {resolution.regra && (
        <Bloco titulo="Regra / conceito">{resolution.regra}</Bloco>
      )}

      {resolution.passos && resolution.passos.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-light/50">
            Raciocínio passo a passo
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
            {resolution.passos.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      {resolution.calculo && resolution.calculo !== "Não há cálculo." && (
        <Bloco titulo="Cálculo">{resolution.calculo}</Bloco>
      )}

      {resolution.correta && (
        <Bloco titulo="Por que a alternativa correta está correta">
          {resolution.correta}
        </Bloco>
      )}

      {resolution.erradas && resolution.erradas.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-light/50">
            Alternativas incorretas
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {resolution.erradas.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {resolution.fundamento && (
        <Bloco titulo="Fundamento legal / normativo">
          {resolution.fundamento}
        </Bloco>
      )}

      {resolution.pegadinha && (
        <div className="rounded-md bg-gold/10 p-3 text-sm text-ink">
          <span className="font-medium">⚠️ Pegadinha FAFIPA: </span>
          {resolution.pegadinha}
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-light/50">{titulo}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AuthGate>
      <Nav />
      <QuestaoDetalhe id={params.id} />
    </AuthGate>
  );
}
