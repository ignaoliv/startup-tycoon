"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/panels/Dashboard";
import { TeamPanel } from "@/components/panels/TeamPanel";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { MoneyPanel } from "@/components/panels/MoneyPanel";
import { SocialPanel } from "@/components/panels/SocialPanel";
import { Btn, Card, Stat } from "@/components/ui";
import { Tour, isTourDone } from "@/components/Tour";
import { Confeti } from "@/components/Confeti";
import { EscenaMudanza } from "@/components/EscenaMudanza";
import { escenaDe } from "@/lib/game/escenas";
import { AuthButton } from "@/components/AuthButton";
import { signInWithGoogle, supabaseEnabled } from "@/lib/supabase/client";
import FeedbackModal from "@/components/FeedbackModal";
import { trackRun } from "@/lib/analytics";
import { EVENTS, SECTORS, STAGES } from "@/lib/game/data";
import { derive, diasQueQuedan, factorVentana, pisoHype, randomIdea, randomStartupName, resolveEvent } from "@/lib/game/engine";
import { tuning } from "@/lib/game/tuning";
import { money, num } from "@/lib/game/format";
import { useGame } from "@/hooks/useGame";
import { asegurarRunGuardada, buildRun, createPost, marcarLoginEnCurso } from "@/lib/storage";
import { textoParaCompartir } from "@/lib/compartir";
import { playerId } from "@/lib/analytics";

type Tab = "office" | "team" | "product" | "money" | "social";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "office", label: "Oficina", icon: "🏢" },
  { id: "team", label: "Equipo", icon: "🧑‍🤝‍🧑" },
  { id: "product", label: "Producto", icon: "🛠️" },
  { id: "money", label: "Plata", icon: "💸" },
  { id: "social", label: "Social", icon: "🌍" },
];

export function GameShell() {
  const params = useSearchParams();
  const router = useRouter();
  const forceLocal = params.get("local") === "1";
  const game = useGame(forceLocal);
  const [tab, setTab] = useState<Tab>("office");
  const [menu, setMenu] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [tour, setTour] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // el link de la partida solo sirve si la fila ya está en la base: si el
  // jugador no tiene sesión puede estar esperando en el navegador
  const prepararLink = async () => {
    const s = game.state;
    if (!s || !game.sb) return null;
    const ok = await asegurarRunGuardada(game.sb, buildRun(s, derive(s), s.gameOver ?? "abandoned"), game.userId, playerId());
    return ok ? `${window.location.origin}/p/${s.id}` : null;
  };
  const [feedback, setFeedback] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [escena, setEscena] = useState<number | null>(null);
  // El header es sticky y cambia de alto (la cuenta regresiva suma una línea),
  // así que las pestañas se pegan a la altura que tenga en cada momento. Va
  // como callback ref y no como useEffect porque el header todavía no existe
  // en el primer render: ahí arriba el componente sale por la pantalla de carga.
  const [altoHeader, setAltoHeader] = useState(0);
  const observador = useRef<ResizeObserver | null>(null);
  const headerRef = useCallback((el: HTMLElement | null) => {
    observador.current?.disconnect();
    if (!el) return;
    setAltoHeader(el.offsetHeight);
    observador.current = new ResizeObserver(() => setAltoHeader(el.offsetHeight));
    observador.current.observe(el);
  }, []);

  // al mudarse, la escena del acto. Una sola vez por oficina y por partida.
  const oficinaActual = game.state?.office ?? 0;
  useEffect(() => {
    const s = game.state;
    if (!s || oficinaActual === 0) return;
    if (s.escenaVista?.includes(oficinaActual) || !escenaDe(oficinaActual)) return;
    const id = setTimeout(() => {
      game.mutate((st) => void (st.escenaVista = [...(st.escenaVista ?? []), oficinaActual]));
      setEscena(oficinaActual);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oficinaActual]);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const tourChecked = useRef(false);
  const gs = game.state;
  const setPaused = game.setPaused;
  // el tutorial se abre solo en partidas nuevas
  useEffect(() => {
    if (!gs) {
      tourChecked.current = false;
      return;
    }
    if (tourChecked.current) return;
    tourChecked.current = true;
    // se muestra una vez a quien nunca lo vio, tenga la partida que tenga
    if (!isTourDone()) {
      const t = setTimeout(() => setTour(true), 350);
      return () => clearTimeout(t);
    }
  }, [gs]);
  useEffect(() => {
    setPaused(tour || escena !== null);
  }, [tour, escena, setPaused]);
  const { state, derived } = game;

  // auto-post de hitos al muro
  const stageRef = useRef(-1);
  useEffect(() => {
    if (!state || !game.sb || !game.userId) return;
    if (stageRef.current === -1) {
      stageRef.current = state.stage;
      return;
    }
    if (state.stage > stageRef.current) {
      stageRef.current = state.stage;
      createPost(game.sb, game.userId, `🎉 ${state.startupName} cerró su ronda ${STAGES[state.stage].name}. ¡A crecer!`, "milestone").catch(() => {});
    }
  }, [state?.stage, state, game.sb, game.userId]);

  if (!game.loaded)
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm font-bold text-ink/50">
        <span className="animate-pulse">Abriendo la oficina…</span>
      </div>
    );

  if (!state) return <Setup onStart={game.startNew} />;

  const ganaste = state.gameOver === "ipo" || state.gameOver === "acquired";
  const quedan = diasQueQuedan(state);
  // el tinte frío se apaga cuando la ventana vuelve a abrirse: el invierno pasa
  const enInvierno = factorVentana(state) < 0.995;
  const d = derived!;
  // el mismo cálculo que hace el motor: antes era un -0,7 fijo y con el hype
  // en 100 el header decía que subía 7,5 por día mientras no se movía
  const hypeDia = d.mktPts * 0.25 - (0.2 + 1.8 * Math.pow(state.hype / 100, 2));
  // si está contra el techo o contra el piso, el ritmo no se aplica: decirlo,
  // porque un "+5,3/día" con el hype clavado en 100 es una mentira prolija
  const hypeClavado = (state.hype >= 100 && hypeDia > 0) || (state.hype <= pisoHype(state) && hypeDia < 0);
  const ev = state.pendingEvent ? EVENTS.find((e) => e.id === state.pendingEvent!.id) : null;
  const sector = SECTORS.find((s) => s.id === state.sector);

  return (
    <div className={`mx-auto flex min-h-dvh max-w-6xl flex-col ${enInvierno ? "invierno" : ""}`}>
      {/* header */}
      <header ref={headerRef} className="sticky top-0 z-20 border-b-2 border-ink/10 bg-cream/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-black leading-tight">
              {sector?.icon} {state.startupName}
            </div>
            <div className="text-[11px] font-semibold text-ink/50">
              Día {state.day} · {STAGES[state.stage].name} · {game.mode === "cloud" ? (game.saving ? "guardando…" : "☁️ nube") : "💾 local"}
            </div>
            {quedan !== null && quedan <= tuning.diaFinal - tuning.diaAviso && (
              <div className="text-[11px] font-black text-red latido">Te quedan {quedan} días</div>
            )}
          </div>
          <div data-tour="speed" className="flex items-center gap-1 rounded-xl border-2 border-ink/15 bg-white p-0.5">
            {([0, 1, 2] as const).map((sp) => (
              <button key={sp} onClick={() => game.setSpeed(sp)} className={`rounded-lg px-2 py-1 text-sm font-black ${state.speed === sp ? "bg-ink text-white" : "text-ink/50"}`} aria-label={["Pausar", "Velocidad normal", "Velocidad rápida"][sp]}>
                {["⏸", "▶", "⏩"][sp]}
              </button>
            ))}
          </div>
          <Link
            href="/home"
            className="btn shrink-0 border-ink/25 bg-white px-2 py-1 text-lg"
            aria-label="Mi carrera y el ranking"
            title="Mi carrera y el ranking"
          >
            🏆
          </Link>
          <AuthButton compact />
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="rounded-xl border-2 border-ink/15 bg-white px-2 py-1 text-lg" aria-label="Menú">
              ☰
            </button>
            {menu && (
              <div className="pop absolute right-0 top-11 z-30 w-52 rounded-xl border-2 border-ink/15 bg-white p-1 text-sm shadow-lg">
                <MenuItem onClick={() => { game.saveNow(); setMenu(false); router.push("/"); }}>🏠 Ir al inicio</MenuItem>
                <MenuItem onClick={() => { game.saveNow(); setMenu(false); }}>💾 Guardar ahora</MenuItem>
                <MenuItem onClick={() => { setTour(true); setMenu(false); }}>🎓 Ver el tutorial</MenuItem>
                <MenuItem onClick={() => { setMenu(false); setFeedback(true); }}>💬 Mandar feedback</MenuItem>
                <MenuItem onClick={() => { setMenu(false); setConfirmReset(true); }}>🗑️ Empezar de nuevo</MenuItem>
              </div>
            )}
          </div>
        </div>
        {/* stats */}
        <div data-tour="stats" className="grid grid-cols-3 gap-1.5 px-3 pb-2 sm:grid-cols-6">
          <Stat icon="💵" label="Caja" value={money(state.cash)} sub={`${money(d.netDay * 30, { sign: d.netDay >= 0 })}/mes`} tone={d.netDay >= 0 ? "good" : "bad"} />
          <Stat icon="👥" label="Usuarios" value={num(state.users)} sub={`${num(d.newUsersDay - d.churnDay, { sign: true })}/día`} tone={d.newUsersDay - d.churnDay >= 0 ? "good" : "bad"} />
          <Stat icon="📈" label="MRR" value={money(d.mrr)} sub={`${money(d.arpu)} ARPU`} />
          <Stat icon="🏦" label="Valuación" value={money(d.valuation)} sub={`${state.equity}% tuyo`} />
          <Stat icon="🔥" label="Hype" value={`${Math.round(state.hype)}`} sub={hypeClavado ? (state.hype >= 100 ? "al tope" : "en el piso") : `${hypeDia >= 0 ? "+" : ""}${hypeDia.toFixed(1)}/día`} tone={hypeClavado ? undefined : hypeDia >= 0 ? "good" : "bad"} />
          <Stat icon="😊" label="Moral" value={`${Math.round(state.morale)}`} sub={`${state.employees.length} personas`} />
        </div>
        {/* La meta del board vivía adentro de la pestaña Plata y te echaban sin
            que la hubieras visto nunca. Ahora está al lado de los números, con
            lo que falta y cuánto tiempo queda. */}
        {state.boardGoal && (() => {
          const faltanDias = Math.max(0, state.boardGoal.dueDay - state.day);
          const faltanUsers = Math.max(0, Math.round(state.boardGoal.users - state.users));
          const listo = faltanUsers === 0;
          const apretado = !listo && (faltanDias <= 25 || faltanUsers > state.users * 0.6);
          const avance = Math.min(100, Math.round((state.users / state.boardGoal.users) * 100));
          return (
            <div className="px-3 pb-2">
              <div
                className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-[11px] font-bold ${
                  listo ? "border-green/40 bg-green/10" : apretado ? "border-red bg-red/10 text-red latido" : "border-ink/15 bg-white"
                }`}
              >
                <span aria-hidden>🪑</span>
                <span className="min-w-0 flex-1 truncate">
                  {listo ? (
                    <>Cumpliste la meta del board: {num(state.boardGoal.users)} usuarios.</>
                  ) : (
                    <>El board quiere {num(state.boardGoal.users)} usuarios · faltan {num(faltanUsers)} en {faltanDias} {faltanDias === 1 ? "día" : "días"}</>
                  )}
                </span>
                <span className="hidden h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-ink/10 sm:block">
                  <span className={`block h-full ${listo ? "bg-green" : apretado ? "bg-red" : "bg-indigo"}`} style={{ width: `${avance}%` }} />
                </span>
                <span className="shrink-0 tabular-nums">{avance}%</span>
              </div>
            </div>
          );
        })()}
      </header>

      {game.offlineDays > 0 && !offlineDismissed && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border-2 border-indigo bg-indigo/10 px-3 py-2 text-sm">
          <span>⏰</span>
          <span className="flex-1">
            Mientras no estabas pasaron <b>{game.offlineDays} días</b>. Mirá las novedades.
          </span>
          <button onClick={() => setOfflineDismissed(true)} className="font-black">
            ✕
          </button>
        </div>
      )}

      {/* body */}
      <main className="flex-1 px-3 py-3 pb-24 lg:pb-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-4">
          <div className={tab === "office" ? "" : "hidden lg:block"}>
            <Dashboard game={game} onGoTo={(t) => setTab(t as Tab)} />
          </div>
          <div className={tab === "office" ? "hidden lg:block" : ""}>
            <div
              className="mb-3 hidden gap-1 rounded-xl bg-ink/5 p-1 lg:flex lg:sticky lg:z-10 lg:bg-cream/95 lg:backdrop-blur"
              style={{ top: altoHeader }}
            >
              {TABS.filter((t) => t.id !== "office").map((t) => (
                <button key={t.id} data-tour={`tab-${t.id}`} onClick={() => setTab(t.id)} className={`flex-1 rounded-lg py-2 text-sm font-black transition ${tab === t.id || (tab === "office" && t.id === "team") ? "bg-white shadow" : "text-ink/50"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {(tab === "team" || tab === "office") && <TeamPanel game={game} />}
            {tab === "product" && <ProductPanel game={game} />}
            {tab === "money" && <MoneyPanel game={game} />}
            {tab === "social" && <SocialPanel game={game} />}
          </div>
        </div>
      </main>

      {/* bottom nav mobile */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink/10 bg-white lg:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} data-tour={`tab-${t.id}`} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-black ${tab === t.id ? "text-indigo" : "text-ink/50"}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* evento */}
      {ev && !tour && (
        <Modal>
          <div className="mb-1 text-4xl">{ev.icon}</div>
          <h2 className="mb-1 text-xl font-black">{ev.title}</h2>
          <p className="mb-4 text-sm text-ink/70">{ev.text}</p>
          <div className="space-y-2">
            {ev.choices.map((c, i) => (
              <button key={i} onClick={() => { const d = state.day; const id = ev.id; game.mutate((s) => resolveEvent(s, i)); trackRun(state, 0, { decision: { id, choice: i, day: d } }); }} className="w-full rounded-xl border-2 border-ink/20 bg-white p-3 text-left hover:border-indigo hover:bg-indigo/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black">{c.label}</div>
                  {c.chance !== undefined && <span className="shrink-0 rounded-full bg-amber/30 px-2 py-0.5 text-[10px] font-black">🎲 {Math.round(c.chance * 100)}% sale bien</span>}
                </div>
                <div className="text-xs text-ink/60">{c.desc}</div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* game over */}
      {state.gameOver && ganaste && <Confeti />}
      {state.gameOver && (
        <Modal centrado={ganaste}>
          {ganaste ? (
            <div className="entrada-grande">
              <div className="mb-1 text-center text-6xl latido">{state.gameOver === "ipo" ? "🔔" : "🏝️"}</div>
              <div className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-ink/40">
                {state.gameOver === "ipo" ? "Saliste a bolsa" : "Te compraron"}
              </div>
              <h2 className="mb-2 text-center text-3xl font-black leading-tight sm:text-4xl">¡Ganaste el juego!</h2>
              <div className="mb-3 rounded-2xl border-2 border-amber bg-amber/15 px-3 py-3 text-center">
                <div className="text-[11px] font-black uppercase tracking-wide text-ink/50">Tu {state.equity}% de {state.startupName} vale</div>
                <div className="text-4xl font-black tabular-nums sm:text-5xl">{money((d.valuation * state.equity) / 100)}</div>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Días", String(state.day)],
                  ["Usuarios", num(state.stats.peakUsers)],
                  ["Features", String(state.done.length)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border-2 border-ink/10 bg-white px-1 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wide text-ink/45">{k}</div>
                    <div className="text-base font-black tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1 text-5xl">{state.gameOver === "bankrupt" ? "💀" : state.gameOver === "timeout" ? "⌛" : "🪑"}</div>
              <h2 className="mb-1 text-xl font-black">
                {state.gameOver === "bankrupt" ? "Cerró la startup" : state.gameOver === "timeout" ? "Hasta acá llegaste" : "Te reemplazaron"}
              </h2>
              <p className="mb-3 text-sm text-ink/70">
                {state.gameOver === "fired"
                  ? `El board puso otro CEO en tu silla. ${state.startupName} sigue existiendo sin vos, y tu ${state.equity}% ahora vale ${money((d.valuation * state.equity) / 100)}.`
                  : state.gameOver === "timeout"
                    ? `${state.day} días al frente de ${state.startupName}. Nunca saliste a bolsa: tu ${state.equity}% vale ${money((d.valuation * state.equity) / 100)} en papel y ahí se queda.`
                    : `${state.startupName} duró ${state.day} días. Pico de ${num(state.stats.peakUsers)} usuarios. La próxima arrancás con más caja.`}
              </p>
            </>
          )}
          {!game.userId && supabaseEnabled() && (
            <div className="mb-3 rounded-xl border-2 border-indigo/25 bg-indigo/5 p-3 text-left">
              <p className="mb-2 text-xs font-bold">
                Entrá con Google y esta partida queda guardada en tu historial, con tus logros y tu puesto en el ranking.
              </p>
              <Btn variant="ghost" className="w-full" onClick={() => { marcarLoginEnCurso(); signInWithGoogle("/play"); }}>
                Guardar esta partida
              </Btn>
            </div>
          )}
          <div className="mb-2 flex gap-2">
            <Btn
              variant="amber"
              className="flex-1"
              disabled={compartiendo}
              onClick={async () => {
                setCompartiendo(true);
                const link = await prepararLink();
                setCompartiendo(false);
                if (!link) return;
                const s = state;
                const texto = textoParaCompartir({
                  game_id: s.id, name: s.startupName, sector: s.sector, idea: s.idea,
                  ended_as: s.gameOver ?? "abandoned", day: s.day, valuation: Math.round(d.valuation),
                  peak_users: Math.round(s.stats.peakUsers), equity: s.equity,
                  team_size: s.employees.length, features: s.done.length, display_name: null,
                });
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(link)}`, "_blank", "noopener");
              }}
            >
              {compartiendo ? "Preparando…" : "𝕏 Compartir"}
            </Btn>
            <Btn
              variant="ghost"
              className="flex-1"
              onClick={async () => {
                const link = await prepararLink();
                if (!link) return;
                try {
                  await navigator.clipboard.writeText(link);
                  setLinkCopiado(true);
                  setTimeout(() => setLinkCopiado(false), 2000);
                } catch {
                  window.open(link, "_blank", "noopener");
                }
              }}
            >
              {linkCopiado ? "¡Copiado!" : "🔗 Copiar link"}
            </Btn>
          </div>
          <Btn className="w-full" onClick={() => game.reset()}>
            🚀 Fundar otra startup
          </Btn>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs font-bold text-ink/50">
            <button onClick={() => setFeedback(true)} className="underline underline-offset-2 hover:text-ink">
              💬 Contame cómo te fue
            </button>
            <span aria-hidden>·</span>
            <Link href="/home" className="underline underline-offset-2 hover:text-ink">
              🏆 Mi carrera
            </Link>
            <span aria-hidden>·</span>
            <Link href="/" className="underline underline-offset-2 hover:text-ink">
              🏠 Inicio
            </Link>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <Modal>
          <div className="mb-1 text-4xl">🗑️</div>
          <h2 className="mb-1 text-xl font-black">¿Empezar de nuevo?</h2>
          <p className="mb-4 text-sm text-ink/70">
            Se borra <b>{state.startupName}</b> con sus {state.day} días de historia y arrancás una startup nueva. No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Btn variant="danger" className="flex-1" onClick={() => { setConfirmReset(false); game.reset(); }}>
              Sí, borrar y empezar
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Btn>
          </div>
        </Modal>
      )}

      {escena !== null && state && <EscenaMudanza state={state} onClose={() => setEscena(null)} />}

      {feedback && (
        <FeedbackModal
          onClose={() => setFeedback(false)}
          contexto={{
            dia: state.day,
            final: state.gameOver ?? "jugando",
            sector: state.sector,
            usuarios: state.users,
            mrr: Math.round(d.mrr),
            caja: Math.round(state.cash),
            features: state.done.length,
            empleados: state.employees.length,
            ronda: STAGES[state.stage].id,
            oficina: state.office,
            popups: state.eventCount,
            partidas: state.restarts,
            startup: state.startupName,
          }}
        />
      )}

      {tour && !state.gameOver && <Tour onClose={() => setTour(false)} setTab={(t) => setTab(t as Tab)} />}

      {/* toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex flex-col items-center gap-1.5 px-3">
        {game.toasts.map((t) => (
          <div key={t.id} className={`toast rounded-xl border-2 px-3 py-2 text-sm font-bold shadow-lg ${t.kind === "bad" ? "border-red bg-red text-white" : t.kind === "good" ? "border-green bg-green text-white" : t.kind === "social" ? "border-indigo bg-indigo text-white" : "border-ink bg-ink text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-ink/5">
      {children}
    </button>
  );
}

function Modal({ children, centrado = false }: { children: React.ReactNode; centrado?: boolean }) {
  return (
    <div
      role="dialog"
      aria-modal
      className={`fixed inset-0 z-30 flex justify-center overflow-y-auto p-3 ${centrado ? "items-center bg-ink/70" : "items-end bg-ink/50 sm:items-center"}`}
    >
      <div className={`pop card w-full ${centrado ? "my-auto max-w-lg border-amber" : "max-w-md"}`}>{children}</div>
    </div>
  );
}

function Setup({ onStart }: { onStart: (o: { startupName: string; founderName: string; idea: string; sector: string }) => void }) {
  const [sector, setSector] = useState("saas");
  const [name, setName] = useState(() => randomStartupName("saas"));
  const [idea, setIdea] = useState(() => randomIdea("saas"));
  const [founder, setFounder] = useState("");
  // si el jugador escribió lo suyo, cambiar de sector no se lo pisa
  const escrito = useRef({ name: false, idea: false });

  const elegirSector = (id: string) => {
    setSector(id);
    if (!escrito.current.name) setName(randomStartupName(id));
    if (!escrito.current.idea) setIdea(randomIdea(id));
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-bold text-ink/50">
        <Link href="/" className="underline underline-offset-2 hover:text-ink">🏠 Inicio</Link>
        <div className="flex gap-3">
          <Link href="/como-se-juega" className="underline underline-offset-2 hover:text-ink">Cómo se juega</Link>
          <Link href="/home" className="underline underline-offset-2 hover:text-ink">🏆 Ranking</Link>
        </div>
      </div>
      <Card>
        <div className="mb-1 text-3xl">🚀</div>
        <h1 className="text-2xl font-black">Vibecodeá tu startup</h1>
        <p className="mb-4 text-sm text-ink/60">Tenés $30.000, un garage, una laptop y un agente IA. Ni una línea escrita a mano.</p>
        <label className="mb-3 block text-xs font-bold uppercase text-ink/50">
          Nombre de la startup
          <div className="mt-1 flex gap-2">
            <input value={name} onChange={(e) => { escrito.current.name = true; setName(e.target.value.slice(0, 24)); }} className="w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-base font-bold normal-case outline-none focus:border-indigo" />
            <Btn variant="ghost" onClick={() => setName(randomStartupName(sector))} aria-label="Nombre al azar">
              🎲
            </Btn>
          </div>
        </label>
        <label className="mb-3 block text-xs font-bold uppercase text-ink/50">
          Tu idea
          <div className="mt-1 flex gap-2">
            <input value={idea} onChange={(e) => { escrito.current.idea = true; setIdea(e.target.value.slice(0, 60)); }} placeholder="¿Qué vas a construir?" className="w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo" />
            <Btn variant="ghost" onClick={() => setIdea(randomIdea(sector))} aria-label="Idea al azar">
              🎲
            </Btn>
          </div>
        </label>
        <label className="mb-3 block text-xs font-bold uppercase text-ink/50">
          Tu nombre
          <input value={founder} onChange={(e) => setFounder(e.target.value.slice(0, 24))} placeholder="Fundador/a" className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-base font-bold normal-case outline-none focus:border-indigo" />
        </label>
        <div className="mb-1 text-xs font-bold uppercase text-ink/50">Sector</div>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {SECTORS.map((s) => (
            <button key={s.id} onClick={() => elegirSector(s.id)} className={`rounded-xl border-2 p-2 text-left ${sector === s.id ? "border-indigo bg-indigo/10" : "border-ink/15 bg-white"}`}>
              <div className="text-sm font-black">
                {s.icon} {s.name}
              </div>
              <div className="text-[10px] text-ink/60">{s.desc}</div>
            </button>
          ))}
        </div>
        <Btn size="lg" className="w-full" disabled={!name.trim()} onClick={() => onStart({ startupName: name.trim(), founderName: founder.trim() || "Fundador/a", idea: idea.trim(), sector })}>
          Empezar 🚀
        </Btn>
      </Card>
    </div>
  );
}
