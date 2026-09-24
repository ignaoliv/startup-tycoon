"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Btn } from "@/components/ui";
import { IconoProyecto } from "@/components/IconoProyecto";
import { getSupabase, signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import { fetchMisVotos, fetchVibecoins, TOPE_VOTOS_POR_PROYECTO, votarProyecto } from "@/lib/storage";
import { plataCorta } from "@/lib/compartir";
import { categoriaDe, dominioDe, urlProyecto, type ProyectoListado, type Vibecoins } from "@/lib/perfil";

/** Cuántos proyectos hacen falta para que el podio y los filtros tengan sentido. */
const MINIMO_PODIO = 3;
const MINIMO_FILTROS = 8;

const MEDALLAS = ["🥇", "🥈", "🥉"];

/**
 * El ranking de proyectos. Se vota con vibecoins, que se ganan jugando: por eso
 * el que quiere votos manda a su gente a jugar, y no a hacer click y rajar.
 */
export function ListaProyectos({ iniciales }: { iniciales: ProyectoListado[] }) {
  const [filas, setFilas] = useState(iniciales);
  const [userId, setUserId] = useState<string | null>(null);
  const [coins, setCoins] = useState<Vibecoins | null>(null);
  const [mios, setMios] = useState<Record<string, number>>({});
  const [votando, setVotando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) {
        fetchVibecoins(sb, id).then(setCoins).catch(() => {});
        fetchMisVotos(sb, id).then(setMios).catch(() => {});
      }
    });
  }, []);

  /**
   * Primero se gastan las de juego, que son las que caducan contra el tope de 3.
   * Las de invitación quedan para cuando el tope ya no deja, que es justamente
   * para lo que sirven.
   */
  const monedaParaUsar = (target: string): "juego" | "invitacion" | null => {
    if (!coins) return null;
    const dadas = mios[target] ?? 0;
    if (coins.saldo_juego > 0 && dadas < TOPE_VOTOS_POR_PROYECTO) return "juego";
    if (coins.saldo_invitacion > 0) return "invitacion";
    return null;
  };

  const votar = async (target: string) => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    const tipo = monedaParaUsar(target);
    if (!tipo) return;
    setVotando(target);
    setAviso(null);
    const error = await votarProyecto(sb, userId, target, tipo);
    if (error) {
      setAviso(error);
      fetchVibecoins(sb, userId).then(setCoins).catch(() => {});
      fetchMisVotos(sb, userId).then(setMios).catch(() => {});
    } else {
      setCoins((c) =>
        !c
          ? c
          : tipo === "juego"
            ? { ...c, saldo_juego: c.saldo_juego - 1, saldo: c.saldo - 1 }
            : { ...c, saldo_invitacion: c.saldo_invitacion - 1, saldo: c.saldo - 1 },
      );
      if (tipo === "juego") setMios((m) => ({ ...m, [target]: (m[target] ?? 0) + 1 }));
      setFilas((f) =>
        [...f.map((p) => (p.user_id === target ? { ...p, votos: p.votos + 1, votos_semana: p.votos_semana + 1 } : p))]
          .sort((a, b) => b.votos - a.votos),
      );
    }
    setVotando(null);
  };

  const sinMonedas = !!coins && coins.saldo <= 0;

  // Las categorías que existen de verdad. Una lista fija mostraría siete
  // filtros vacíos y uno con todo adentro.
  const categorias = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const p of filas) cuenta.set(p.categoria, (cuenta.get(p.categoria) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  }, [filas]);

  const visibles = filtro ? filas.filter((p) => p.categoria === filtro) : filas;
  // El podio se arma sobre la lista entera: filtrando, "el primero de fintech"
  // no es un podio, es el orden de siempre con menos filas.
  const hayPodio = !filtro && visibles.length >= MINIMO_PODIO;
  const podio = hayPodio ? visibles.slice(0, 3) : [];
  const resto = hayPodio ? visibles.slice(3) : visibles;

  const votoDe = (p: ProyectoListado) => ({
    dados: mios[p.user_id] ?? 0,
    tipo: monedaParaUsar(p.user_id),
    propio: p.user_id === userId,
  });

  const BotonVoto = ({ p, grande }: { p: ProyectoListado; grande?: boolean }) => {
    const { dados, tipo, propio } = votoDe(p);
    if (!userId || propio) return null;
    const enElTope = dados >= TOPE_VOTOS_POR_PROYECTO;
    return (
      <button
        onClick={() => votar(p.user_id)}
        disabled={votando === p.user_id || !tipo}
        title={
          tipo === "invitacion"
            ? "Usás una moneda de invitación, que no tiene tope"
            : tipo === "juego"
              ? "Darle una vibecoin"
              : enElTope
                ? `Ya le diste ${TOPE_VOTOS_POR_PROYECTO}. Invitá gente para poder darle más.`
                : "Te quedaste sin vibecoins"
        }
        className={`btn shrink-0 whitespace-nowrap font-black transition disabled:opacity-40 ${
          grande ? "px-3.5 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
        } ${
          tipo === "invitacion"
            ? "border-indigo bg-indigo/10 text-indigo"
            : "border-ink bg-amber text-ink hover:brightness-105"
        }`}
      >
        {votando === p.user_id ? "…" : !tipo && enElTope ? `${dados}/${TOPE_VOTOS_POR_PROYECTO}` : "🪙 +1"}
      </button>
    );
  };

  return (
    <>
      {/* la billetera, arriba de la lista: es lo que habilita todo lo de abajo */}
      {supabaseEnabled() && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-amber bg-amber/10 px-4 py-3">
          <span className="text-2xl leading-none">🪙</span>
          {userId ? (
            <div className="min-w-0 flex-1">
              <div className="text-lg font-black leading-none tabular-nums">
                {coins?.saldo ?? "…"} <span className="text-xs font-bold text-ink/55">vibecoins</span>
              </div>
              <div className="mt-0.5 text-[11px] text-ink/55">
                {sinMonedas
                  ? "Jugá una partida para conseguir más."
                  : coins && coins.saldo_invitacion > 0
                    ? `${coins.saldo_juego} de jugar (máx. ${TOPE_VOTOS_POR_PROYECTO} por proyecto) y ${coins.saldo_invitacion} de invitar, que van donde quieras.`
                    : `Cada voto cuesta una, hasta ${TOPE_VOTOS_POR_PROYECTO} por proyecto.`}{" "}
                <Link href="/vibecoins" className="underline underline-offset-2 hover:text-ink">
                  Cómo funcionan
                </Link>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold">Para votar hace falta jugar.</div>
              <div className="mt-0.5 text-[11px] text-ink/55">
                Terminar una partida da 1 vibecoin, ganarla da 2.{" "}
                <Link href="/vibecoins" className="underline underline-offset-2 hover:text-ink">
                  Cómo funcionan
                </Link>
              </div>
            </div>
          )}
          {userId ? (
            <Link href="/play" className="btn shrink-0 border-ink bg-amber px-3 py-1.5 text-xs text-ink">
              🚀 Jugar
            </Link>
          ) : (
            <Btn size="sm" variant="ghost" className="shrink-0" onClick={() => signInWithGoogle("/proyectos")}>
              Entrar
            </Btn>
          )}
        </div>
      )}

      {aviso && (
        <p className="mb-3 rounded-xl border-2 border-red bg-red/10 px-3 py-2 text-xs font-bold text-red">{aviso}</p>
      )}

      {/* en el celular ocho filtros envueltos son tres renglones antes del primer
          proyecto, así que van en una tira que se arrastra */}
      {filas.length >= MINIMO_FILTROS && categorias.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip activo={filtro === null} onClick={() => setFiltro(null)}>
            Todos <span className="opacity-50">{filas.length}</span>
          </Chip>
          {categorias.map(([id, n]) => {
            const c = categoriaDe(id);
            return (
              <Chip key={id} activo={filtro === id} onClick={() => setFiltro(filtro === id ? null : id)}>
                {c.icono} {c.nombre} <span className="opacity-50">{n}</span>
              </Chip>
            );
          })}
        </div>
      )}

      {podio.length > 0 && (
        <ul className="mb-5 space-y-2.5">
          {podio.map((p, i) => (
            <li
              key={p.user_id}
              className={`rounded-2xl border-2 p-4 shadow-sm ${
                i === 0 ? "border-amber bg-amber/10" : "border-ink/15 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-2xl leading-none">{MEDALLAS[i]}</span>
                <IconoProyecto nombre={p.proyecto} url={p.proyecto_url} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-lg font-black leading-tight">{p.proyecto}</span>
                    <Etiqueta id={p.categoria} />
                  </div>
                  {p.proyecto_desc && <p className="mt-0.5 text-sm leading-snug text-ink/65">{p.proyecto_desc}</p>}
                  <Link
                    href={`/u/${p.handle}`}
                    className="mt-1 inline-block text-[11px] font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
                  >
                    por {p.display_name ?? p.handle}
                  </Link>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 divide-x-2 divide-ink/10 rounded-xl border-2 border-ink/10 bg-white/70">
                <Dato valor={String(p.votos)} label="vibecoins" />
                <Dato
                  valor={p.mejor_valuacion ? plataCorta(Number(p.mejor_valuacion)) : "—"}
                  label="mejor partida"
                />
                <Dato valor={p.votos_semana ? `+${p.votos_semana}` : "—"} label="esta semana" />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <Acciones p={p} />
                <BotonVoto p={p} grande />
              </div>
            </li>
          ))}
        </ul>
      )}

      {resto.length > 0 && (
        <>
          {podio.length > 0 && (
            <div className="mb-2 flex items-center gap-3">
              <div className="h-0.5 flex-1 bg-ink/10" />
              <span className="text-[10px] font-black uppercase tracking-wide text-ink/40">Resto del ranking</span>
              <div className="h-0.5 flex-1 bg-ink/10" />
            </div>
          )}
          <ul className="divide-y-2 divide-ink/5 overflow-hidden rounded-2xl border-2 border-ink/10 bg-white">
            {resto.map((p, i) => (
              <li key={p.user_id} className="flex items-start gap-3 px-3 py-3">
                <span className="mt-2 w-6 shrink-0 text-center text-xs font-black tabular-nums text-ink/35">
                  {podio.length + i + 1}
                </span>
                <IconoProyecto nombre={p.proyecto} url={p.proyecto_url} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate text-sm font-black leading-tight">{p.proyecto}</span>
                    <Etiqueta id={p.categoria} />
                  </div>
                  {p.proyecto_desc && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink/60">{p.proyecto_desc}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold text-ink/45">
                    <span className="tabular-nums text-ink/70">🪙 {p.votos}</span>
                    <Link href={`/u/${p.handle}`} className="underline underline-offset-2 hover:text-ink">
                      {p.display_name ?? p.handle}
                    </Link>
                    <Acciones p={p} compacto />
                  </div>
                </div>
                <div className="mt-1 shrink-0">
                  <BotonVoto p={p} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {visibles.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/55">
          No hay proyectos en esa categoría todavía.
        </p>
      )}
    </>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-[11px] font-black transition ${
        activo ? "border-ink bg-ink text-cream" : "border-ink/15 bg-white text-ink/60 hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

function Etiqueta({ id }: { id: string }) {
  const c = categoriaDe(id);
  return (
    <span className="shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-black text-ink/55">
      {c.icono} {c.nombre}
    </span>
  );
}

function Dato({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="px-2 py-2 text-center">
      <div className="text-base font-black leading-none tabular-nums">{valor}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-ink/40">{label}</div>
    </div>
  );
}

/** Ir al sitio del proyecto, que es el motivo por el que alguien lo carga. */
function Acciones({ p, compacto }: { p: ProyectoListado; compacto?: boolean }) {
  const link = urlProyecto(p.proyecto_url);
  const dominio = dominioDe(p.proyecto_url);
  if (!link) return null;
  if (compacto) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="text-indigo underline underline-offset-2">
        {dominio} ↗
      </a>
    );
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="btn max-w-[60%] truncate border-ink/25 bg-white px-3 py-2 text-xs"
    >
      {dominio} ↗
    </a>
  );
}
