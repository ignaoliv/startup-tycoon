"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FormProyecto, type DatosProyecto } from "@/components/FormProyecto";
import { getSupabase, signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import { asegurarHandle, fetchMisProyectos, fetchProfile, guardarProyecto } from "@/lib/storage";
import { SITIO } from "@/lib/seo";

const CLAVE = "startup-tycoon:cartel-proyecto";
const CLAVE_NUNCA = "startup-tycoon:cartel-proyecto-nunca";
/** Si lo cerraron sin tildar nada, no se vuelve a asomar por una semana. */
const DESCANSO_MS = 7 * 864e5;
/** Un cartel encima de una página que todavía está pintando se cierra sin leer. */
const ESPERA_MS = 1400;

const leer = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const anotar = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

const nunca = () => leer(CLAVE_NUNCA) === "1";
const dormido = () => {
  const t = Number(leer(CLAVE));
  return Number.isFinite(t) && t > 0 && Date.now() - t < DESCANSO_MS;
};

/**
 * El cartel que pide el proyecto al entrar.
 *
 * Lo ve todo el mundo, con sesión o sin ella: al que todavía no entró se le
 * ofrece entrar, y vuelve con el formulario abierto. El único que no lo ve es
 * el que ya cargó un proyecto, que no tiene nada que hacer acá.
 *
 * El formulario va adentro del cartel y no en un link a otra pantalla: mandar
 * a alguien a "tu perfil" para que complete algo es donde se cae la mitad.
 */
export function ModalSumaProyecto() {
  const pedido = useSearchParams().get("sumar") === "1";
  const aca = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [handle, setHandle] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listoHandle, setListoHandle] = useState<string | null>(null);
  const [noMostrarMas, setNoMostrarMas] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let vivo = true;
    (async () => {
      // venir de "Sumá tu proyecto" es un pedido explícito y gana sobre
      // cualquier "no me lo muestres" de antes
      if (!pedido && (nunca() || dormido())) return;
      const { data } = await sb.auth.getUser();
      const u = data.user ?? null;
      if (!vivo) return;
      if (u) {
        const [proyectos, perfil] = await Promise.all([
          fetchMisProyectos(sb, u.id).catch(() => []),
          fetchProfile(sb, u.id).catch(() => null),
        ]);
        if (!vivo) return;
        // el que ya cargó no tiene nada que hacer acá
        if (proyectos.length > 0) return;
        setUserId(u.id);
        setNombre(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "Fundador/a");
        setHandle(perfil?.handle ?? null);
      }
      setTimeout(() => vivo && setAbierto(true), pedido ? 0 : ESPERA_MS);
    })();
    return () => {
      vivo = false;
    };
  }, [pedido]);

  const cerrar = useCallback(() => {
    setAbierto(false);
    if (noMostrarMas) anotar(CLAVE_NUNCA, "1");
    else anotar(CLAVE, String(Date.now()));
  }, [noMostrarMas]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  const onGuardar = async (d: DatosProyecto) => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    setGuardando(true);
    setError(null);
    try {
      const h = await asegurarHandle(sb, userId, nombre, handle);
      await guardarProyecto(sb, userId, null, d);
      anotar(CLAVE_NUNCA, "1"); // ya cargó: no se le pregunta nunca más
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

            {userId ? (
              <>
                <FormProyecto guardando={guardando} onGuardar={onGuardar} textoGuardar="Sumar mi proyecto" />
                {error && <p className="mt-2 text-[11px] font-bold text-red">{error}</p>}
              </>
            ) : (
              /* sin sesión no hay dónde guardarlo, así que el cartel ofrece entrar
                 y vuelve acá con el formulario ya abierto */
              <div>
                <p className="mb-3 rounded-xl border-2 border-ink/10 bg-white px-3 py-2.5 text-[12px] text-ink/65">
                  Se vota con vibecoins, que se ganan jugando. El que quiere votos trae gente que juega, no clicks de
                  paso.
                </p>
                <button
                  onClick={() => signInWithGoogle(`${aca}?sumar=1`)}
                  className="btn w-full justify-center border-ink bg-amber px-4 py-3 text-sm text-ink"
                >
                  Entrar con Google y sumarlo
                </button>
                <Link
                  href="/comunidad"
                  onClick={cerrar}
                  className="mt-2 block text-center text-[11px] font-bold text-ink/45 underline"
                >
                  Ver primero lo que hay
                </Link>
              </div>
            )}

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-[11px] font-bold text-ink/45">
              <input
                type="checkbox"
                checked={noMostrarMas}
                onChange={(e) => setNoMostrarMas(e.target.checked)}
                className="h-3.5 w-3.5 accent-indigo"
              />
              No mostrarme esto de nuevo
            </label>
            <button onClick={cerrar} className="mt-1 w-full text-[11px] font-bold text-ink/40 underline">
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
