import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const CONTACTO = "dji.olivieri@gmail.com";
export const ACTUALIZADO = "4 de septiembre de 2026";

export function LegalLayout({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} className="h-8 w-auto sm:h-10" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/home" className="btn border-ink/25 bg-white px-3 py-2 text-sm" title="Mi carrera y el ranking">
            🏆 <span className="hidden sm:inline">Ranking</span>
          </Link>
          <Link href="/" className="btn border-ink/25 bg-white px-3 py-2 text-sm">
            ← Volver
          </Link>
        </div>
      </header>

      <article className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-7">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="mt-1 text-xs text-ink/50">Última actualización: {ACTUALIZADO}</p>
        <div className="mt-5 space-y-5 text-[15px] leading-relaxed text-ink/80">{children}</div>
      </article>

      <SiteFooter />
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-1 text-lg font-black text-ink">{children}</h2>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="ml-4 list-disc space-y-1.5">{children}</ul>;
}
