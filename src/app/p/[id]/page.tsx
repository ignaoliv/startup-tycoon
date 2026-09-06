import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { FINALES, fetchRunPorGameId, numCorto, plataCorta, sectorDe, textoParaCompartir } from "@/lib/compartir";
import { SITIO } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = await fetchRunPorGameId(id);
  if (!r) return { title: "Partida no encontrada · Vibe Coding Game" };
  const fin = FINALES[r.ended_as] ?? FINALES.abandoned;
  const titulo = `${r.name}: ${fin.titulo.toLowerCase()} el día ${r.day}`;
  const desc = `${plataCorta(r.valuation)} de valuación y ${numCorto(r.peak_users)} usuarios. Jugá tu propia startup hecha con IA.`;
  return {
    // absolute para que no se le pegue el sufijo del layout
    title: { absolute: `${titulo} · Vibe Coding Game` },
    description: desc,
    alternates: { canonical: `${SITIO}/p/${id}` },
    openGraph: { title: titulo, description: desc, url: `${SITIO}/p/${id}`, type: "article" },
    // sin esto la tarjeta de X muestra el texto genérico del sitio
    twitter: { card: "summary_large_image", title: titulo, description: desc },
  };
}

export default async function PartidaCompartida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await fetchRunPorGameId(id);
  const fin = r ? FINALES[r.ended_as] ?? FINALES.abandoned : null;
  const sec = r ? sectorDe(r.sector) : null;

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
          <Link href="/play" className="btn border-ink bg-amber px-3 py-2 text-sm text-ink">
            🚀 Jugar
          </Link>
        </div>
      </header>

      {!r ? (
        <div className="card text-center">
          <div className="mb-2 text-4xl">🤷</div>
          <h1 className="mb-1 text-xl font-black">No encontramos esa partida</h1>
          <p className="mb-4 text-sm text-ink/60">Puede que se haya borrado, o que el link esté mal.</p>
          <Link href="/play" className="btn border-ink bg-amber px-5 py-3 text-base text-ink">
            🚀 Fundá la tuya
          </Link>
        </div>
      ) : (
        <>
          <div className="card mb-3 text-center">
            <div className="mb-1 text-5xl">{fin!.icono}</div>
            <h1 className="text-2xl font-black">{r.name}</h1>
            <p className={`mb-4 text-sm font-bold ${fin!.tono === "bien" ? "text-green" : "text-red"}`}>
              {fin!.titulo} el día {r.day}
              {sec ? ` · ${sec.icon} ${sec.name}` : ""}
            </p>
            {r.idea && <p className="mb-4 text-sm text-ink/60">&laquo;{r.idea}&raquo;</p>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Valuación", plataCorta(r.valuation)],
                ["Usuarios", numCorto(r.peak_users)],
                ["Equipo", String(r.team_size)],
                ["Features", String(r.features)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border-2 border-ink/10 bg-white px-2 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-ink/50">{k}</div>
                  <div className="text-lg font-black tabular-nums">{v}</div>
                </div>
              ))}
            </div>
            {r.display_name && <p className="mt-3 text-xs text-ink/50">Fundada por <b>{r.display_name}</b></p>}
          </div>

          <div className="card text-center">
            <h2 className="mb-1 text-lg font-black">¿Te parece fácil?</h2>
            <p className="mb-3 text-sm text-ink/60">Fundá tu startup hecha 100% con IA y llegá más lejos. Gratis y sin cuenta.</p>
            <Link href="/play" className="btn w-full justify-center border-ink bg-amber px-5 py-3 text-base text-ink">
              🚀 Crear mi startup
            </Link>
          </div>
          <p className="sr-only">{textoParaCompartir(r)}</p>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
