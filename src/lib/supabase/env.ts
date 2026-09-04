/**
 * Credenciales de Supabase. Acepta el nombre nuevo (PUBLISHABLE_KEY) y el viejo
 * (ANON_KEY) para no romper entornos que ya tengan cargada la variable anterior.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}
