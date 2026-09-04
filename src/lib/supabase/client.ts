"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./env";

let client: SupabaseClient | null | undefined;

export function supabaseEnabled() {
  return supabaseConfigured();
}

/** Cliente para el navegador. Devuelve null si el proyecto no tiene Supabase configurado. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = supabaseConfigured() ? createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!) : null;
  return client;
}

/** Manda al usuario a Google y lo devuelve a `next` con la sesión abierta. */
export async function signInWithGoogle(next = "/play") {
  const sb = getSupabase();
  if (!sb) return "Falta configurar Supabase.";
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return error?.message ?? null;
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

/** Alias con el nombre que usa la documentación de Supabase. */
export const createClient = () => createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
