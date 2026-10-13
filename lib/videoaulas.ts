// Videoaulas selecionadas por correspondência de disciplina, aula e assunto.
// Somente links de arquivos MP4 verificados no Google Drive.
// Manter separado dos PDFs para preservar o comportamento anterior.
export type LinkVideo = { nome: string; url: string };
export const VIDEOAULAS: Record<string, LinkVideo[]> = {
  "CGAJ 00": [
    { nome: "Conceitos Introdutórios — Parte 01", url: "https://drive.google.com/file/d/1W7NqhxUJ2f3JxqQjL0s7NdGZookpmZDH/view" },
    { nome: "Conceitos Introdutórios — Parte 02", url: "https://drive.google.com/file/d/1cDh9b5MWsMR3jd6pP_h1KF4Dq1ZIb-O3/view" },
  ],
};
export function linksDasVideoaulas(material: string): LinkVideo[] {
  return VIDEOAULAS[material] ?? [];
}
