import { NextResponse } from "next/server";
import { getSupabaseServerClient, pegarTokenDoHeader } from "@/lib/supabaseServer";
import { gerarJson } from "@/lib/ai/gemini";
import { explicacaoSchema } from "@/lib/ai/schemas";
import { promptExplicacao } from "@/lib/ai/prompts";
import type { Questao } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = pegarTokenDoHeader(req);
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const questaoId = body?.questaoId as string | undefined;
  if (!questaoId) {
    return NextResponse.json({ error: "questaoId é obrigatório." }, { status: 400 });
  }

  // 1) Cache — se já existe explicação gerada, não chama o Gemini de novo
  const { data: cache } = await supabase
    .from("explicacoes_ia")
    .select("*")
    .eq("questao_id", questaoId)
    .maybeSingle();

  if (cache) {
    return NextResponse.json({ explicacao: cache, origem: "cache" });
  }

  // 2) Busca a questão (enunciado + resolução oficial)
  const { data: questao, error: qError } = await supabase
    .from("questoes")
    .select("*")
    .eq("id", questaoId)
    .maybeSingle<Questao>();

  if (qError || !questao) {
    return NextResponse.json({ error: "Questão não encontrada." }, { status: 404 });
  }

  // 3) Chama o Gemini pedindo o JSON estruturado
  let gerado: { explicacao_simplificada: string; pegadinha: string; macete: string };
  try {
    gerado = await gerarJson({
      prompt: promptExplicacao(questao),
      schema: explicacaoSchema,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao gerar explicação: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // 4) Salva em cache para não chamar de novo
  const { data: salvo, error: saveError } = await supabase
    .from("explicacoes_ia")
    .upsert(
      {
        questao_id: questaoId,
        explicacao_simplificada: gerado.explicacao_simplificada,
        pegadinha: gerado.pegadinha,
        macete: gerado.macete,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "questao_id" }
    )
    .select("*")
    .maybeSingle();

  if (saveError) {
    // Mesmo que salvar em cache falhe, devolve a explicação gerada
    return NextResponse.json({ explicacao: { questao_id: questaoId, ...gerado }, origem: "gerado" });
  }

  return NextResponse.json({ explicacao: salvo, origem: "gerado" });
}
