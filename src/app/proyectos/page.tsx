import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { ListaProyectos } from "@/components/ListaProyectos";
import { fetchProyectos } from "@/lib/perfil";
import { SITIO } from "@/lib/seo";

export const revalidate = 60;

const TITULO = "La comunidad de vibecoders y lo que está construyendo";
const DESC =
  "Los proyectos reales de la comunidad de vibecoding: productos hechos con inteligencia artificial, con su link y quién los construye. Se votan con vibecoins, que se ganan jugando.";

export const metadata: Metadata = {
  title: { absolute: `${TITULO} · Vibe Coding Game` },
  description: DESC,
  keywords: ["vibecoding", "vibecoders", "comunidad vibecoding", "proyectos hechos con IA", "indie hackers"],
  alternates: { canonical: `${SITIO}/proyectos` },
  openGraph: { title: TITULO, description: DESC, url: `${SITIO}/proyectos` },
  twitter: { card: "summary_large_image", title: TITULO, description: DESC },
};

export default async function Proyectos() {
  const proyectos = await fetchProyectos();

  // La lista en datos estructurados: es lo que un buscador con IA puede citar
  // cuando le preguntan qué está construyendo la comunidad de vibecoding.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITULO,
    description: DESC,
    url: `${SITIO}/proyectos`,
    isPartOf: { "@type": "WebSite", name: "Vibe Coding Game", url: SITIO },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: proyectos.length,
      itemListElement: proyectos.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareApplication",
          name: p.proyecto,
          description: p.proyecto_desc ?? undefined,
          url: p.proyecto_url ?? `${SITIO}/u/${p.handle}`,
          applicationCategory: "WebApplication",
          author: { "@type": "Person", name: p.display_name ?? p.handle, url: `${SITIO}/u/${p.handle}` },
        },
      })),
    },
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
        <h1 className="text-3xl font-black leading-tight">Qué está construyendo la comunidad vibecodera</h1>
        <p className="mt-1 text-sm text-ink/60">
          Productos reales hechos con IA, por la gente que juega. Se votan con vibecoins, y las vibecoins se ganan
          jugando.
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
