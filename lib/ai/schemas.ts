export const explicacaoSchema = {
  type: "object",
  properties: {
    explicacao_simplificada: {
      type: "string",
      description: "Explicação em linguagem simples do porquê a alternativa correta está certa, em 2-4 frases.",
    },
    pegadinha: {
      type: "string",
      description: "A principal armadilha que a banca colocou nesta questão, em 1-2 frases. Se não houver, string vazia.",
    },
    macete: {
      type: "string",
      description: "Um macete ou forma de memorizar/reconhecer esse tipo de questão no futuro, em 1-2 frases.",
    },
  },
  required: ["explicacao_simplificada", "pegadinha", "macete"],
};

export const insightsSchema = {
  type: "object",
  properties: {
    pontos_fortes: {
      type: "array",
      items: { type: "string" },
      description: "2-3 frases curtas destacando os melhores desempenhos do aluno por disciplina/assunto, com percentual quando fizer sentido.",
    },
    pontos_fracos: {
      type: "array",
      items: { type: "string" },
      description: "2-3 frases curtas destacando os piores desempenhos do aluno por disciplina/assunto, com percentual quando fizer sentido.",
    },
    observacoes: {
      type: "array",
      items: { type: "string" },
      description: "1-2 observações gerais/recomendações práticas de estudo para os próximos dias.",
    },
  },
  required: ["pontos_fortes", "pontos_fracos", "observacoes"],
};
