import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Cliente para Server Components, Route Handlers y Server Actions. */
export function createClient(cookieStore: CookieStore) {
  return createServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Se llamó desde un Server Component: lo resuelve el proxy que refresca la sesión.
        }
      },
    },
  });
}
