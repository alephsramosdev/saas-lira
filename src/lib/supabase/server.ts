import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function hasSupabaseServerEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY)
  );
}

/**
 * Cliente Supabase de servidor (chave secreta — ignora RLS).
 * Nunca importar em componentes client.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error(
        "Defina NEXT_PUBLIC_SUPABASE_URL e uma chave de servidor do Supabase (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY) no ambiente da aplicacao"
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Códigos do PostgREST/Postgres para "tabela não existe" (schema ainda não aplicado). */
export function isMissingTableError(error: { code?: string } | null): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205");
}
