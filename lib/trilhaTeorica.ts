export type ProfundidadeTeoria = "A" | "B" | "C";
export type PrioridadeQuestoes = "P1+" | "P1" | "P2" | "P3" | "—";
export type StatusCobertura = "fechado" | "parcial" | "pendente";

export type EtapaTeorica = {
  id: string;
  ordem: number;
  materia: string;
  edital: string;
  titulo: string;
  material: string;
  paginas: string;
  profundidade: ProfundidadeTeoria;
  prioridade: PrioridadeQuestoes;
  cobertura: StatusCobertura;
  observacao?: string;
};

// Trilha estática v1: somente recortes já auditados. Não altera banco de questões/Supabase.
export const TRILHA_TEORICA: EtapaTeorica[] = [
  {id:"cg-01",ordem:1,materia:"Contabilidade Geral",edital:"2.4.2",titulo:"Conceito, objeto, finalidade e usuários",material:"CGAJ 00",paginas:"8–31",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-02",ordem:2,materia:"Contabilidade Geral",edital:"2.4.4–2.4.5",titulo:"Equação e estrutura patrimonial",material:"CGAJ 01",paginas:"3–24",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-03",ordem:3,materia:"Contabilidade Geral",edital:"2.4.5–2.4.6",titulo:"Patrimônio e fatos contábeis — reforço",material:"CGAJ 01 Parte 2",paginas:"3–26",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-04",ordem:4,materia:"Contabilidade Geral",edital:"2.4.6–2.4.7, 2.4.13",titulo:"Escrituração, lançamentos e plano de contas",material:"CGAJ 02",paginas:"3–45",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-05",ordem:5,materia:"Contabilidade Geral",edital:"2.4.7, 2.4.12",titulo:"Livros e balancete",material:"CGAJ 02 Parte 2",paginas:"3–16",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-06",ordem:6,materia:"Contabilidade Geral",edital:"2.4.10–2.4.11",titulo:"Receitas, despesas, resultado e regimes",material:"CGAJ 03",paginas:"3–61",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-07",ordem:7,materia:"Contabilidade Geral",edital:"2.4.1, 2.4.3, 2.4.5, 2.4.9",titulo:"Estrutura Conceitual — CPC 00 (R2)",material:"CGAJ 18",paginas:"3–64",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-08",ordem:8,materia:"Contabilidade Geral",edital:"2.4.8, 2.4.22",titulo:"Mercadorias, tributos e estoques",material:"CGAJ 05",paginas:"3–56",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.57–60 apenas complementar."},
  {id:"cg-09",ordem:9,materia:"Contabilidade Geral",edital:"2.4.22",titulo:"Métodos de avaliação de estoques",material:"CGAG 13",paginas:"2–10",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-10",ordem:10,materia:"Contabilidade Geral",edital:"2.4.8",titulo:"Tributos nas compras e vendas",material:"CGAG 13 Parte 2",paginas:"3–17",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-11",ordem:11,materia:"Contabilidade Geral",edital:"2.4.27",titulo:"Imobilizado, depreciação e exaustão",material:"CGAJ 06",paginas:"3–52",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-12",ordem:12,materia:"Contabilidade Geral",edital:"2.4.27",titulo:"Intangível e amortização",material:"CGAJ 08",paginas:"3–48",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-13",ordem:13,materia:"Contabilidade Geral",edital:"2.4.28",titulo:"Redução ao valor recuperável",material:"CGAJ 07",paginas:"3–34",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-14",ordem:14,materia:"Contabilidade Geral",edital:"2.4.16",titulo:"Patrimônio Líquido I",material:"CGAJ 12",paginas:"3–28",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-15",ordem:15,materia:"Contabilidade Geral",edital:"2.4.16",titulo:"Patrimônio Líquido II",material:"CGAJ 13",paginas:"3–42",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-16",ordem:16,materia:"Contabilidade Geral",edital:"2.4.10, 2.4.14",titulo:"Demonstração do Resultado",material:"CGAJ 14",paginas:"3–57",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-17",ordem:17,materia:"Contabilidade Geral",edital:"2.4.14",titulo:"DLPA, DMPL e DRA",material:"CGAJ 15",paginas:"3–36",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-18",ordem:18,materia:"Contabilidade Geral",edital:"2.4.14",titulo:"DFC",material:"CGAJ 16",paginas:"3–41",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-19",ordem:19,materia:"Contabilidade Geral",edital:"2.4.14",titulo:"DVA",material:"CGAJ 17",paginas:"3–26",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-20",ordem:20,materia:"Contabilidade Geral",edital:"2.4.3, 2.4.14–2.4.15",titulo:"Apresentação das demonstrações e Lei 6.404",material:"CGAJ 19",paginas:"3–60",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-21",ordem:21,materia:"Contabilidade Geral",edital:"2.4.15",titulo:"Lei 6.404 — consolidação",material:"CGAG 16",paginas:"seletivo",profundidade:"B",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-22",ordem:22,materia:"Contabilidade Geral",edital:"2.4.9",titulo:"Ajuste a Valor Presente",material:"CGAG 24",paginas:"2–21",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-23",ordem:23,materia:"Contabilidade Geral",edital:"2.4.9",titulo:"Valor justo",material:"CGAG 28",paginas:"3–10",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cg-24",ordem:24,materia:"Contabilidade Geral",edital:"2.4.17–2.4.21",titulo:"Análise econômico-financeira",material:"CGAG 32",paginas:"2–21 + 67–69",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cg-25",ordem:25,materia:"Contabilidade Geral",edital:"2.4.26",titulo:"SPED — base normativa",material:"Decreto 6.022/2007",paginas:"1–2",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},

  {id:"cust-00",ordem:30,materia:"Contabilidade de Custos",edital:"2.4.23",titulo:"Terminologia e classificação de custos",material:"CUST 00",paginas:"6–28",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cust-02",ordem:31,materia:"Contabilidade de Custos",edital:"2.4.23–2.4.24",titulo:"CPP, CPA e CPV",material:"CUST 02",paginas:"3–18",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cust-03a",ordem:32,materia:"Contabilidade de Custos",edital:"2.4.23–2.4.25",titulo:"Custos — núcleo aplicado",material:"CUST 03",paginas:"3–6 + 27–37",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.7–26 e 38–40 ficam em B."},
  {id:"cust-01",ordem:33,materia:"Contabilidade de Custos",edital:"2.4.24",titulo:"Métodos de custeio",material:"CUST 01",paginas:"3–11",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cust-04",ordem:34,materia:"Contabilidade de Custos",edital:"2.4.24–2.4.25",titulo:"Custeio — reforço",material:"CUST 04",paginas:"3–10",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"cust-06",ordem:35,materia:"Contabilidade de Custos",edital:"2.4.25",titulo:"Custos para controle e decisão",material:"CUST 06",paginas:"3–33",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cust-07",ordem:36,materia:"Contabilidade de Custos",edital:"2.4.24–2.4.25",titulo:"Aplicações e decisões",material:"CUST 07",paginas:"3–19",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.20–36 em B/A-B conforme trecho."},
  {id:"cust-05",ordem:37,materia:"Contabilidade de Custos",edital:"2.4.23–2.4.25",titulo:"Complemento avançado",material:"CUST 05",paginas:"consulta",profundidade:"C",prioridade:"P3",cobertura:"fechado"},

  {id:"cas-00",ordem:40,materia:"Contabilidade Pública / AFO",edital:"2.5.1",titulo:"Fundamentos da CASP",material:"CONTP 00",paginas:"3–30",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-04",ordem:41,materia:"Contabilidade Pública / AFO",edital:"2.10.1",titulo:"Orçamento: conceitos, técnicas, modelos e tipos",material:"AFO 04",paginas:"3–36",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.37–68 em B."},
  {id:"afo-01",ordem:42,materia:"Contabilidade Pública / AFO",edital:"2.10.2",titulo:"Princípios orçamentários",material:"AFO 01",paginas:"3–50",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-00",ordem:43,materia:"Contabilidade Pública / AFO",edital:"2.10.3",titulo:"PPA, LDO e LOA",material:"AFO 00",paginas:"5–40",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-03",ordem:44,materia:"Contabilidade Pública / AFO",edital:"2.10.4",titulo:"Ciclo orçamentário",material:"AFO 03",paginas:"3–50 + 67–96",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.51–66 em B; p.97–110 consulta."},
  {id:"afo-02",ordem:45,materia:"Contabilidade Pública / AFO",edital:"2.10.5",titulo:"Créditos adicionais",material:"AFO 02",paginas:"3–51",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-05",ordem:46,materia:"Contabilidade Pública / AFO",edital:"2.7.1",titulo:"Receita pública",material:"AFO 05",paginas:"3–77",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.78–87 em B."},
  {id:"afo-06",ordem:47,materia:"Contabilidade Pública / AFO",edital:"2.7.7",titulo:"Despesa pública",material:"AFO 06",paginas:"3–58",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-07",ordem:48,materia:"Contabilidade Pública / AFO",edital:"2.7.7, 2.11.5",titulo:"Classificação funcional e programática",material:"AFO 07",paginas:"12–39",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.3–11 em B; p.40–43 consulta."},
  {id:"afo-08",ordem:49,materia:"Contabilidade Pública / AFO",edital:"2.7.3, 2.7.5, 2.7.8–2.7.9",titulo:"Estágios e enfoques orçamentário/patrimonial",material:"AFO 08",paginas:"3–44",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"afo-09",ordem:50,materia:"Contabilidade Pública / AFO",edital:"2.7.10",titulo:"Restos a pagar",material:"AFO 09",paginas:"3–26",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"DEA p.27–35 em B; suprimento p.36–54 em C."},
  {id:"cas-03",ordem:51,materia:"Contabilidade Pública / AFO",edital:"2.5.2–2.5.5",titulo:"Patrimônio público e variações patrimoniais",material:"CONTP 03",paginas:"3–17",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-04",ordem:52,materia:"Contabilidade Pública / AFO",edital:"2.5.7–2.5.11",titulo:"Procedimentos contábeis patrimoniais II",material:"CONTP 04",paginas:"3–41",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-05",ordem:53,materia:"Contabilidade Pública / AFO",edital:"2.5.11–2.5.13",titulo:"Procedimentos patrimoniais III",material:"CONTP 05",paginas:"3–44",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-06",ordem:54,materia:"Contabilidade Pública / AFO",edital:"2.8.3",titulo:"PCASP",material:"CONTP 06",paginas:"3–27",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-12",ordem:55,materia:"Contabilidade Pública / AFO",edital:"2.11.3",titulo:"Lei 4.320 — Título IX",material:"CONTP 12",paginas:"3–16",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"dc-bp",ordem:56,materia:"Contabilidade Pública / AFO",edital:"2.9.5",titulo:"Balanço Patrimonial",material:"CONTP 09",paginas:"3–20",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"dc-dvp",ordem:57,materia:"Contabilidade Pública / AFO",edital:"2.9.4",titulo:"Demonstração das Variações Patrimoniais",material:"CONTP 10",paginas:"teoria — corte final pendente",profundidade:"A",prioridade:"P1+",cobertura:"parcial"},
  {id:"dc-bo",ordem:58,materia:"Contabilidade Pública / AFO",edital:"2.9.2",titulo:"Balanço Orçamentário",material:"CONTP 07",paginas:"3–17",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"dc-bf",ordem:59,materia:"Contabilidade Pública / AFO",edital:"2.9.3",titulo:"Balanço Financeiro",material:"CONTP 08",paginas:"3–10",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"dc-dfc",ordem:60,materia:"Contabilidade Pública / AFO",edital:"2.9.6–2.9.9",titulo:"DFC, DMPL e notas explicativas",material:"CONTP 11",paginas:"3–22",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-13",ordem:61,materia:"Contabilidade Pública / AFO",edital:"2.5.1, 2.8.1, 2.9.1",titulo:"NBC TSP — Estrutura Conceitual",material:"CONTP 13",paginas:"3–53",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"cas-14a",ordem:62,materia:"Contabilidade Pública / AFO",edital:"2.5.7–2.5.10, 2.9",titulo:"NBC TSP tópicas — núcleo",material:"CONTP 14",paginas:"4–6 + 15–28 + 29–43",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.9–14 e 44–50 são complementares; p.7–8 consulta."},
  {id:"cust-public",ordem:63,materia:"Contabilidade Pública / AFO",edital:"2.6.1",titulo:"Sistema de custos no setor público — introdução",material:"CONTP 16",paginas:"3–15",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"nbctsp34",ordem:64,materia:"Contabilidade Pública / AFO",edital:"2.6.2",titulo:"NBC TSP 34 — Custos no Setor Público",material:"NBC TSP 34",paginas:"1–15 (integral)",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"rr",ordem:65,materia:"Contabilidade Pública / AFO",edital:"2.9.10–2.9.11",titulo:"RREO e RGF",material:"CONTP 17",paginas:"3–10",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"divida",ordem:66,materia:"Contabilidade Pública / AFO",edital:"2.7.11",titulo:"Dívida e endividamento — consolidação",material:"CONTP 18",paginas:"3–15",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Estudar após AFO 14."},
  {id:"lrf",ordem:67,materia:"Contabilidade Pública / AFO",edital:"2.11.4",titulo:"LRF — bloco didático",material:"AFO 11–14",paginas:"AFO11 3–78; AFO12 3–57; AFO13 3–66; AFO14 3–70",profundidade:"A",prioridade:"P1+",cobertura:"parcial",observacao:"Fonte normativa específica de 2.11 fica para etapa posterior."},
  {id:"fundeb",ordem:68,materia:"Contabilidade Pública / AFO",edital:"2.10.7",titulo:"FUNDEB — composição, distribuição e utilização",material:"Manual Novo FUNDEB 2021",paginas:"10–31 + 43–60",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.32–42 em B. CONTP19 funciona como complemento contábil."},
  {id:"ldb",ordem:69,materia:"Contabilidade Pública / AFO",edital:"2.10.8",titulo:"LDB — recursos financeiros da educação",material:"Lei 9.394/1996",paginas:"arts. 68–77",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"msc",ordem:70,materia:"Contabilidade Pública / AFO",edital:"2.8.6",titulo:"Matriz de Saldos Contábeis",material:"Regras Gerais MSC 2026",paginas:"3–17",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"simam",ordem:71,materia:"Contabilidade Pública / AFO",edital:"2.8.7",titulo:"SIM-AM — aspectos contábeis",material:"Nota 005/2026 SIM-AM",paginas:"integral (3 p.)",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Layout SIM-AM 2026 fica como consulta."},
  {id:"dctf",ordem:72,materia:"Contabilidade Pública / AFO",edital:"2.8.10",titulo:"DCTFWeb",material:"Guia Rápido DCTFWeb",paginas:"integral (8 p.)",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"efd",ordem:73,materia:"Contabilidade Pública / AFO",edital:"2.8.8",titulo:"EFD-Reinf — núcleo conceitual",material:"Manual EFD-Reinf 1.5.1.3",paginas:"4–6 + 9–15",profundidade:"A",prioridade:"P1+",cobertura:"parcial",observacao:"p.16–22 em B. Datas/regras operacionais de 2021 precisam validação atual antes de memorização."},
  {id:"cdp",ordem:74,materia:"Contabilidade Pública / AFO",edital:"2.8.11",titulo:"Cadastro da Dívida Pública — CDP",material:"Manual CDP 2025",paginas:"4–15",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"mcasp",ordem:75,materia:"Contabilidade Pública / AFO",edital:"2.8.2",titulo:"MCASP 11ª edição — consulta normativa dirigida",material:"MCASP 11ª edição",paginas:"seletivo por tópico",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Não estudar 623 páginas linearmente; usar para atualização/fechamento dos tópicos."},
  {id:"ipcs",ordem:76,materia:"Contabilidade Pública / AFO",edital:"2.8.5",titulo:"IPCs/STN — consolidação oficial",material:"IPC 01, 02, 04, 05, 06, 07 e 08",paginas:"seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"IPCs 03/11/16 em B secundário; demais em consulta."},
  {id:"dipr",ordem:77,materia:"Contabilidade Pública / AFO",edital:"2.9.12",titulo:"DIPR",material:"DIPR.pdf",paginas:"seletivo",profundidade:"A",prioridade:"P1",cobertura:"fechado"},
  {id:"siope",ordem:78,materia:"Contabilidade Pública / AFO",edital:"2.9.13",titulo:"SIOPE — núcleo conceitual",material:"Manual SIOPE",paginas:"parte conceitual inicial",profundidade:"A",prioridade:"P1",cobertura:"fechado"},
  {id:"siops",ordem:79,materia:"Contabilidade Pública / AFO",edital:"2.9.14",titulo:"SIOPS — núcleo conceitual",material:"Cartilha SIOPS",paginas:"seletivo",profundidade:"A",prioridade:"P1",cobertura:"fechado"},


  // Português — trilha Curitiba 2026. POR05/06/08/11 ficam fora da primeira passagem e entram como remediação.
  {id:"pt-01",ordem:100,materia:"Português",edital:"1.1.1",titulo:"Interpretação e compreensão",material:"POR14",paginas:"51–73",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-02",ordem:101,materia:"Português",edital:"1.1.4",titulo:"Coesão, coerência e reescrita",material:"POR12",paginas:"3–23",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-03",ordem:102,materia:"Português",edital:"1.1.7",titulo:"Semântica",material:"POR13",paginas:"3–29",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-04",ordem:103,materia:"Português",edital:"1.1.6",titulo:"Classes de palavras I",material:"POR01",paginas:"3–57",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-05",ordem:104,materia:"Português",edital:"1.1.6",titulo:"Preposição e conjunção",material:"POR02",paginas:"3–41",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-06",ordem:105,materia:"Português",edital:"1.1.6",titulo:"Pronomes",material:"POR03",paginas:"3–27",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Colocação pronominal fica fora da primeira passagem."},
  {id:"pt-07",ordem:106,materia:"Português",edital:"1.1.6",titulo:"Verbos",material:"POR04",paginas:"3–42 + 43–68 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Tempos/modos e formas nominais primeiro; transitividade/classificações de modo seletivo."},
  {id:"pt-08",ordem:107,materia:"Português",edital:"1.1.8",titulo:"Funções sintáticas",material:"POR07",paginas:"3–40",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-09",ordem:108,materia:"Português",edital:"1.1.10",titulo:"Pontuação",material:"POR09",paginas:"3–49",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-10",ordem:109,materia:"Português",edital:"1.1.9",titulo:"Concordância verbal e nominal",material:"POR10",paginas:"3–55",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"pt-11",ordem:110,materia:"Português",edital:"1.1.5, 1.1.11",titulo:"Ortografia, acentuação e porquês",material:"POR00",paginas:"4–29 + 42–65 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"pt-12",ordem:111,materia:"Português",edital:"1.1.2",titulo:"Variação linguística",material:"POR15",paginas:"3–26",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"pt-13",ordem:112,materia:"Português",edital:"1.1.3",titulo:"Tipologia, gêneros e funções da linguagem",material:"POR14",paginas:"3–50",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Segunda entrada no POR14; interpretação p.51–73 vem primeiro."},
  {id:"pt-14",ordem:113,materia:"Português",edital:"1.1.12",titulo:"Figuras de linguagem",material:"POR13",paginas:"30–53",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Segunda entrada no POR13; semântica p.3–29 vem primeiro."},
  {id:"pt-15",ordem:114,materia:"Português",edital:"1.1.12",titulo:"Literatura Brasileira — escolas, autores e obras",material:"Literatura Brasileira",paginas:"11–59",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Priorizar Romantismo, Realismo/Naturalismo, Pré-Modernismo e Modernismo sem abandonar as demais escolas."},
  {id:"pt-16",ordem:115,materia:"Português",edital:"1.1.1–1.1.12",titulo:"Revisão geral de Português",material:"POR16",paginas:"3–72",profundidade:"C",prioridade:"P2",cobertura:"fechado",observacao:"Usar somente após a primeira passagem, como revisão/remediação adaptativa."},

  // Legislação Municipal — lei seca do edital.
  {id:"leg-01",ordem:120,materia:"Legislação Municipal",edital:"2.1.1",titulo:"Lei Orgânica do Município de Curitiba",material:"Lei Orgânica Curitiba",paginas:"integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"leg-02",ordem:121,materia:"Legislação Municipal",edital:"2.1.2",titulo:"Estatuto dos Funcionários Públicos Municipais",material:"Lei Municipal 1.656/1958",paginas:"integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"leg-03",ordem:122,materia:"Legislação Municipal",edital:"2.1.3",titulo:"Organização administrativa do Poder Executivo",material:"Lei Municipal 7.671/1991",paginas:"integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"leg-04",ordem:123,materia:"Legislação Municipal",edital:"2.1.4",titulo:"Código Tributário Municipal",material:"LC Municipal 40/2001",paginas:"integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"leg-05",ordem:124,materia:"Legislação Municipal",edital:"2.1.5",titulo:"Finanças e gestão fiscal municipal",material:"LC Municipal 101/2017",paginas:"integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"leg-06",ordem:125,materia:"Legislação Municipal",edital:"2.1.6",titulo:"Habilitação em contratações de serviços",material:"Decreto Municipal 2.051/2025",paginas:"arts. 5º–14",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"O botão de material também oferece o Decreto 707/2026, que altera os arts. 7º e 13 dentro do recorte do edital."},
  {id:"leg-07",ordem:126,materia:"Legislação Municipal",edital:"2.1.7",titulo:"Habilitação em aquisições de bens",material:"Decreto Municipal 2.067/2025",paginas:"arts. 5º–11",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},

  // Informática — 15/15 itens do edital cobertos. INF00/01/02 e INF12 ficam fora da primeira passagem.
  {id:"inf-01",ordem:130,materia:"Informática",edital:"1.2.1, 1.2.3",titulo:"Software — conceitos e classificações",material:"INF 16",paginas:"3–21",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-02",ordem:131,materia:"Informática",edital:"1.2.2",titulo:"Hardware — conceitos, entrada/saída, CPU e memória",material:"INF 15",paginas:"3–6 + 14–43 + 68–118",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-03",ordem:132,materia:"Informática",edital:"1.2.7",titulo:"Windows 10 — base operacional",material:"INF 13",paginas:"3–103 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-04",ordem:133,materia:"Informática",edital:"1.2.4, 1.2.5, 1.2.7",titulo:"Windows 11 — diferenças, arquivos e atalhos",material:"INF 13.1",paginas:"3–20 + 54–107 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-05",ordem:134,materia:"Informática",edital:"1.2.7",titulo:"Linux/Ubuntu — conceitos, arquivos, permissões e comandos",material:"INF 14",paginas:"10–81 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"inf-06",ordem:135,materia:"Informática",edital:"1.2.6",titulo:"Segurança — princípios, autenticação e criptografia",material:"INF 07",paginas:"3–57",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-07",ordem:136,materia:"Informática",edital:"1.2.6",titulo:"Malware, ataques e golpes",material:"INF 08",paginas:"3–79",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-08",ordem:137,materia:"Informática",edital:"1.2.6",titulo:"Antimalware, firewall e mecanismos",material:"INF 09",paginas:"3–16 + 81–100 + 189–209",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-09",ordem:138,materia:"Informática",edital:"1.2.6",titulo:"Backup",material:"INF 10",paginas:"3–19",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"inf-10",ordem:139,materia:"Informática",edital:"1.2.10",titulo:"Navegadores de Internet",material:"INF 06",paginas:"4–72 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-11",ordem:140,materia:"Informática",edital:"1.2.13",titulo:"Busca e pesquisa na Web",material:"INF 04",paginas:"3–34",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-12",ordem:141,materia:"Informática",edital:"1.2.11",titulo:"Nuvem e Google Drive",material:"INF 03",paginas:"3–35 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"inf-13",ordem:142,materia:"Informática",edital:"1.2.12",titulo:"E-mail e Outlook",material:"INF 05",paginas:"3–71 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Gmail/Zimbra: consolidar conceitos de webmail pelas questões do Study OS."},
  {id:"inf-14",ordem:143,materia:"Informática",edital:"1.2.8",titulo:"Word 2016",material:"Word 2016",paginas:"2–30 integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-15",ordem:144,materia:"Informática",edital:"1.2.9",titulo:"Excel 2016",material:"INF 11",paginas:"3–198 seletivo; resumo 199–214",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Prioridade máxima em fórmulas, funções, referências e atalhos; não ler linearmente."},
  {id:"inf-16",ordem:145,materia:"Informática",edital:"1.2.14",titulo:"IA generativa — conceitos, prompts, alucinação, vieses e segurança",material:"IA Generativa",paginas:"5–29",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-17",ordem:146,materia:"Informática",edital:"1.2.14",titulo:"IA — conceitos e bons prompts",material:"Apostila IA",paginas:"3–5 + 29–33",profundidade:"B",prioridade:"P1",cobertura:"fechado"},
  {id:"inf-18",ordem:147,materia:"Informática",edital:"1.2.14",titulo:"IA — revisão rápida",material:"Infográfico IA",paginas:"1–2 integral",profundidade:"C",prioridade:"P2",cobertura:"fechado"},
  {id:"inf-19",ordem:148,materia:"Informática",edital:"1.2.15",titulo:"Power BI — BI, dados, transformação, medidas e visuais",material:"Power BI Nível I",paginas:"5–55 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"inf-20",ordem:149,materia:"Informática",edital:"1.2.15",titulo:"Power BI — complemento prático",material:"Power BI Ninja",paginas:"5–36 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado"},

  // Matemática Financeira — 13/13 itens do edital mapeados; questões dos PDFs ficam fora da primeira passagem.
  {id:"mf-01",ordem:160,materia:"Matemática Financeira",edital:"2.2.1",titulo:"Razão, proporção e proporcionalidade",material:"RACM 14",paginas:"3–30",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"mf-02",ordem:161,materia:"Matemática Financeira",edital:"2.2.1",titulo:"Regra de três simples e composta",material:"RACM 15",paginas:"3–16",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"mf-03",ordem:162,materia:"Matemática Financeira",edital:"2.2.1",titulo:"Porcentagens, aumentos, descontos e variações",material:"RACM 16",paginas:"3–43",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.44–77 em B/revisão."},
  {id:"mf-04",ordem:163,materia:"Matemática Financeira",edital:"2.2.2–2.2.4",titulo:"Juros simples, regimes e taxas proporcionais",material:"RACM 26",paginas:"3–43",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.44–52 em B."},
  {id:"mf-05",ordem:164,materia:"Matemática Financeira",edital:"2.2.2–2.2.4",titulo:"Juros compostos; taxas nominal, efetiva e equivalente",material:"RACM 27",paginas:"3–34",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.35–41 em B; p.42–52 em C."},
  {id:"mf-06",ordem:165,materia:"Matemática Financeira",edital:"2.2.3",titulo:"Descontos",material:"RACM 28",paginas:"3–43",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"mf-07",ordem:166,materia:"Matemática Financeira",edital:"2.2.4, 2.2.11–2.2.12",titulo:"Taxa real/aparente, inflação e custo efetivo",material:"RACM 29",paginas:"3–17 + 24–32",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.18–23 em B; p.33–38 em C."},
  {id:"mf-08",ordem:167,materia:"Matemática Financeira",edital:"2.2.5–2.2.6",titulo:"Equivalência de capitais; rendas uniformes e variáveis",material:"RACM 30",paginas:"3–50",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"p.51–58 em B."},
  {id:"mf-09",ordem:168,materia:"Matemática Financeira",edital:"2.2.7–2.2.10",titulo:"Amortização; Price, SAC e SAM",material:"RACM 31",paginas:"3–64",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Sistema Americano e Sinking Fund (p.65–86) em C."},
  {id:"mf-10",ordem:169,materia:"Matemática Financeira",edital:"2.2.11–2.2.13",titulo:"Investimentos, VPL, TIR e taxa de retorno",material:"RACM 32",paginas:"4–36",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"TIRM p.37–45 em B; payback/índice de lucratividade p.46–63 em B/P1."},

  // Estatística — 6/6 itens do edital mapeados. 2.3.5–2.3.6 fechados provisoriamente com apoio aplicado/estatístico; sem inventar material fiscal específico.
  {id:"est-01",ordem:180,materia:"Estatística",edital:"2.3.1–2.3.2",titulo:"Conceitos fundamentais; organização, apresentação e interpretação",material:"Manual de Estatística — Fazenda",paginas:"5–38",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"est-02",ordem:181,materia:"Estatística",edital:"2.3.3",titulo:"Medidas de tendência central",material:"RACM 13",paginas:"3–52 seletivo",profundidade:"A",prioridade:"P1+",cobertura:"fechado",observacao:"Somatório p.6–15 tem peso menor; foco em médias e dados agrupados."},
  {id:"est-03",ordem:182,materia:"Estatística",edital:"2.3.3",titulo:"Mediana, moda e separatrizes",material:"Manual de Estatística — Fazenda",paginas:"45–50",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"est-04",ordem:183,materia:"Estatística",edital:"2.3.4",titulo:"Amplitude, variância, desvio-padrão e coeficiente de variação",material:"Dispersão.pdf",paginas:"1–13 integral",profundidade:"A",prioridade:"P1+",cobertura:"fechado"},
  {id:"est-05",ordem:184,materia:"Estatística",edital:"2.3.5",titulo:"Análise e interpretação em contexto público/arrecadatório",material:"Estatística aplicada à arrecadação.pdf",paginas:"11–32 seletivo",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Fechamento provisório: material aplicado, mas não é apostila fiscal específica."},
  {id:"est-06",ordem:185,materia:"Estatística",edital:"2.3.5–2.3.6",titulo:"Correlação, regressão e estimação",material:"Manual de Estatística — Fazenda",paginas:"77–82",profundidade:"B",prioridade:"P1",cobertura:"fechado",observacao:"Apoio técnico para análise e estimativa."},
  {id:"est-07",ordem:186,materia:"Estatística",edital:"2.3.6",titulo:"Métodos estatísticos de estimação — remediação",material:"Métodos Estatísticos I",paginas:"seletivo",profundidade:"C",prioridade:"P2",cobertura:"fechado",observacao:"O PDF nomeado 'Estimativa de perdas de arrecadação' é um livro geral de Métodos Estatísticos I; usar apenas sob demanda."},

  {id:"norm-pendente",ordem:200,materia:"Normas 2.11 — depois",edital:"2.11.1–2.11.17",titulo:"Fechamento normativo específico",material:"Fontes oficiais a complementar",paginas:"pendente",profundidade:"C",prioridade:"—",cobertura:"pendente",observacao:"Adiado por decisão de estudo. Não conta como cobertura concluída."},
];

export const MATERIAS_TRILHA = Array.from(new Set(TRILHA_TEORICA.map(e=>e.materia)));
