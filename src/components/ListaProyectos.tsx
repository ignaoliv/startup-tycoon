"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Btn } from "@/components/ui";
import { getSupabase, signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import { fetchMisVotos, fetchVibecoins, TOPE_VOTOS_POR_PROYECTO, votarProyecto } from "@/lib/storage";
import { plataCorta } from "@/lib/compartir";
import { dominioDe, urlProyecto, type ProyectoListado, type Vibecoins } from "@/lib/perfil";

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
        [...f.map((p) => (p.user_id === target ? { ...p, votos: p.votos + 1 } : p))].sort((a, b) => b.votos - a.votos),
      );
    }
    setVotando(null);
  };

  const sinMonedas = !!coins && coins.saldo <= 0;

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

      <ul className="space-y-2">
        {filas.map((p, i) => {
          const link = urlProyecto(p.proyecto_url);
          const dominio = dominioDe(p.proyecto_url);
          const propio = p.user_id === userId;
          return (
            <li key={p.user_id} className="rounded-2xl border-2 border-ink/10 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-1 w-6 shrink-0 text-center text-sm font-black tabular-nums text-ink/35">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-black leading-tight">{p.proyecto}</div>
                  {p.proyecto_desc && <p className="mt-0.5 text-sm text-ink/65">{p.proyecto_desc}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
                    <Link href={`/u/${p.handle}`} className="text-ink/60 underline underline-offset-2 hover:text-ink">
                      {p.display_name ?? p.handle}
                    </Link>
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer" className="text-indigo underline underline-offset-2">
                        🔗 {dominio}
                      </a>
                    )}
                    {p.mejor_valuacion ? (
                      <span className="text-ink/45">su mejor startup valió {plataCorta(Number(p.mejor_valuacion))}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div className="rounded-xl border-2 border-ink/15 bg-cream px-2.5 py-1 text-center">
                    <div className="text-base font-black leading-none tabular-nums">{p.votos}</div>
                    <div className="text-[9px] font-black uppercase tracking-wide text-ink/45">🪙</div>
                  </div>
                  {userId && !propio && (() => {
                    const dados = mios[p.user_id] ?? 0;
                    const tipo = monedaParaUsar(p.user_id);
                    const enElTope = dados >= TOPE_VOTOS_POR_PROYECTO;
                    return (
                      <button
                        onClick={() => votar(p.user_id)}
                        disabled={votando === p.user_id || !tipo}
                        className={`rounded-lg border-2 px-2 py-0.5 text-[11px] font-black transition disabled:opacity-40 ${
                          tipo === "invitacion"
                            ? "border-indigo/40 bg-indigo/10 hover:border-indigo"
                            : "border-ink/20 bg-white hover:border-amber hover:bg-amber/15"
                        }`}
                        title={
                          tipo === "invitacion"
                            ? "Usás una moneda de invitación, que no tiene tope"
                            : tipo === "juego"
                              ? "Darle una moneda"
                              : enElTope
                                ? `Ya le diste ${TOPE_VOTOS_POR_PROYECTO}. Invitá gente para poder darle más.`
                                : "Te quedaste sin vibecoins"
                        }
                      >
                        {votando === p.user_id ? "…" : !tipo && enElTope ? `${dados}/${TOPE_VOTOS_POR_PROYECTO}` : "+1"}
                      </button>
                    );
                  })()}
                  {userId && !propio && (mios[p.user_id] ?? 0) > 0 && (mios[p.user_id] ?? 0) < TOPE_VOTOS_POR_PROYECTO && (
                    <span className="text-[9px] font-bold text-ink/40">
                      diste {mios[p.user_id]}/{TOPE_VOTOS_POR_PROYECTO}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
