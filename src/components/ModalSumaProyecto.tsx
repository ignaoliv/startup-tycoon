"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormProyecto, type DatosProyecto } from "@/components/FormProyecto";
import { getSupabase, signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import { asegurarHandle, fetchMisProyectos, fetchProfile, guardarProyecto } from "@/lib/storage";
import { SITIO } from "@/lib/seo";

const CLAVE = "startup-tycoon:cartel-proyecto";
/** Si lo cerraron, no se vuelve a asomar por una semana. */
const DESCANSO_MS = 7 * 864e5;
/** Un cartel encima de una página que todavía está pintando se cierra sin leer. */
const ESPERA_MS = 1400;

function dormido() {
  try {
    const t = Number(localStorage.getItem(CLAVE));
    return Number.isFinite(t) && Date.now() - t < DESCANSO_MS;
  } catch {
    return false;
  }
}

function dormir() {
  try {
    localStorage.setItem(CLAVE, String(Date.now()));
  } catch {}
}

/**
 * El cartel que pide el proyecto al entrar, a quien todavía no cargó ninguno.
 *
 * El formulario va adentro del cartel y no en un link a otra pantalla: mandar
 * a alguien a "tu perfil" para que complete algo es donde se cae la mitad.
 */
export function ModalSumaProyecto() {
  const pedido = useSearchParams().get("sumar") === "1";
  const [abierto, setAbierto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [handle, setHandle] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listoHandle, setListoHandle] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let vivo = true;
    (async () => {
      const { data } = await sb.auth.getUser();
      const u = data.user;
      // sin sesión no sabemos si ya tiene proyecto, así que no molestamos:
      // el que llega de afuera primero mira, y el botón lo manda a entrar
      if (!vivo || !u) return;
      setUserId(u.id);
      setNombre(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "Fundador/a");
      const [proyectos, perfil] = await Promise.all([
        fetchMisProyectos(sb, u.id).catch(() => []),
        fetchProfile(sb, u.id).catch(() => null),
      ]);
      if (!vivo) return;
      setHandle(perfil?.handle ?? null);
      if (proyectos.length > 0) return;
      // venir de "Sumá tu proyecto" es un pedido explícito: se abre aunque lo
      // hayan cerrado antes
      if (!pedido && dormido()) return;
      setTimeout(() => vivo && setAbierto(true), pedido ? 0 : ESPERA_MS);
    })();
    return () => {
      vivo = false;
    };
  }, [pedido]);

  const cerrar = useCallback(() => {
    setAbierto(false);
    dormir();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  const guardar = async (d: DatosProyecto) => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    setGuardando(true);
    setError(null);
    try {
      const h = await asegurarHandle(sb, userId, nombre, handle);
      await guardarProyecto(sb, userId, null, d);
      dormir();
      setListoHandle(h);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (!supabaseEnabled() || !abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center"
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-ink bg-cream p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {listoHandle ? (
          <div className="text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <h2 className="text-xl font-black leading-tight">Ya estás en la comunidad</h2>
            <p className="mt-1 text-sm text-ink/65">
              Tu proyecto aparece con tu mejor partida al lado. Compartí el link y que te voten.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/u/${listoHandle}`}
                className="btn justify-center border-ink bg-amber px-4 py-2.5 text-sm text-ink"
              >
                Ver mi página
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${SITIO}/u/${listoHandle}`).catch(() => {});
                }}
                className="btn justify-center border-ink/25 bg-white px-4 py-2.5 text-sm"
              >
                🔗 Copiar mi link
              </button>
              <button onClick={() => setAbierto(false)} className="text-xs font-bold text-ink/45 underline">
                Seguir mirando
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black leading-tight">¿Qué estás vibecodeando?</h2>
                <p className="mt-1 text-[13px] text-ink/65">
                  Tu proyecto real, no el del juego. Te queda una página con tu mejor partida al lado, y entra al
                  ranking de la comunidad.
                </p>
              </div>
              <button
                onClick={cerrar}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-ink/40 hover:bg-ink/5 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <FormProyecto guardando={guardando} onGuardar={guardar} textoGuardar="Sumar mi proyecto" />
            {error && <p className="mt-2 text-[11px] font-bold text-red">{error}</p>}
            <button onClick={cerrar} className="mt-3 w-full text-[11px] font-bold text-ink/40 underline">
              Ahora no
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** El botón de la portada de la comunidad: sin sesión manda a entrar y vuelve acá con el cartel abierto. */
export function BotonSumarProyecto({ className, children }: { className?: string; children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (userId) {
    return (
      <Link href="/home?s=perfil" className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={() => signInWithGoogle("/comunidad?sumar=1")} className={className}>
      {children}
    </button>
  );
}
