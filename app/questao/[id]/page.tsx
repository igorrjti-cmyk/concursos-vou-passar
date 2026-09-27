"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Progresso, Questao, ExplicacaoIA } from "@/lib/types";
import { filaDinamica, FILA_LABEL, prioridadeLabel, filaSortScore } from "@/lib/prioridade";
import { chaveFila, filaQuery, filtrosDaUrl, type FilaFiltros } from "@/lib/filaSessao";

const REVISOES = [
  { label: "1 dia", dias: 1 },
  { label: "3 dias", dias: 3 },
  { label: "7 dias", dias: 7 },
  { label: "14 dias", dias: 14 },
];

const DIFICULDADES: { valor: "dificil" | "medio" | "facil"; label: string }[] = [
  { valor: "dificil", label: "Acertei com dificuldade" },
  { valor: "medio", label: "Acertei normal" },
  { valor: "facil", label: "Acertei fácil" },
];

function isoDaqui(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

type ResultadoGamificacao = {
  xp_ganho: number;
  xp_total: number;
  nivel: number;
  streak_atual: number;
  conquistas_novas: string[];
};

const NOME_CONQUISTA: Record<string, string> = {
  streak_7: "🔥 7 dias seguidos",
  streak_30: "🏅 30 dias seguidos",
  streak_100: "👑 100 dias seguidos",
};

function QuestaoDetalhe({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const filtrosContexto: FilaFiltros = filtrosDaUrl(searchParams);
  const temContexto = ["materia", "fila", "status", "busca"].some((key) => searchParams.has(key));
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [aguardandoDificuldade, setAguardandoDificuldade] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [inicio] = useState(() => Date.now());
  const [proxima, setProxima] = useState<Questao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [resultadoGam, setResultadoGam] = useState<ResultadoGamificacao | null>(null);
  const [explicacao, setExplicacao] = useState<ExplicacaoIA | null>(null);
  const [gerandoExplicacao, setGerandoExplicacao] = useState(false);
  const [erroExplicacao, setErroExplicacao] = useState<string | null>(null);

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

        const { data: fav } = await supabase
          .from("favoritos")
          .select("questao_id")
          .eq("user_id", userId)
          .eq("questao_id", id)
          .maybeSingle();
        setFavorito(!!fav);
      }

      if (q) {
        const { data: allQuestions } = await supabase
          .from("questoes")
          .select("*")
          .order("rank", { ascending: true });
        const { data: allProgress } = userId
          ? await supabase.from("progresso").select("*").eq("user_id", userId)
          : { data: [] as Progresso[] };
        const progressMap = Object.fromEntries((allProgress ?? []).map((p: Progresso) => [p.questao_id, p]));

        if (temContexto) {
          let candidatos = (allQuestions ?? []).filter((x: Questao) => {
            if (filtrosContexto.materia !== "todas" && !(x.topic ?? "").startsWith(`${filtrosContexto.materia} - `)) return false;
            if (filtrosContexto.busca) {
              const termo = filtrosContexto.busca.toLowerCase();
              if (!`${x.topic ?? ""} ${x.stem ?? ""} ${x.rank}`.toLowerCase().includes(termo)) return false;
            }
            if (filtrosContexto.status !== "todas" && (progressMap[x.id]?.status ?? "nao_iniciada") !== filtrosContexto.status) return false;
            if (filtrosContexto.fila !== "todas" && filaDinamica(x, progressMap[x.id]) !== filtrosContexto.fila) return false;
            return true;
          });
          candidatos = candidatos.filter((x) => x.id !== q.id && x.rank > q.rank);
          candidatos.sort((a, b) => a.rank - b.rank);
          setProxima(candidatos[0] ?? null);
        } else {
          const candidatos = (allQuestions ?? []).filter((x: Questao) => x.id !== q.id);
          candidatos.sort((a: Questao, b: Questao) => filaSortScore(b, progressMap[b.id]) - filaSortScore(a, progressMap[a.id]) || a.rank - b.rank);
          setProxima(candidatos[0] ?? null);
        }
      }
    })();
  }, [id]);

  async function gravar(dificuldade: "dificil" | "medio" | "facil" | null, acertou: boolean) {
    if (!questao || !selecionada) return;
    setSalvando(true);
    const tempo = Math.round((Date.now() - inicio) / 1000);
    const supabase = getSupabaseClient();
    const { data } = await supabase.rpc("registrar_tentativa_v2", {
      p_questao_id: questao.id,
      p_alternativa: selecionada,
      p_acertou: acertou,
      p_tempo_seg: tempo,
      p_dificuldade: dificuldade,
      p_confianca: null,
      p_observacao: null,
    });
    if (data) setResultadoGam(data as ResultadoGamificacao);

    // A posição é gravada somente depois de uma resposta registrada.
    // Assim, se o usuário fechar a tela antes de responder, ele retoma a mesma questão.
    if (temContexto && userId) {
      await supabase.from("sessoes_fila").upsert({
        user_id: userId,
        filtro_chave: chaveFila(filtrosContexto),
        filtros: filtrosContexto,
        ultimo_rank: questao.rank,
        ultima_questao_id: questao.id,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "user_id,filtro_chave" });
    }

    setAguardandoDificuldade(false);
    setRespondida(true);
    setSalvando(false);
  }

  async function responder() {
    if (!questao || !selecionada) return;
    const acertou = selecionada === questao.answer;
    if (acertou) {
      setAguardandoDificuldade(true);
    } else {
      await gravar(null, false);
    }
  }

  async function toggleFavorito() {
    if (!questao) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    if (favorito) {
      await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", userId)
        .eq("questao_id", questao.id);
      setFavorito(false);
    } else {
      await supabase
        .from("favoritos")
        .upsert({ user_id: userId, questao_id: questao.id }, { onConflict: "user_id,questao_id" });
      setFavorito(true);
    }
  }

  async function gerarExplicacaoIA() {
    if (!questao) return;
    setGerandoExplicacao(true);
    setErroExplicacao(null);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch("/api/explicar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questaoId: questao.id }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Falha ao gerar explicação.");
      setExplicacao(json.explicacao as ExplicacaoIA);
    } catch (e) {
      setErroExplicacao((e as Error).message);
    } finally {
      setGerandoExplicacao(false);
    }
  }

  async function marcarRevisao(dias: number) {
    if (!questao) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from("progresso")
      .update({ proxima_revisao: isoDaqui(dias), next_review_at: isoDaqui(dias) })
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-ink text-paper">Rank #{questao.rank}</span>
          <span className="badge border border-gold/20 bg-gold/10 text-gold">
            {prioridadeLabel(questao.prioridade_base)} · {questao.prioridade_base ?? "—"}/100
          </span>
          <span className="badge border border-ink/10 bg-white/60 text-ink-light">
            {FILA_LABEL[filaDinamica(questao, progresso ?? undefined)]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorito}
            aria-label={favorito ? "Remover dos favoritos" : "Favoritar questão"}
            className={`text-lg transition ${favorito ? "text-gold" : "text-ink-light/40 hover:text-gold"}`}
          >
            {favorito ? "★" : "☆"}
          </button>
          <a
            href={questao.tec_link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ink-light/60 underline hover:text-gold"
          >
            Abrir no TEC ↗
          </a>
        </div>
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-ink-light/50">
        {questao.topic}
      </p>
      {temContexto && (
        <p className="mt-2 text-[10px] uppercase tracking-[.16em] text-blue-300/60">
          Sequência por rank · filtros preservados nesta sessão
        </p>
      )}
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
              disabled={respondida || aguardandoDificuldade}
              onClick={() => setSelecionada(letra)}
              className={`question-option w-full rounded-2xl border px-4 py-4 text-left text-[0.93rem] leading-6 transition duration-150 ${estilo}`}
            >
              <span className="mr-2 font-medium">{letra})</span>
              {texto}
            </button>
          );
        })}
      </div>

      {aguardandoDificuldade ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-light/50">
            Você acertou — como foi?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DIFICULDADES.map((d) => (
              <button
                key={d.valor}
                disabled={salvando}
                onClick={() => gravar(d.valor, true)}
                className="rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-sm text-ink transition hover:border-gold disabled:opacity-40"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      ) : !respondida ? (
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

          {resultadoGam && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-ink">
              {resultadoGam.xp_ganho > 0 && (
                <span className="font-medium text-gold">+{resultadoGam.xp_ganho} XP</span>
              )}
              <span className="text-ink-light/70">Nível {resultadoGam.nivel}</span>
              <span className="text-ink-light/70">🔥 {resultadoGam.streak_atual} dia(s) seguidos</span>
              {resultadoGam.conquistas_novas?.map((c) => (
                <span key={c} className="badge bg-gold text-[#171107]">
                  {NOME_CONQUISTA[c] ?? c}
                </span>
              ))}
            </div>
          )}

          {questao.resolution ? (
            <Resolucao resolution={questao.resolution} />
          ) : (
            <p className="rounded-md border border-ink/10 bg-white/50 p-4 text-sm text-ink-light/70">
              Resolução individual ainda não gravada para esta questão (fica
              marcada para a próxima rodada).
            </p>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg text-ink">Explicação simplificada (IA)</h2>
              {!explicacao && (
                <button
                  onClick={gerarExplicacaoIA}
                  disabled={gerandoExplicacao}
                  className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-ink-light disabled:opacity-40"
                >
                  {gerandoExplicacao ? "Gerando…" : "Gerar com IA"}
                </button>
              )}
            </div>
            {erroExplicacao && (
              <p className="mt-2 text-sm text-errado">{erroExplicacao}</p>
            )}
            {explicacao && (
              <div className="mt-3 space-y-3 text-sm text-ink">
                <Bloco titulo="Em outras palavras">
                  {explicacao.explicacao_simplificada ?? ""}
                </Bloco>
                {explicacao.pegadinha && (
                  <div className="rounded-md bg-gold/10 p-3">
                    <span className="font-medium">⚠️ Pegadinha: </span>
                    {explicacao.pegadinha}
                  </div>
                )}
                {explicacao.macete && (
                  <Bloco titulo="Macete">{explicacao.macete}</Bloco>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink-light/50">
              Revisão espaçada
            </p>
            <p className="mt-1 text-xs text-ink-light/60">
              Agendada automaticamente pelo sistema. Prefere outra data?
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
                href={`/questao/${proxima.id}${temContexto ? filaQuery(filtrosContexto, "retomar") : ""}`}
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
