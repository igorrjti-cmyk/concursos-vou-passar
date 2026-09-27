import type { Questao } from "@/lib/types";

export function promptExplicacao(questao: Questao) {
  const alternativas = questao.options
    .map(([letra, texto]) => `${letra}) ${texto}`)
    .join("\n");

  const resolucaoOficial = questao.resolution
    ? JSON.stringify(questao.resolution, null, 2)
    : "Nenhuma resolução oficial cadastrada para esta questão.";

  return `Você é um professor de cursinho para concursos públicos brasileiros, especialista em Contabilidade, explicando uma questão para um aluno que já viu o gabarito e a resolução oficial, mas quer uma explicação mais simples e direta.

ENUNCIADO:
${questao.stem}

ALTERNATIVAS:
${alternativas}

GABARITO: ${questao.answer}

RESOLUÇÃO OFICIAL (referência, já disponível para o aluno):
${resolucaoOficial}

Com base nisso, gere:
1. Uma explicação simplificada (linguagem direta, sem jargão desnecessário) de por que a alternativa correta está certa.
2. A principal pegadinha que a banca usou nessa questão (se houver).
3. Um macete prático para reconhecer/resolver esse tipo de questão mais rápido numa próxima prova.

Responda em português do Brasil.`;
}

export function promptInsights(params: {
  porTopico: { topico: string; feitas: number; certas: number }[];
}) {
  const linhas = params.porTopico
    .map((t) => {
      const pct = t.feitas ? Math.round((t.certas / t.feitas) * 100) : 0;
      return `- ${t.topico}: ${t.certas}/${t.feitas} (${pct}%)`;
    })
    .join("\n");

  return `Você é um mentor de estudos para o concurso de Contador da Prefeitura de Curitiba (banca FAFIPA). Aqui está o desempenho do aluno por assunto até agora:

${linhas}

Gere insights curtos e acionáveis sobre esse desempenho: pontos fortes, pontos fracos (assuntos que precisam de mais atenção) e observações práticas para os próximos dias de estudo. Seja específico, citando os nomes dos assuntos e percentuais quando relevante. Responda em português do Brasil.`;
}
