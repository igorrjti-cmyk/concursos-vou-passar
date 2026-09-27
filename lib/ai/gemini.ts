import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

/**
 * Modelo usado em todo o módulo de IA. Pode ser sobrescrito por env var
 * sem precisar mexer em código, caso o nome do modelo mude.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

/**
 * Cliente único do Gemini para uso no servidor (rotas de API). Nunca
 * importar este arquivo em componentes "use client" — a chave fica
 * só no servidor.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY não configurada. Veja .env.example e adicione a chave nas variáveis de ambiente do projeto."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Chama o Gemini pedindo saída estruturada em JSON, validada contra o
 * schema informado (formato OpenAPI-like aceito pelo SDK).
 */
export async function gerarJson<T>(params: {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
}): Promise<T> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: params.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: params.schema as any,
      temperature: params.temperature ?? 0.4,
    },
  });

  const texto = response.text;
  if (!texto) {
    throw new Error("Gemini não retornou conteúdo.");
  }
  return JSON.parse(texto) as T;
}
