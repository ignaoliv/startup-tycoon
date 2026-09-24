import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { ListaProyectos } from "@/components/ListaProyectos";
import { fetchActividad, fetchProyectos } from "@/lib/perfil";
import { IconoProyecto } from "@/components/IconoProyecto";
import { BotonSumarProyecto, ModalSumaProyecto } from "@/components/ModalSumaProyecto";
import { SITIO } from "@/lib/seo";

export const revalidate = 60;

const TITULO = "La comunidad de vibecoders y lo que está construyendo";
const DESC =
  "Los proyectos reales de la comunidad de vibecoding: productos hechos con inteligencia artificial, con su link y quién los construye. Se votan con vibecoins, que se ganan jugando.";

export const metadata: Metadata = {
  title: { absolute: `${TITULO} · Vibe Coding Game` },
  description: DESC,
  keywords: ["vibecoding", "vibecoders", "comunidad vibecoding", "proyectos hechos con IA", "indie hackers"],
  alternates: { canonical: `${SITIO}/comunidad` },
  openGraph: { title: TITULO, description: DESC, url: `${SITIO}/comunidad` },
  twitter: { card: "summary_large_image", title: TITULO, description: DESC },
};

export default async function Proyectos() {
  const [proyectos, actividad] = await Promise.all([fetchProyectos(), fetchActividad(6).catch(() => [])]);

  // La lista en datos estructurados: es lo que un buscador con IA puede citar
  // cuando le preguntan qué está construyendo la comunidad de vibecoding.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITULO,
    description: DESC,
    url: `${SITIO}/comunidad`,
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
      {/* useSearchParams necesita un límite de Suspense para no bloquear el prerender */}
      <Suspense fallback={null}>
        <ModalSumaProyecto />
      </Suspense>
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

      <div className="mb-5 rounded-2xl border-2 border-ink bg-indigo px-5 py-6 text-cream shadow-sm">
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Todo lo que está vibecodeando la comunidad.
        </h1>
        <p className="mt-1.5 text-sm text-cream/75">
          Productos reales hechos con IA, por la gente que juega. Se votan con vibecoins, y las vibecoins se ganan
          jugando.
        </p>
        <BotonSumarProyecto className="btn mt-4 inline-flex border-ink bg-amber px-4 py-2.5 text-sm text-ink">
          🛠️ Sumá tu proyecto
        </BotonSumarProyecto>
      </div>

      {actividad.length > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-ink/10 bg-white px-3 py-3">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-ink/40">Última actividad</div>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {actividad.map((a, i) => (
              <li
                key={`${a.handle}-${a.created_at}-${i}`}
                className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-ink/10 bg-cream/60 px-2.5 py-1.5"
              >
                <IconoProyecto nombre={a.proyecto} url={a.proyecto_url} size={22} />
                <div>
                  <div className="whitespace-nowrap text-[12px] font-black leading-none">{a.proyecto}</div>
                  <div className="whitespace-nowrap text-[10px] text-ink/50">
                    🪙 +1 · {haceCuanto(a.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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

/** "hace 2 horas", con la precisión que hace falta y ni una más. */
function haceCuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}
