export type Resolucao = {
  regra?: string;
  passos?: string[];
  calculo?: string;
  correta?: string;
  erradas?: string[];
  fundamento?: string;
  pegadinha?: string;
  cobranca?: string;
};

export type Questao = {
  id: string;
  rank: number;
  prioridade_base: number | null;
  prioridade_faixa: string | null;
  topic: string | null;
  origin: string | null;
  file_source: string | null;
  stem: string;
  options: [string, string][];
  answer: string;
  year: number | null;
  qnum: number | null;
  score: number | null;
  band: string | null;
  resolution: Resolucao | null;
  summary: string | null;
  tec_link: string;
};

export type StatusProgresso =
  | "nao_iniciada"
  | "feita_certo"
  | "feita_errado"
  | "duvida";

export type Progresso = {
  id: string;
  user_id: string;
  questao_id: string;
  status: StatusProgresso;
  tentativas: number;
  acertos: number;
  confianca: number | null;
  observacao: string | null;
  tempo_resolucao_seg: number | null;
  ultima_resolucao: string | null;
  proxima_revisao: string | null;
  updated_at: string;
};
