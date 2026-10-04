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
  banca?: string | null;
  is_fafipa?: boolean;
  prioridade_fafipa?: number;
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

export type ReviewStage =
  | "novo"
  | "erro"
  | "acertou"
  | "dificil"
  | "facil"
  | "dominado";

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
  review_stage: ReviewStage;
  next_review_at: string | null;
  mastery_level: number;
  success_count: number;
  error_count: number;
  last_seen_at: string | null;
  updated_at: string;
};

export type Gamificacao = {
  user_id: string;
  xp: number;
  nivel: number;
  streak_atual: number;
  streak_recorde: number;
  ultima_atividade: string | null;
  ultimo_bonus_meta: string | null;
  updated_at: string;
};

export type MetasConfig = {
  user_id: string;
  questoes_dia: number;
  revisoes_dia: number;
  minutos_dia: number;
  updated_at: string;
};

export type Conquista = {
  id: string;
  user_id: string;
  codigo: "streak_7" | "streak_30" | "streak_100";
  conquistada_em: string;
};

export type Favorito = {
  user_id: string;
  questao_id: string;
  criado_em: string;
};

export type Simulado = {
  id: string;
  user_id: string;
  topico: string | null;
  quantidade: number;
  tempo_gasto_seg: number | null;
  acertos: number;
  total: number;
  status: "em_andamento" | "concluido";
  criado_em: string;
  finalizado_em: string | null;
};

export type SimuladoItem = {
  id: string;
  simulado_id: string;
  questao_id: string;
  ordem: number;
  alternativa_marcada: string | null;
  acertou: boolean | null;
};

export type ExplicacaoIA = {
  questao_id: string;
  explicacao_simplificada: string | null;
  pegadinha: string | null;
  macete: string | null;
  gerado_em: string;
};

export type InsightsIA = {
  pontos_fortes: string[];
  pontos_fracos: string[];
  observacoes: string[];
};
