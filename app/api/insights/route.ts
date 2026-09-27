import { NextResponse } from "next/server";
import { getSupabaseServerClient, pegarTokenDoHeader } from "@/lib/supabaseServer";
import { gerarJson } from "@/lib/ai/gemini";
import { insightsSchema } from "@/lib/ai/schemas";
import { promptInsights } from "@/lib/ai/prompts";
import type { InsightsIA } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = pegarTokenDoHeader(req);
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const userId = userData.user.id;
  const hoje = new Date().toISOString().slice(0, 10);

  // 1) Cache do dia
  const { data: cache } = await supabase
    .from("insights_ia")
    .select("*")
    .eq("user_id", userId)
    .eq("gerado_em", hoje)
    .maybeSingle();

  if (cache) {
    return NextResponse.json({ insights: cache.conteudo as InsightsIA, origem: "cache" });
  }

  // 2) Monta desempenho por tópico
  const { data: progresso } = await supabase
    .from("progresso")
    .select("questao_id,status")
    .eq("user_id", userId)
    .neq("status", "nao_iniciada");

  if (!progresso || progresso.length < 5) {
    return NextResponse.json({
      insights: {
        pontos_fortes: [],
        pontos_fracos: [],
        observacoes: ["Responda pelo menos 5 questões para começar a receber insights."],
      } as InsightsIA,
      origem: "insuficiente",
    });
  }

  const ids = progresso.map((p) => p.questao_id);
  const { data: questoes } = await supabase
    .from("questoes")
    .select("id,topic")
    .in("id", ids);

  const topicoPorId = Object.fromEntries(
    (questoes ?? []).map((q) => [q.id, q.topic ?? "Sem tópico"])
  );

  const agregada: Record<string, { topico: string; feitas: number; certas: number }> = {};
  progresso.forEach((p) => {
    const topico = topicoPorId[p.questao_id] ?? "Sem tópico";
    if (!agregada[topico]) agregada[topico] = { topico, feitas: 0, certas: 0 };
    agregada[topico].feitas += 1;
    if (p.status === "feita_certo") agregada[topico].certas += 1;
  });

  const porTopico = Object.values(agregada).sort((a, b) => b.feitas - a.feitas);

  // 3) Chama o Gemini
  let gerado: InsightsIA;
  try {
    gerado = await gerarJson<InsightsIA>({
      prompt: promptInsights({ porTopico }),
      schema: insightsSchema,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao gerar insights: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // 4) Salva em cache (1 por dia)
  await supabase
    .from("insights_ia")
    .upsert(
      { user_id: userId, gerado_em: hoje, conteudo: gerado },
      { onConflict: "user_id,gerado_em" }
    );

  return NextResponse.json({ insights: gerado, origem: "gerado" });
}
