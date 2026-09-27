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

export function accuracyOf(p?: Pick<Progresso, "tentativas" | "acertos" | "status"> | null) {
  if (!p || !p.tentativas) return null;
  return (p.acertos / p.tentativas) * 100;
}

export function filaDinamica(q: Questao, p?: Pick<Progresso, "tentativas" | "acertos" | "status"> | null): FilaDinamica {
  const base = q.prioridade_base ?? 0;
  const acc = accuracyOf(p);

  // P0 continua reservado às lacunas do edital que ainda precisam ser criadas.
  // Para uma questão existente, a fila é decidida por importância + domínio.
  if (base < 65) return "cobertura";
  if (acc === null || acc < 70 || p?.status === "feita_errado" || p?.status === "duvida") return "ataque";
  if (acc < 90) return "consolidacao";
  return "manutencao";
}

export function filaSortScore(q: Questao, p?: Pick<Progresso, "tentativas" | "acertos" | "status"> | null) {
  const base = q.prioridade_base ?? 0;
  const acc = accuracyOf(p);
  const dominioPenalty = acc === null ? 0 : acc < 70 ? 20 : acc < 90 ? 8 : -8;
  const erroPenalty = p?.status === "feita_errado" || p?.status === "duvida" ? 12 : 0;
  return base + dominioPenalty + erroPenalty;
}

export function prioridadeLabel(p?: number | null) {
  if (p === null || p === undefined) return "—";
  if (p >= 80) return "P1";
  if (p >= 65) return "P2";
  if (p >= 50) return "P3";
  return "P4";
}

export function prioridadeTexto(p?: number | null) {
  if (p === null || p === undefined) return "Sem classificação";
  if (p >= 80) return "P1 · núcleo prioritário";
  if (p >= 65) return "P2 · núcleo importante";
  if (p >= 50) return "P3 · complementar";
  return "P4 · manutenção/expansão";
}

export function statusParaFila(status: StatusProgresso | undefined) {
  if (status === "feita_errado" || status === "duvida") return "Baixo domínio";
  if (status === "feita_certo") return "Resolvida";
  return "Não iniciada";
}
