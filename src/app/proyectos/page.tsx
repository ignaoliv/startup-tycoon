import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { ListaProyectos } from "@/components/ListaProyectos";
import { fetchProyectos } from "@/lib/perfil";
import { SITIO } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Qué están construyendo · Vibe Coding Game" },
  description: "Los proyectos reales de la gente que juega a fundar startups con IA.",
  alternates: { canonical: `${SITIO}/proyectos` },
  openGraph: {
    title: "Qué están construyendo los vibecoders",
    description: "Los proyectos reales de la gente que juega a fundar startups con IA.",
    url: `${SITIO}/proyectos`,
  },
};

export default async function Proyectos() {
  const proyectos = await fetchProyectos();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} className="h-8 w-auto sm:h-10" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/home" className="btn border-ink/25 bg-white px-3 py-2 text-sm" title="Ranking">
            🏆 <span className="hidden sm:inline">Ranking</span>
          </Link>
          <Link href="/play" className="btn border-ink bg-amber px-3 py-2 text-sm text-ink">
            🚀 Jugar
          </Link>
        </div>
      </header>

      <div className="mb-5">
        <h1 className="text-3xl font-black leading-tight">Qué están construyendo</h1>
        <p className="mt-1 text-sm text-ink/60">
          Los proyectos de la gente que juega. Se votan con vibecoins, y las vibecoins se ganan jugando.
        </p>
      </div>

      {proyectos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-10 text-center">
          <div className="mb-2 text-4xl">🛠️</div>
          <p className="text-sm font-bold">Todavía no hay ninguno.</p>
          <p className="mt-1 text-xs text-ink/55">Jugá una partida y sumá el tuyo desde tu perfil.</p>
          <Link href="/play" className="btn mt-4 inline-flex border-ink bg-amber px-4 py-2 text-sm text-ink">
            🚀 Jugar
          </Link>
        </div>
      ) : (
        <ListaProyectos iniciales={proyectos} />
      )}

      <div className="my-6 text-center">
        <Link href="/home" className="btn border-ink bg-indigo px-5 py-3 text-base text-white">
          Sumar mi proyecto
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
