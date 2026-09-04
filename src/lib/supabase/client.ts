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

/** Alias con el nombre que usa la documentación de Supabase. */
export const createClient = () => createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
