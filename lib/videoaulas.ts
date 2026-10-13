// Videoaulas selecionadas por correspondência de disciplina, aula e assunto.
// Somente links de arquivos MP4 verificados no Google Drive.
// Manter separado dos PDFs para preservar o comportamento anterior.
export type LinkVideo = { nome: string; url: string };
export const VIDEOAULAS: Record<string, LinkVideo[]> = {
  "CGAJ 00": [
    { nome: "Conceitos Introdutórios — Parte 01", url: "https://drive.google.com/file/d/1W7NqhxUJ2f3JxqQjL0s7NdGZookpmZDH/view" },
    { nome: "Conceitos Introdutórios — Parte 02", url: "https://drive.google.com/file/d/1cDh9b5MWsMR3jd6pP_h1KF4Dq1ZIb-O3/view" },
  ],
  "CGAJ 01": [{ nome: "Patrimônio — Teoria", url: "https://drive.google.com/file/d/1r2hxGejJhIJWIIe4LuxFObhBKqjowcTY/view" }],
  "CGAJ 01 Parte 2": [{ nome: "Contas de Resultado", url: "https://drive.google.com/file/d/1nwmiS10Vy36xdvDjHXv97_Sc_LJDtx2x/view" }],
  "CGAJ 02": [{ nome: "Escrituração", url: "https://drive.google.com/file/d/1MDdBa55yG0RB0QkIZnQEGdDUmMEd7vGT/view" }],
  "CGAJ 02 Parte 2": [{ nome: "Balancete de Verificação — Teoria", url: "https://drive.google.com/file/d/1LR3TqUXuy-c3jvyO9N3dkIIaEmBDt3ka/view" }],
  "CGAJ 03": [{ nome: "Regime de Competência e Caixa", url: "https://drive.google.com/file/d/14LwvkVzgunBXxsqbP9zGpEhLPi4atxZw/view" }],
  "CGAJ 05": [{ nome: "CPC 16 — Estoques", url: "https://drive.google.com/file/d/1Y5wjeF_zLJm2V3zgsBPn6_OLfY6xHvu7/view" }],
  "CUST 00": [{ nome: "Terminologias de Custos", url: "https://drive.google.com/file/d/1ArPdPhlf0ZLVdjUjKgqdkg9l2aWGFb0l/view" }],
  "AFO 00": [{ nome: "PPA, LDO e LOA", url: "https://drive.google.com/file/d/1v8-eOafbOVR8MdniH0UnKb4zq1-v7Q4X/view" }],
  "CONTP 00": [{ nome: "Aspectos Introdutórios", url: "https://drive.google.com/file/d/1B55PCV1Rn7gVxoQiZTNjPCG3OLe0HIfo/view" }],
  "POR00": [{ nome: "Acentuação Gráfica", url: "https://drive.google.com/file/d/13w8c8QORqUwj7UGNb4Nkk0-h5a7w0kox/view" }],
  "POR01": [{ nome: "Classes de Palavras", url: "https://drive.google.com/file/d/1UgU5SgsSV03xSETaTQl2RMXQWlA8cUZa/view" }],
  "INF 03": [{ nome: "Computação em Nuvem", url: "https://drive.google.com/file/d/1eEBn-tFbiO97EEtlC4Vn9CXINhXj7pdr/view" }],
  "RACM 14": [{ nome: "Razão — Teoria", url: "https://drive.google.com/file/d/1UitequrCoH4shs5z-HOrkcdrEYeAnCuc/view" }],
};
export function linksDasVideoaulas(material: string): LinkVideo[] {
  return VIDEOAULAS[material] ?? [];
}
