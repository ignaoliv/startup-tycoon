"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";
import { getSupabase, signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import { fetchLeaderboard, fetchMisRuns, fetchProfile, fetchRankingRuns, limpiarHandle, saveProfileLinks, urlLinkedin, urlX, type LeaderRow, type Perfil, type RunRanking } from "@/lib/storage";
import { calcularCarrera, conseguido, GRUPOS, LOGROS, type Carrera, type RunResumen } from "@/lib/logros";
import { money, num } from "@/lib/game/format";
import { SECTORS } from "@/lib/game/data";

type Tab = "vivo" | "semana" | "historico";

const FINAL: Record<string, { txt: string; tone: "good" | "bad" | "ink" }> = {
  ipo: { txt: "IPO", tone: "good" },
  acquired: { txt: "Exit", tone: "good" },
  bankrupt: { txt: "Quiebra", tone: "bad" },
  fired: { txt: "Te echaron", tone: "bad" },
  abandoned: { txt: "Abandonada", tone: "ink" },
};

const sectorNombre = (id: string) => SECTORS.find((s) => s.id === id)?.name ?? id;
const sectorIcono = (id: string) => SECTORS.find((s) => s.id === id)?.icon ?? "•";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [listo, setListo] = useState(false);
  const [runs, setRuns] = useState<(RunResumen & { id: string; name: string; idea: string | null })[]>([]);
  const [tab, setTab] = useState<Tab>("semana");
  const [vivo, setVivo] = useState<LeaderRow[] | null>(null);
  const [semana, setSemana] = useState<RunRanking[] | null>(null);
  const [historico, setHistorico] = useState<RunRanking[] | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setListo(true);
      return;
    }
    let vivoAun = true;
    sb.auth.getUser().then(async ({ data }) => {
      if (!vivoAun) return;
      const u = data.user ?? null;
      setUser(u);
      if (u) {
        try {
          setRuns(await fetchMisRuns(sb, u.id));
        } catch (e) {
          console.error(e);
        }
      }
      setListo(true);
    });
    return () => {
      vivoAun = false;
    };
  }, []);

  // cada ranking se pide cuando lo mirás por primera vez
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    if (tab === "vivo" && !vivo) fetchLeaderboard(sb, 50).then(setVivo).catch(console.error);
    if (tab === "semana" && !semana) fetchRankingRuns(sb, 7).then(setSemana).catch(console.error);
    if (tab === "historico" && !historico) fetchRankingRuns(sb).then(setHistorico).catch(console.error);
  }, [tab, vivo, semana, historico]);

  const carrera: Carrera = calcularCarrera(runs);
  const ganados = LOGROS.filter((l) => conseguido(l, carrera)).length;

  if (!listo) return <main className="mx-auto max-w-2xl p-4 text-sm text-ink/50">Cargando…</main>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/" className="text-2xl" aria-label="Inicio">🚀</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">
            {user ? (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Tu carrera") : "Ranking"}
          </h1>
          <p className="text-xs text-ink/50">{user ? "Tu carrera como fundador/a" : "Los mejores de Vibe Coding Game"}</p>
        </div>
        <Link href="/play" className="btn border-ink bg-indigo px-3 py-2 text-sm text-white">Jugar</Link>
      </header>

      {!user && supabaseEnabled() && (
        <Card className="mb-3">
          <div className="mb-1 text-2xl">🏆</div>
          <h2 className="mb-1 text-lg font-black">Entrá para tener tu carrera</h2>
          <p className="mb-3 text-sm text-ink/60">
            Se guardan todas tus partidas, se te desbloquean los {LOGROS.length} logros y entrás al ranking. Jugar sigue sin pedir cuenta.
          </p>
          <Btn className="w-full" onClick={() => signInWithGoogle("/home")}>Entrar con Google</Btn>
        </Card>
      )}

      {user && <MiPerfil userId={user.id} nombre={user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Fundador/a"} avatar={user.user_metadata?.avatar_url ?? user.user_metadata?.picture} />}

      {user && (
        <>
          <Card title="Tu carrera" className="mb-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <KPI label="Partidas" value={String(carrera.partidas)} />
              <KPI label="Ganadas" value={String(carrera.ganadas)} sub={carrera.partidas ? `${Math.round((carrera.ganadas / carrera.partidas) * 100)}% de éxito` : undefined} />
              <KPI label="Mejor valuación" value={money(carrera.mejorValuacion)} />
              <KPI label="Logros" value={`${ganados}/${LOGROS.length}`} />
            </div>
            {carrera.partidas === 0 && (
              <p className="mt-3 text-xs text-ink/50">Todavía no terminaste ninguna partida. Se cuentan cuando llegan al final (o cuando las abandonás con más de 10 días).</p>
            )}
          </Card>

          <Card title={`Logros · ${ganados} de ${LOGROS.length}`} className="mb-3">
            <Bar value={ganados} max={LOGROS.length} color="bg-amber" className="mb-3" />
            {GRUPOS.map((g) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-ink/40">{g}</div>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {LOGROS.filter((l) => l.grupo === g).map((l) => {
                    const ok = conseguido(l, carrera);
                    const val = l.valor(carrera);
                    return (
                      <li key={l.id} className={`rounded-xl px-2.5 py-2 ${ok ? "bg-amber/25" : "bg-ink/5"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ok ? l.icon : "🔒"}</span>
                          <div className="min-w-0 flex-1">
                            <div className={`truncate text-[13px] ${ok ? "font-black" : "font-bold text-ink/50"}`}>{l.name}</div>
                            <div className="truncate text-[10px] text-ink/50">{l.desc}</div>
                          </div>
                          {!ok && l.meta > 1 && (
                            <span className="shrink-0 text-[10px] font-bold tabular-nums text-ink/40">
                              {val >= 1000 ? num(val) : val}/{l.meta >= 1000 ? num(l.meta) : l.meta}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Card>

          <Card title={`Tus startups · ${runs.length}`} className="mb-3">
            {runs.length === 0 ? (
              <p className="text-xs text-ink/50">Acá van a aparecer todas tus partidas terminadas.</p>
            ) : (
              <ul className="space-y-1.5">
                {runs.map((r) => {
                  const f = FINAL[r.ended_as] ?? { txt: r.ended_as, tone: "ink" as const };
                  return (
                    <li key={r.id} className="flex items-center gap-2 rounded-xl bg-sand/60 px-2.5 py-2">
                      <span className="text-lg">{sectorIcono(r.sector)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black">{r.name}</div>
                        <div className="truncate text-[11px] text-ink/50">
                          {sectorNombre(r.sector)} · día {r.day} · {num(r.peak_users)} usuarios
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-black tabular-nums">{money(r.valuation)}</div>
                        <Pill tone={f.tone}>{f.txt}</Pill>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      <Card title="Ranking">
        <div className="mb-3 flex gap-1 rounded-xl bg-ink/5 p-1">
          {(["vivo", "semana", "historico"] as Tab[]).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg py-1.5 text-xs font-black transition ${tab === k ? "bg-white shadow" : "text-ink/50"}`}>
              {k === "vivo" ? "🔥 En vivo" : k === "semana" ? "📅 Semana" : "🏆 Histórico"}
            </button>
          ))}
        </div>
        <p className="mb-2 text-[11px] text-ink/50">
          {tab === "vivo"
            ? "Startups en juego ahora mismo, por valuación."
            : tab === "semana"
            ? "Las mejores partidas terminadas en los últimos 7 días. Arranca de cero cada semana."
            : "Salón de la fama: las mejores partidas terminadas de todos los tiempos."}
        </p>
        {tab === "vivo" ? (
          <ListaVivo filas={vivo} yo={user?.id} />
        ) : (
          <ListaRuns filas={tab === "semana" ? semana : historico} yo={user?.id} />
        )}
      </Card>

      <SiteFooter />
    </main>
  );
}

/** Perfil del jugador: sus redes quedan visibles en el ranking y en su startup. */
function MiPerfil({ userId, nombre, avatar }: { userId: string; nombre: string; avatar?: string }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [tw, setTw] = useState("");
  const [li, setLi] = useState("");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    fetchProfile(sb, userId)
      .then((p) => {
        setPerfil(p);
        setTw(p?.twitter ?? "");
        setLi(p?.linkedin ?? "");
      })
      .catch(console.error);
  }, [userId]);

  const guardar = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setGuardando(true);
    setAviso(null);
    try {
      const twitter = limpiarHandle(tw, "x");
      const linkedin = limpiarHandle(li, "linkedin");
      await saveProfileLinks(sb, userId, { twitter, linkedin });
      setTw(twitter);
      setLi(linkedin);
      setPerfil((p) => (p ? { ...p, twitter, linkedin } : p));
      setEditando(false);
      setAviso("Listo, ya se ven en el ranking.");
    } catch (e) {
      setAviso((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const guardadas = perfil?.twitter || perfil?.linkedin;

  return (
    <Card className="mb-3" title="Mi perfil" right={!editando ? <Btn size="sm" variant="ghost" onClick={() => setEditando(true)}>{guardadas ? "Editar" : "Agregar redes"}</Btn> : null}>
      <div className="mb-2 flex items-center gap-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" width={44} height={44} className="rounded-full" />
        ) : (
          <span className="text-3xl">👤</span>
        )}
        <div className="min-w-0">
          <div className="truncate text-base font-black">{nombre}</div>
          {!editando &&
            (guardadas ? (
              <div className="flex gap-3 text-xs font-bold">
                {perfil?.twitter && (
                  <a href={urlX(perfil.twitter)} target="_blank" rel="noreferrer" className="text-indigo underline">
                    𝕏 @{perfil.twitter}
                  </a>
                )}
                {perfil?.linkedin && (
                  <a href={urlLinkedin(perfil.linkedin)} target="_blank" rel="noreferrer" className="text-indigo underline">
                    in/{perfil.linkedin}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-xs text-ink/50">Sumá tus redes para que te encuentren desde el ranking.</div>
            ))}
        </div>
      </div>

      {editando && (
        <>
          <p className="mb-2 text-[11px] text-ink/60">Podés pegar el link completo o solo el usuario.</p>
          <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
            X (Twitter)
            <input value={tw} onChange={(e) => setTw(e.target.value)} placeholder="nacho_olivieri" className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo" />
          </label>
          <label className="mb-3 block text-[11px] font-bold uppercase text-ink/50">
            LinkedIn
            <input value={li} onChange={(e) => setLi(e.target.value)} placeholder="ignacio-olivieri" className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo" />
          </label>
          <div className="flex gap-2">
            <Btn className="flex-1" disabled={guardando} onClick={guardar}>
              {guardando ? "Guardando…" : "Guardar"}
            </Btn>
            <Btn variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Btn>
          </div>
        </>
      )}
      {aviso && <p className="mt-2 text-[11px] font-bold text-green">{aviso}</p>}
    </Card>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-white px-2 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink/50">{label}</div>
      <div className="truncate text-lg font-black tabular-nums">{value}</div>
      {sub && <div className="truncate text-[10px] text-ink/50">{sub}</div>}
    </div>
  );
}

function Puesto({ n }: { n: number }) {
  const medalla = n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : null;
  return <span className="w-7 shrink-0 text-center text-xs font-black tabular-nums text-ink/40">{medalla ?? n}</span>;
}

function ListaVivo({ filas, yo }: { filas: LeaderRow[] | null; yo?: string }) {
  if (!filas) return <p className="text-xs text-ink/50">Cargando…</p>;
  if (!filas.length) return <p className="text-xs text-ink/50">Todavía no hay startups en juego.</p>;
  return (
    <ul className="space-y-1">
      {filas.map((r, i) => (
        <li key={r.user_id} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${r.user_id === yo ? "bg-indigo/10 ring-2 ring-indigo/30" : "bg-ink/5"}`}>
          <Puesto n={i + 1} />
          <span>{sectorIcono(r.sector)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black">{r.name}</div>
            <div className="truncate text-[10px] text-ink/50">{r.display_name} · día {r.day}</div>
          </div>
          <span className="shrink-0 text-xs font-black tabular-nums">{money(r.valuation)}</span>
        </li>
      ))}
    </ul>
  );
}

function ListaRuns({ filas, yo }: { filas: RunRanking[] | null; yo?: string }) {
  if (!filas) return <p className="text-xs text-ink/50">Cargando…</p>;
  if (!filas.length) return <p className="text-xs text-ink/50">Todavía no hay partidas terminadas acá. Podés ser el primero.</p>;
  return (
    <ul className="space-y-1">
      {filas.map((r, i) => {
        const f = FINAL[r.ended_as] ?? { txt: r.ended_as, tone: "ink" as const };
        return (
          <li key={r.id} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${r.user_id === yo ? "bg-indigo/10 ring-2 ring-indigo/30" : "bg-ink/5"}`}>
            <Puesto n={i + 1} />
            <span>{sectorIcono(r.sector)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-black">{r.name}</div>
              <div className="truncate text-[10px] text-ink/50">{r.display_name ?? "Alguien"} · día {r.day}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs font-black tabular-nums">{money(r.valuation)}</div>
              <Pill tone={f.tone}>{f.txt}</Pill>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
