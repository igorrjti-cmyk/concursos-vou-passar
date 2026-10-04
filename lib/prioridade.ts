import type { Questao, Progresso, StatusProgresso } from "@/lib/types";

export type FilaDinamica = "ataque" | "consolidacao" | "manutencao" | "cobertura";

export const FILA_LABEL: Record<FilaDinamica, string> = {
  ataque: "Fila A · Ataque",
  consolidacao: "Fila B · Consolidação",
  manutencao: "Fila C · Manutenção",
  cobertura: "Fila D · Cobertura",
};

export const FILA_DESC: Record<FilaDinamica, string> = {
  ataque: "Alta importância + baixo domínio",
  consolidacao: "Alta importância + domínio intermediário",
  manutencao: "Alta importância + domínio alto",
  cobertura: "Complemento e expansão da cobertura",
};

type ProgressoFila = Pick<Progresso, "status"> & Partial<Pick<Progresso, "tentativas" | "acertos">>;

export function accuracyOf(p?: ProgressoFila | null) {
  if (!p || !p.tentativas || p.acertos === undefined) return null;
  return (p.acertos / p.tentativas) * 100;
}

function faixaFromQuestao(q: Pick<Questao, "prioridade_faixa" | "prioridade_base">) {
  if (q.prioridade_faixa) return q.prioridade_faixa;
  return prioridadeLabel(q.prioridade_base);
}

function pesoPrioridade(q: Pick<Questao, "prioridade_faixa" | "prioridade_base">) {
  const faixa = faixaFromQuestao(q);
  return ({ "P1+": 100, P1: 85, P2: 65, P3: 45, P4: 10 } as Record<string, number>)[faixa] ?? 0;
}

export function filaDinamica(q: Questao, p?: ProgressoFila | null): FilaDinamica {
  const faixa = faixaFromQuestao(q);
  const acc = accuracyOf(p);
  if (faixa === "P3" || faixa === "P4") return "cobertura";
  if (faixa === "P2" && acc === null) return "cobertura";
  if (acc === null || acc < 70 || p?.status === "feita_errado" || p?.status === "duvida") return "ataque";
  if (acc < 90) return "consolidacao";
  return "manutencao";
}

export function filaSortScore(q: Questao, p?: ProgressoFila | null) {
  const acc = accuracyOf(p);
  const erroBoost = p?.status === "feita_errado" || p?.status === "duvida" ? 1000 : 0;
  const dominioPenalty = acc === null ? 0 : acc < 70 ? 20 : acc < 90 ? 8 : -8;
  return erroBoost + pesoPrioridade(q) + dominioPenalty;
}

export function prioridadeLabel(p?: number | null) {
  if (p === null || p === undefined) return "—";
  // Nova escala: 4=P1+, 3=P1, 2=P2, 1=P3, 0=P4. Mantém compatibilidade com a escala antiga 0–100.
  if (p <= 4) return ({ 4: "P1+", 3: "P1", 2: "P2", 1: "P3", 0: "P4" } as Record<number, string>)[p] ?? "—";
  if (p >= 80) return "P1";
  if (p >= 65) return "P2";
  if (p >= 50) return "P3";
  return "P4";
}

export function prioridadeTexto(p?: number | null) {
  const faixa = prioridadeLabel(p);
  return ({ "P1+": "P1+ · núcleo indispensável", P1: "P1 · alta prioridade", P2: "P2 · complementar", P3: "P3 · baixa prioridade", P4: "P4 · fora do recorte/problema", "—": "Sem classificação" } as Record<string, string>)[faixa];
}

export function statusParaFila(status: StatusProgresso | undefined) {
  if (status === "feita_errado" || status === "duvida") return "Baixo domínio";
  if (status === "feita_certo") return "Resolvida";
  return "Não iniciada";
}
