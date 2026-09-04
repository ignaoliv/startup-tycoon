import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./env";

/**
 * Mantiene viva la sesión: lee las cookies del pedido, refresca el token si hace falta
 * y devuelve la respuesta con las cookies actualizadas.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigured()) return { response, email: null as string | null };

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Necesario: esto es lo que dispara el refresco del token.
  const { data } = await supabase.auth.getUser();

  return { response, email: data.user?.email ?? null };
}
