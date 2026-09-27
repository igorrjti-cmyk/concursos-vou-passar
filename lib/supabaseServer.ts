import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para rotas de API (app/api/**). Recebe o access_token
 * do usuário (enviado pelo cliente no header Authorization) e monta um
 * cliente que respeita as políticas de RLS como esse usuário — sem
 * precisar da service role key.
 */
export function getSupabaseServerClient(accessToken: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) {
    throw new Error("Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.");
  }
  return createClient(url, anonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: { persistSession: false },
  });
}

export function pegarTokenDoHeader(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}
