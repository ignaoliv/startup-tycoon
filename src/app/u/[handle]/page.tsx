import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { numCorto, plataCorta } from "@/lib/compartir";
import { categoriaDe, dominioDe, fetchPerfilPorHandle, fetchProyectosDe, fetchPuesto, sectorDe, urlProyecto } from "@/lib/perfil";
import { IconoProyecto } from "@/components/IconoProyecto";
import { BotonEditarPerfil } from "@/components/BotonEditarPerfil";
import { SITIO } from "@/lib/seo";

export const revalidate = 120;

const urlX = (u: string) => `https://x.com/${u.replace(/^@/, "")}`;
const urlLinkedin = (u: string) => `https://www.linkedin.com/in/${u}`;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = await fetchPerfilPorHandle(handle);
  if (!p) return { title: "Perfil no encontrado · Vibe Coding Game" };
  const nombre = p.display_name ?? p.handle ?? "Jugador";
  const proyectos = await fetchProyectosDe(p.id);
  const primero = proyectos[0];
  const titulo = primero ? `${nombre} está construyendo ${primero.proyecto}` : `${nombre} en Vibe Coding Game`;
  const desc =
    primero?.proyecto_desc ??
    (p.mejor_valuacion ? `Su mejor startup valió ${plataCorta(Number(p.mejor_valuacion))}.` : "Construyendo con IA.");
  const url = `${SITIO}/u/${p.handle}`;
  return {
    title: { absolute: `${titulo} · Vibe Coding Game` },
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: titulo, description: desc, url, type: "profile" },
    twitter: { card: "summary_large_image", title: titulo, description: desc },
  };
}

export default async function PerfilPublico({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = await fetchPerfilPorHandle(handle);
  if (!p) notFound();

  const nombre = p.display_name ?? p.handle ?? "Jugador";
  const sec = sectorDe(p.mejor_sector);
  const [puesto, proyectos] = await Promise.all([
    p.mejor_valuacion ? fetchPuesto(Number(p.mejor_valuacion)) : Promise.resolve(null),
    fetchProyectosDe(p.id),
  ]);

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

      {/* quién es */}
      <section className="mb-4 rounded-2xl border-2 border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="" width={64} height={64} className="rounded-full" />
          ) : (
            <span className="text-5xl">👤</span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-black leading-tight">{nombre}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold">
              {p.twitter && (
                <a href={urlX(p.twitter)} target="_blank" rel="noreferrer" className="text-indigo underline underline-offset-2">
                  𝕏 @{p.twitter.replace(/^@/, "")}
                </a>
              )}
              {p.linkedin && (
                <a href={urlLinkedin(p.linkedin)} target="_blank" rel="noreferrer" className="text-indigo underline underline-offset-2">
                  in/{p.linkedin}
                </a>
              )}
            </div>
          </div>
          <BotonEditarPerfil userId={p.id} />
        </div>
      </section>

      {/* qué está construyendo, que es el motivo de la página */}
      {proyectos.length > 0 && (
        <section className="mb-4 rounded-2xl border-2 border-amber bg-amber/10 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">
            {proyectos.length === 1 ? "Está construyendo" : `Está construyendo ${proyectos.length} cosas`}
          </div>
          <ul className="mt-2 space-y-3">
            {proyectos.map((x) => {
              const link = urlProyecto(x.proyecto_url);
              const dominio = dominioDe(x.proyecto_url);
              const cat = categoriaDe(x.categoria);
              return (
                <li key={x.id} className="flex items-start gap-3">
                  <IconoProyecto nombre={x.proyecto} url={x.proyecto_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xl font-black leading-tight">{x.proyecto}</span>
                      <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-black text-ink/55">
                        {cat.icono} {cat.nombre}
                      </span>
                      {x.votos > 0 && (
                        <span className="shrink-0 text-[11px] font-black text-ink/50 tabular-nums">🪙 {x.votos}</span>
                      )}
                    </div>
                    {x.proyecto_desc && <p className="mt-0.5 text-sm text-ink/70">{x.proyecto_desc}</p>}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn mt-2 inline-flex border-ink bg-white px-3 py-1.5 text-xs"
                      >
                        🔗 {dominio ?? "Ver el proyecto"}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* la credencial: se gana jugando, no pidiendo votos */}
      {p.mejor_valuacion ? (
        <section className="mb-4 rounded-2xl border-2 border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Su mejor startup</div>
            {puesto && puesto <= 500 && (
              <div className="text-xs font-black text-amber">#{puesto} del ranking</div>
            )}
          </div>
          <div className="text-xl font-black">
            {sec?.icon} {p.mejor_startup}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Valuación", plataCorta(Number(p.mejor_valuacion))],
              ["Usuarios", numCorto(Number(p.mejor_usuarios ?? 0))],
              ["Días", String(p.mejor_dia ?? 0)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border-2 border-ink/10 px-2 py-2">
                <div className="text-[9px] font-black uppercase tracking-wide text-ink/45">{k}</div>
                <div className="text-base font-black tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          {!!p.partidas && (
            <p className="mt-3 text-xs text-ink/55">
              {p.partidas} {p.partidas === 1 ? "partida jugada" : "partidas jugadas"}
              {!!p.ganadas && `, ${p.ganadas} ${p.ganadas === 1 ? "ganada" : "ganadas"}`}.
            </p>
          )}
        </section>
      ) : (
        <section className="mb-4 rounded-2xl border-2 border-dashed border-ink/15 p-5 text-center text-sm text-ink/50">
          Todavía no terminó ninguna partida.
        </section>
      )}

      <div className="mb-6 text-center">
        <Link href="/play" className="btn border-ink bg-indigo px-5 py-3 text-base text-white">
          🚀 Armá la tuya
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}
