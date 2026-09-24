"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

/**
 * "Editar" sobre la propia página. La página es pública y se renderiza en el
 * servidor sin saber quién la mira, así que el dueño se resuelve acá: el que
 * llega a su perfil desde un link compartido no tenía cómo volver a editarlo.
 */
export function BotonEditarPerfil({ userId }: { userId: string }) {
  const [soyYo, setSoyYo] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let vivo = true;
    sb.auth.getUser().then(({ data }) => {
      if (vivo) setSoyYo(data.user?.id === userId);
    });
    return () => {
      vivo = false;
    };
  }, [userId]);

  if (!soyYo) return null;
  return (
    <Link href="/home?s=perfil" className="btn shrink-0 border-ink/25 bg-white px-3 py-1.5 text-xs">
      ✏️ Editar
    </Link>
  );
}
