"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Btn, Card } from "@/components/ui";
import { IconoProyecto } from "@/components/IconoProyecto";
import { getSupabase } from "@/lib/supabase/client";
import {
  asegurarHandle,
  borrarProyecto,
  fetchMisProyectos,
  guardarProyecto,
  TOPE_PROYECTOS,
  type MiProyecto,
} from "@/lib/storage";
import { CATEGORIAS, categoriaDe, dominioDe } from "@/lib/perfil";
import { SITIO } from "@/lib/seo";

type Borrador = { id: string | null; nombre: string; url: string; descripcion: string; categoria: string };

const VACIO: Borrador = { id: null, nombre: "", url: "", descripcion: "", categoria: "otros" };

/**
 * Los proyectos del jugador. Son varios a propósito: el que vibecodea rara vez
 * tiene uno solo, y con uno por persona el que ya había cargado no tenía forma
 * ni de sumar el segundo ni de corregir el primero.
 */
export function MisProyectos({
  userId,
  nombre,
  handle,
  onHandle,
}: {
  userId: string;
  nombre: string;
  handle: string | null;
  onHandle: (h: string) => void;
}) {
  const [proyectos, setProyectos] = useState<MiProyecto[] | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    fetchMisProyectos(sb, userId)
      .then(setProyectos)
      .catch(() => setProyectos([]));
  }, [userId]);

  const miUrl = handle ? `${SITIO}/u/${handle}` : null;
  const lleno = (proyectos?.length ?? 0) >= TOPE_PROYECTOS;

  const guardar = async () => {
    const sb = getSupabase();
    if (!sb || !borrador) return;
    setGuardando(true);
    setAviso(null);
    try {
      // el handle es la dirección de su página, así que tiene que existir
      // antes del primer proyecto
      const h = await asegurarHandle(sb, userId, nombre, handle);
      if (h !== handle) onHandle(h);
      await guardarProyecto(sb, userId, borrador.id, borrador);
      setProyectos(await fetchMisProyectos(sb, userId));
      setBorrador(null);
      setAviso(borrador.id ? "Listo, ya está actualizado." : "Listo, ya aparece en la comunidad.");
    } catch (e) {
      setAviso((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    setGuardando(true);
    try {
      await borrarProyecto(sb, userId, id);
      setProyectos(await fetchMisProyectos(sb, userId));
      setConfirmando(null);
      setAviso("Borrado. Los votos que tenía se van con él.");
    } catch (e) {
      setAviso((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card
      className="mb-3"
      title="Mis proyectos"
      right={
        !borrador && !lleno ? (
          <Btn size="sm" variant="amber" onClick={() => setBorrador(VACIO)}>
            + Sumar
          </Btn>
        ) : null
      }
    >
      {proyectos === null ? (
        <p className="text-xs text-ink/50">Cargando…</p>
      ) : (
        <>
          {proyectos.length === 0 && !borrador && (
            <div>
              <p className="mb-2 text-[12px] text-ink/65">
                Tu proyecto real, no el del juego. Te armamos una página con tu mejor partida al lado, para que la
                compartas.
              </p>
              <Btn size="sm" variant="amber" onClick={() => setBorrador(VACIO)}>
                Sumar mi proyecto
              </Btn>
            </div>
          )}

          {proyectos.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {proyectos.map((x) => {
                const cat = categoriaDe(x.categoria);
                return (
                  <li key={x.id} className="flex items-start gap-2.5 rounded-xl bg-sand/50 px-2.5 py-2">
                    <IconoProyecto nombre={x.nombre} url={x.url} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="truncate text-sm font-black">{x.nombre}</span>
                        <span className="shrink-0 rounded-full bg-ink/10 px-1.5 py-0.5 text-[9px] font-black text-ink/55">
                          {cat.icono} {cat.nombre}
                        </span>
                      </div>
                      {x.descripcion && <div className="truncate text-[11px] text-ink/55">{x.descripcion}</div>}
                      {x.url && <div className="truncate text-[11px] font-bold text-indigo">{dominioDe(x.url)}</div>}
                    </div>
                    {confirmando === x.id ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => borrar(x.id)}
                          disabled={guardando}
                          className="rounded-lg border-2 border-red bg-red/10 px-2 py-0.5 text-[10px] font-black text-red"
                        >
                          Borrar
                        </button>
                        <button
                          onClick={() => setConfirmando(null)}
                          className="rounded-lg border-2 border-ink/15 px-2 py-0.5 text-[10px] font-black text-ink/55"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() =>
                            setBorrador({
                              id: x.id,
                              nombre: x.nombre,
                              url: x.url ?? "",
                              descripcion: x.descripcion ?? "",
                              categoria: x.categoria ?? "otros",
                            })
                          }
                          className="rounded-lg border-2 border-ink/15 bg-white px-2 py-0.5 text-[10px] font-black text-ink/60 hover:border-ink/40"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmando(x.id)}
                          title="Borrar"
                          className="rounded-lg border-2 border-ink/15 bg-white px-2 py-0.5 text-[10px] font-black text-ink/40 hover:border-red hover:text-red"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {borrador && (
            <div className="rounded-xl border-2 border-ink/15 bg-cream/60 p-3">
              <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
                Nombre del proyecto
                <input
                  value={borrador.nombre}
                  onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                  maxLength={40}
                  placeholder="Cuida el Mango"
                  className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo"
                />
              </label>
              <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
                Link
                <input
                  value={borrador.url}
                  onChange={(e) => setBorrador({ ...borrador, url: e.target.value })}
                  maxLength={200}
                  placeholder="cuidaelmango.com"
                  className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo"
                />
              </label>
              <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
                En una línea
                <input
                  value={borrador.descripcion}
                  onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
                  maxLength={140}
                  placeholder="Todas las promos bancarias de Argentina en un lugar"
                  className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo"
                />
              </label>
              <div className="mb-3">
                <span className="mb-1 block text-[11px] font-bold uppercase text-ink/50">Categoría</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBorrador({ ...borrador, categoria: c.id })}
                      className={`rounded-full border-2 px-2.5 py-1 text-[11px] font-black transition ${
                        borrador.categoria === c.id
                          ? "border-ink bg-ink text-cream"
                          : "border-ink/15 bg-white text-ink/60 hover:border-ink/40"
                      }`}
                    >
                      {c.icono} {c.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn className="flex-1" disabled={guardando || !borrador.nombre.trim()} onClick={guardar}>
                  {guardando ? "Guardando…" : "Guardar"}
                </Btn>
                <Btn variant="ghost" onClick={() => setBorrador(null)}>
                  Cancelar
                </Btn>
              </div>
            </div>
          )}

          {lleno && !borrador && (
            <p className="text-[11px] text-ink/45">Llegaste al tope de {TOPE_PROYECTOS}. Borrá uno para sumar otro.</p>
          )}

          {miUrl && !borrador && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-ink/10 pt-3">
              <Link href={`/u/${handle}`} className="btn border-ink/25 bg-white px-3 py-1.5 text-xs">
                Ver mi página
              </Link>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(miUrl).then(() => {
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  });
                }}
              >
                {copiado ? "¡Copiado!" : "🔗 Copiar link"}
              </Btn>
            </div>
          )}
        </>
      )}

      {aviso && <p className="mt-2 text-[11px] font-bold text-green">{aviso}</p>}
    </Card>
  );
}
