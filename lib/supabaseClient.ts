"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

let client: SupabaseClient | null = null;

/**
 * Cliente único do Supabase para uso no navegador. Mantém a sessão de login
 * salva (localStorage) para não precisar logar de novo a cada visita.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error(
        "Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas. Veja .env.example."
      );
    }
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
