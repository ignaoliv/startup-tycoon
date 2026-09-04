"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/panels/Dashboard";
import { TeamPanel } from "@/components/panels/TeamPanel";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { MoneyPanel } from "@/components/panels/MoneyPanel";
import { SocialPanel } from "@/components/panels/SocialPanel";
import { Btn, Card, Stat } from "@/components/ui";
import { Tour, isTourDone } from "@/components/Tour";
import { trackRun } from "@/lib/analytics";
import { EVENTS, SECTORS, STAGES } from "@/lib/game/data";
import { randomIdea, randomStartupName, resolveEvent } from "@/lib/game/engine";
import { money, num } from "@/lib/game/format";
import { useGame } from "@/hooks/useGame";
import { createPost } from "@/lib/storage";

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
  const forceLocal = params.get("local") === "1";
  const game = useGame(forceLocal);
  const [tab, setTab] = useState<Tab>("office");
  const [menu, setMenu] = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const [tour, setTour] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
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
    setPaused(tour);
  }, [tour, setPaused]);
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
  const d = derived!;
  const ev = state.pendingEvent ? EVENTS.find((e) => e.id === state.pendingEvent!.id) : null;
  const sector = SECTORS.find((s) => s.id === state.sector);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      {/* header */}
      <header className="sticky top-0 z-20 border-b-2 border-ink/10 bg-cream/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-black leading-tight">
              {sector?.icon} {state.startupName}
            </div>
            <div className="text-[11px] font-semibold text-ink/50">
              Día {state.day} · {STAGES[state.stage].name} · {game.mode === "cloud" ? (game.saving ? "guardando…" : "☁️ nube") : "💾 local"}
            </div>
          </div>
          <div data-tour="speed" className="flex items-center gap-1 rounded-xl border-2 border-ink/15 bg-white p-0.5">
            {([0, 1, 2] as const).map((sp) => (
              <button key={sp} onClick={() => game.setSpeed(sp)} className={`rounded-lg px-2 py-1 text-sm font-black ${state.speed === sp ? "bg-ink text-white" : "text-ink/50"}`} aria-label={["Pausar", "Velocidad normal", "Velocidad rápida"][sp]}>
                {["⏸", "▶", "⏩"][sp]}
              </button>
            ))}
          </div>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="rounded-xl border-2 border-ink/15 bg-white px-2 py-1 text-lg" aria-label="Menú">
              ☰
            </button>
            {menu && (
              <div className="pop absolute right-0 top-11 z-30 w-52 rounded-xl border-2 border-ink/15 bg-white p-1 text-sm shadow-lg">
                <MenuItem onClick={() => { game.saveNow(); setMenu(false); }}>💾 Guardar ahora</MenuItem>
                <MenuItem onClick={() => { setTour(true); setMenu(false); }}>🎓 Ver el tutorial</MenuItem>
                {game.mode === "cloud" && <MenuItem onClick={game.signOut}>🚪 Cerrar sesión</MenuItem>}
                {game.mode === "local" && (
                  <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-ink/5">
                    🔐 Entrar con Google
                  </Link>
                )}
                <MenuItem onClick={() => { setMenu(false); setConfirmReset(true); }}>🗑️ Empezar de nuevo</MenuItem>
              </div>
            )}
          </div>
        </div>
        {/* stats */}
        <div data-tour="stats" className="grid grid-cols-3 gap-1.5 px-3 pb-2 sm:grid-cols-6">
          <Stat icon="💵" label="Caja" value={money(state.cash)} sub={`${money(d.netDay * 30, { sign: d.netDay >= 0 })}/mes`} tone={d.netDay >= 0 ? "good" : "bad"} />
          <Stat icon="👥" label="Usuarios" value={num(state.users)} sub={`+${num(d.newUsersDay - d.churnDay)}/día`} tone={d.newUsersDay - d.churnDay >= 0 ? "good" : "bad"} />
          <Stat icon="📈" label="MRR" value={money(d.mrr)} sub={`${money(d.arpu)} ARPU`} />
          <Stat icon="🏦" label="Valuación" value={money(d.valuation)} sub={`${state.equity}% tuyo`} />
          <Stat icon="🔥" label="Hype" value={`${Math.round(state.hype)}`} sub={`${(d.mktPts * 0.25 - 0.7).toFixed(1)}/día`} tone={d.mktPts * 0.25 - 0.7 >= 0 ? "good" : "bad"} />
          <Stat icon="😊" label="Moral" value={`${Math.round(state.morale)}`} sub={`${state.employees.length} personas`} />
        </div>
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
            <div className="mb-3 hidden gap-1 rounded-xl bg-ink/5 p-1 lg:flex">
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
      {state.gameOver && (
        <Modal>
          <div className="mb-1 text-5xl">{state.gameOver === "bankrupt" ? "💀" : state.gameOver === "ipo" ? "🔔" : state.gameOver === "fired" ? "🪑" : "🏦"}</div>
          <h2 className="mb-1 text-xl font-black">{state.gameOver === "bankrupt" ? "Cerró la startup" : state.gameOver === "ipo" ? "¡IPO exitosa!" : state.gameOver === "fired" ? "Te reemplazaron" : "¡Exit!"}</h2>
          <p className="mb-3 text-sm text-ink/70">
            {state.gameOver === "fired"
              ? `El board puso otro CEO en tu silla. ${state.startupName} sigue existiendo sin vos, y tu ${state.equity}% ahora vale ${money((d.valuation * state.equity) / 100)}.`
              : state.gameOver === "bankrupt"
              ? `${state.startupName} duró ${state.day} días. Pico de ${num(state.stats.peakUsers)} usuarios. La próxima arrancás con más caja.`
              : `Tu ${state.equity}% de ${state.startupName} vale ${money((d.valuation * state.equity) / 100)}. ${state.day} días, ${num(state.stats.peakUsers)} usuarios en el pico.`}
          </p>
          <Btn className="w-full" onClick={() => game.reset()}>
            🚀 Fundar otra startup
          </Btn>
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

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-30 flex items-end justify-center bg-ink/50 p-3 sm:items-center">
      <div className="pop card w-full max-w-md">{children}</div>
    </div>
  );
}

function Setup({ onStart }: { onStart: (o: { startupName: string; founderName: string; idea: string; sector: string }) => void }) {
  const [name, setName] = useState(() => randomStartupName());
  const [idea, setIdea] = useState(() => randomIdea());
  const [founder, setFounder] = useState("");
  const [sector, setSector] = useState("saas");
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
      <Card>
        <div className="mb-1 text-3xl">🚀</div>
        <h1 className="text-2xl font-black">Vibecodeá tu startup</h1>
        <p className="mb-4 text-sm text-ink/60">Tenés $30.000, un garage, una laptop y un agente IA. Ni una línea escrita a mano.</p>
        <label className="mb-3 block text-xs font-bold uppercase text-ink/50">
          Nombre de la startup
          <div className="mt-1 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} className="w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-base font-bold normal-case outline-none focus:border-indigo" />
            <Btn variant="ghost" onClick={() => setName(randomStartupName())} aria-label="Nombre al azar">
              🎲
            </Btn>
          </div>
        </label>
        <label className="mb-3 block text-xs font-bold uppercase text-ink/50">
          Tu idea
          <div className="mt-1 flex gap-2">
            <input value={idea} onChange={(e) => setIdea(e.target.value.slice(0, 60))} placeholder="¿Qué vas a construir?" className="w-full rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo" />
            <Btn variant="ghost" onClick={() => setIdea(randomIdea())} aria-label="Idea al azar">
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
            <button key={s.id} onClick={() => setSector(s.id)} className={`rounded-xl border-2 p-2 text-left ${sector === s.id ? "border-indigo bg-indigo/10" : "border-ink/15 bg-white"}`}>
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
