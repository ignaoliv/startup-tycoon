import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Mail con acceso al panel. Sin la variable cargada, no entra nadie. */
const ADMIN = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

// En Next 16 el middleware se llama proxy. Refresca la sesión y cuida /admin.
export async function proxy(request: NextRequest) {
  const { response, email } = await updateSession(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const autorizado = ADMIN.length > 0 && email?.toLowerCase() === ADMIN;
    if (!autorizado) return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos archivos estáticos e imágenes, para no encarecer cada request:
     * _next/static, _next/image, favicon, íconos y assets del public.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|webmanifest|ttf|woff2?|txt|xml)$).*)",
  ],
};
