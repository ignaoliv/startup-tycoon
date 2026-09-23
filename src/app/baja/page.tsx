import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Baja de correo · Vibe Coding Game" },
  robots: { index: false, follow: false },
};

/** Marca la baja por token. No pide sesión: el que abre el mail no está logueado. */
async function darDeBaja(token: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/darse_de_baja`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });
  if (!res.ok) return false;
  return (await res.json()) === true;
}

export default async function Baja({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const ok = t ? await darDeBaja(t) : false;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-5">
      <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} className="h-8 w-auto sm:h-10" />
        </Link>
      </header>

      <div className="rounded-2xl border-2 border-ink/10 bg-white p-6 text-center shadow-sm">
        <div className="mb-2 text-5xl">{ok ? "👋" : "🤔"}</div>
        <h1 className="mb-2 text-2xl font-black leading-tight">
          {ok ? "Listo, no te escribimos más" : "No pudimos darte de baja"}
        </h1>
        <p className="text-sm text-ink/65">
          {ok
            ? "Tu partida y tu perfil siguen igual, esto solo corta los mails."
            : "El link puede estar incompleto. Escribime y lo arreglo a mano."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/play" className="btn border-ink bg-amber px-4 py-2 text-sm text-ink">
            🚀 Seguir jugando
          </Link>
          <Link href="/" className="text-xs font-bold text-ink/50 underline underline-offset-2 hover:text-ink">
            Ir al inicio
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <SiteFooter />
      </div>
    </main>
  );
}
