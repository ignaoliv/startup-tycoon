import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// En Next 16 el middleware se llama proxy. Refresca la sesión de Supabase en cada pedido.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todo menos archivos estáticos e imágenes, para no encarecer cada request:
     * _next/static, _next/image, favicon, íconos y assets del public.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|webmanifest|ttf|woff2?)$).*)",
  ],
};
