"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { DEFAULT_TUNING, loadTuning, resetTuning, saveTuning, tuning, type Tuning } from "@/lib/game/tuning";
import { clearRuns, getRuns, playerId, type RunRecord } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase/client";
import { fetchRunsGlobales } from "@/lib/storage";
import { EVENTS, SECTORS, STAGES } from "@/lib/game/data";
import { money, num } from "@/lib/game/format";

const OUTCOME_LABEL: Record<string, string> = {
  playing: "En curso",
  bankrupt: "Quiebra",
  ipo: "IPO",
  acquired: "Exit",
  fired: "Te echaron",
  abandoned: "Abandonada",
};

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [t, setT] = useState<Tuning>({ ...DEFAULT_TUNING });
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [me, setMe] = useState("");
  const [tab, setTab] = useState<"metricas" | "drivers" | "eventos" | "feedback">("metricas");
  const [feedback, setFeedback] = useState<FeedbackRow[] | null>(null);
  const [globales, setGlobales] = useState<RunGlobal[] | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      loadTuning();
      setT({ ...tuning });
      setRuns(getRuns());
      setMe(playerId());
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // las partidas de todos los jugadores viven en Supabase; las de abajo son
  // solo las de este navegador
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setGlobales([]);
      return;
    }
    fetchRunsGlobales(sb).then((d) => setGlobales(d as RunGlobal[])).catch((e) => {
      console.error(e);
      setGlobales([]);
    });
  }, []);

  // el feedback vive en Supabase y solo lo puede leer el admin (RLS por mail)
  useEffect(() => {
    if (tab !== "feedback" || feedback) return;
    const sb = getSupabase();
    if (!sb) {
      setFeedback([]);
      return;
    }
    sb.from("feedback")
      .select("id, rating, texto, contexto, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setFeedback((data as FeedbackRow[]) ?? []));
  }, [tab, feedback]);

  const set = (patch: Partial<Tuning>) => {
    const next = { ...t, ...patch };
    setT(next);
    saveTuning(patch);
  };

  const m = useMemo(() => metrics(runs), [runs]);

  if (!ready) return <main className="p-6 text-sm text-ink/50">Cargando…</main>;

  return (
    <main className="mx-auto max-w-3xl p-4 pb-16">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">Panel de control</h1>
          <p className="text-xs text-ink/60">
            Métricas y drivers del juego · jugador <code className="rounded bg-ink/10 px-1">{me}</code>
          </p>
        </div>
        <Link href="/play" className="btn border-ink/30 bg-white px-3 py-2 text-sm">
          ← Al juego
        </Link>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl bg-ink/5 p-1">
        {(["metricas", "drivers", "eventos", "feedback"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg py-2 text-sm font-black transition ${tab === k ? "bg-white shadow" : "text-ink/50"}`}>
            {k === "metricas" ? "📊 Métricas" : k === "drivers" ? "🎛️ Drivers" : k === "eventos" ? "🎲 Eventos" : "💬 Feedback"}
          </button>
        ))}
      </div>

      {tab === "metricas" && (
        <div className="space-y-3">
          <Card title="🌍 Todas las partidas · todos los jugadores">
            {globales === null ? (
              <p className="text-sm text-ink/60">Cargando…</p>
            ) : globales.length === 0 ? (
              <p className="text-sm text-ink/60">Todavía no hay partidas guardadas.</p>
            ) : (
              (() => {
                const g = globales;
                const n = g.length;
                const cuenta = (f: (r: RunGlobal) => boolean) => g.filter(f).length;
                const gana = cuenta((r) => r.ended_as === "ipo" || r.ended_as === "acquired");
                const jugadores = new Set(g.map((r) => r.user_id ?? r.anon_id ?? "?")).size;
                const conCuenta = cuenta((r) => !!r.user_id);
                const prom = (f: (r: RunGlobal) => number) => g.reduce((a, r) => a + f(r), 0) / n;
                const finales: [string, string][] = [["ipo", "IPO"], ["acquired", "Exit"], ["bankrupt", "Quiebra"], ["fired", "Te echaron"], ["abandoned", "Abandonada"]];
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <KPI label="Partidas" value={String(n)} sub={`${jugadores} jugadores`} />
                      <KPI label="Ganadas" value={`${Math.round((gana / n) * 100)}%`} sub={`${gana} de ${n}`} />
                      <KPI label="Días por partida" value={prom((r) => r.day).toFixed(0)} sub={`${prom((r) => r.features).toFixed(1)} features`} />
                      <KPI label="Con cuenta" value={`${Math.round((conCuenta / n) * 100)}%`} sub={`${conCuenta} partidas`} />
                    </div>
                    <div className="mt-3 space-y-1">
                      {finales.map(([id, label]) => {
                        const c = cuenta((r) => r.ended_as === id);
                        if (!c) return null;
                        return (
                          <div key={id}>
                            <div className="flex justify-between text-[11px]"><span>{label}</span><span className="tabular-nums">{c} ({Math.round((c / n) * 100)}%)</span></div>
                            <Bar value={c} max={n} color={id === "ipo" || id === "acquired" ? "bg-green" : id === "bankrupt" ? "bg-red" : "bg-ink/40"} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-ink/40">Por sector</div>
                    <ul className="mt-1 space-y-1 text-[11px]">
                      {SECTORS.map((sec) => {
                        const del = g.filter((r) => r.sector === sec.id);
                        if (!del.length) return null;
                        const w = del.filter((r) => r.ended_as === "ipo" || r.ended_as === "acquired").length;
                        return (
                          <li key={sec.id} className="flex items-center gap-2 rounded-lg bg-ink/5 px-2 py-1">
                            <span>{sec.icon}</span>
                            <span className="flex-1 truncate font-bold">{sec.name}</span>
                            <span className="text-ink/50">{del.length} partidas</span>
                            <span className="w-12 shrink-0 text-right font-black tabular-nums">{Math.round((w / del.length) * 100)}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()
            )}
          </Card>

          <Card title="Solo este navegador">
            {runs.length === 0 ? (
              <p className="text-sm text-ink/60">Todavía no hay partidas registradas en este navegador. Jugá un rato y volvé.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <KPI label="Partidas" value={String(m.total)} sub={`${m.finished} terminadas`} />
                  <KPI label="Duración media" value={`${m.avgMin.toFixed(1)} min`} sub={`${m.avgDays.toFixed(0)} días de juego`} />
                  <KPI label="Partida más larga" value={`${m.maxMin.toFixed(0)} min`} sub={`${m.maxDays} días`} />
                  <KPI label="Popups por partida" value={m.avgEvents.toFixed(1)} sub={`${m.avgDecisions.toFixed(1)} decisiones`} />
                </div>
                <div className="mt-3 text-xs text-ink/60">
                  Tiempo total jugado: <b>{m.totalMin.toFixed(0)} min</b> · Primera partida: {new Date(m.first).toLocaleDateString("es-AR")} · Días distintos con actividad: <b>{m.activeDays}</b>
                </div>
              </>
            )}
          </Card>

          {runs.length > 0 && (
            <>
              <Card title="Cómo terminan">
                <ul className="space-y-1.5 text-xs">
                  {Object.entries(m.outcomes).map(([k, v]) => (
                    <li key={k}>
                      <div className="mb-0.5 flex justify-between">
                        <span>{OUTCOME_LABEL[k] ?? k}</span>
                        <span className="font-bold tabular-nums">
                          {v} ({Math.round((v / m.total) * 100)}%)
                        </span>
                      </div>
                      <Bar value={v} max={m.total} color={k === "bankrupt" ? "bg-red" : k === "playing" ? "bg-indigo" : k === "abandoned" ? "bg-ink/30" : "bg-green"} />
                    </li>
                  ))}
                </ul>
                {m.bankruptDay > 0 && <div className="mt-2 text-[11px] text-ink/50">Las quiebras pasan en promedio el día {m.bankruptDay.toFixed(0)}.</div>}
              </Card>

              <Card title="Continuidad">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <KPI label="Partidas por sesión" value={m.runsPerDay.toFixed(1)} sub="días con actividad" />
                  <KPI label="Racha máxima" value={`${m.streak} días`} sub="jugando seguido" />
                  <KPI label="Vuelven a jugar" value={`${Math.round(m.replayRate * 100)}%`} sub="empezó otra partida" />
                </div>
              </Card>

              <Card title="Por sector">
                <ul className="space-y-1 text-xs">
                  {m.bySector.map((r) => (
                    <li key={r.sector} className="flex items-center justify-between rounded-lg bg-ink/5 px-2 py-1">
                      <span>
                        {SECTORS.find((s) => s.id === r.sector)?.icon ?? "🏢"} {SECTORS.find((s) => s.id === r.sector)?.name ?? r.sector}
                      </span>
                      <span className="tabular-nums text-ink/60">
                        {r.n} {r.n === 1 ? "partida" : "partidas"} · {r.avgDays.toFixed(0)} días · {r.ipo} exits
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Últimas partidas" right={<Btn size="sm" variant="ghost" onClick={() => { if (confirm("¿Borrar todas las métricas guardadas?")) { clearRuns(); setRuns([]); } }}>Borrar datos</Btn>}>
                <ul className="space-y-1 text-[11px]">
                  {[...runs].reverse().slice(0, 12).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-sand/60 px-2 py-1">
                      <span className="truncate">
                        {SECTORS.find((s) => s.id === r.sector)?.icon} {new Date(r.startedAt).toLocaleDateString("es-AR")} · día {r.days} · {STAGES[r.stage]?.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-ink/60">
                        {num(r.users)} us · {money(r.valuation)} · {(r.playedMs / 60000).toFixed(1)}min
                      </span>
                      <Pill tone={r.outcome === "bankrupt" ? "bad" : r.outcome === "playing" ? "indigo" : r.outcome === "abandoned" ? "ink" : "good"}>{OUTCOME_LABEL[r.outcome]}</Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "drivers" && (
        <div className="space-y-3">
          <Card title="Ritmo de los popups" right={<Btn size="sm" variant="ghost" onClick={() => { resetTuning(); setT({ ...DEFAULT_TUNING }); }}>Restaurar</Btn>}>
            <p className="mb-3 text-[11px] text-ink/60">
              Los cambios se guardan en este navegador y afectan a las partidas nuevas y en curso. Sirven para probar ritmos sin tocar código.
            </p>
            <Num label="Primer popup (día)" v={t.firstEventDay} min={1} max={60} onChange={(v) => set({ firstEventDay: v })} />
            <Num label="Tope de popups por partida" v={t.cap} min={5} max={100} onChange={(v) => set({ cap: v })} hint="Al llegar, solo siguen los reactivos" />
            <Num label="Días mínimos entre popups" v={t.separation} min={1} max={30} onChange={(v) => set({ separation: v })} />
            <Range label="Intervalo en garage / pre-seed" v={t.intervalSmall} onChange={(v) => set({ intervalSmall: v })} />
            <Range label="Intervalo en seed / serie A" v={t.intervalMid} onChange={(v) => set({ intervalMid: v })} />
            <Range label="Intervalo de serie B en adelante" v={t.intervalBig} onChange={(v) => set({ intervalBig: v })} />
          </Card>

          <Card title="Carácter de la partida">
            <p className="mb-3 text-[11px] text-ink/60">Al empezar, cada partida sortea uno de estos tres multiplicadores. Más bajo = más eventos.</p>
            <Num label="Tranquila" v={t.paceTranquila} min={0.5} max={3} step={0.05} onChange={(v) => set({ paceTranquila: v })} />
            <Num label="Normal" v={t.paceNormal} min={0.5} max={3} step={0.05} onChange={(v) => set({ paceNormal: v })} />
            <Num label="Caótica" v={t.paceCaotica} min={0.3} max={3} step={0.05} onChange={(v) => set({ paceCaotica: v })} />
          </Card>

          <Card title="Reactivos y azar">
            <Num label="Multiplicador de enfriamiento de reactivos" v={t.reactiveCooldownMul} min={0.2} max={4} step={0.1} onChange={(v) => set({ reactiveCooldownMul: v })} hint="Más alto = aparecen menos seguido" />
            <label className="mt-2 flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={t.chanceEnabled} onChange={(e) => set({ chanceEnabled: e.target.checked })} className="h-4 w-4 accent-indigo" />
              Decisiones con azar
              <span className="text-[11px] font-normal text-ink/50">(si lo apagás, las apuestas siempre salen bien)</span>
            </label>
          </Card>
        </div>
      )}

      {tab === "eventos" && (
        <div className="space-y-3">
          <Card title={`Catálogo · ${EVENTS.length} eventos`}>
            <div className="mb-2 flex flex-wrap gap-1 text-[11px]">
              <Pill>{EVENTS.filter((e) => !e.reactive && !e.sector).length} generales</Pill>
              <Pill tone="indigo">{EVENTS.filter((e) => e.sector).length} por sector</Pill>
              <Pill tone="amber">{EVENTS.filter((e) => e.reactive).length} reactivos</Pill>
              <Pill tone="bad">{EVENTS.reduce((a, e) => a + e.choices.filter((c) => c.chance !== undefined).length, 0)} opciones con azar</Pill>
            </div>
            <ul className="space-y-1 text-[11px]">
              {EVENTS.map((e) => {
                const vistos = runs.reduce((a, r) => a + r.decisions.filter((d) => d.id === e.id).length, 0);
                return (
                  <li key={e.id} className="flex items-center gap-2 rounded-lg bg-ink/5 px-2 py-1">
                    <span>{e.icon}</span>
                    <span className="flex-1 truncate font-bold">{e.title}</span>
                    {e.sector && <Pill tone="indigo">{SECTORS.find((s) => s.id === e.sector)?.name ?? e.sector}</Pill>}
                    {e.reactive && <Pill tone="amber">reactivo</Pill>}
                    {e.choices.some((c) => c.chance !== undefined) && <Pill tone="bad">azar</Pill>}
                    <span className="w-16 shrink-0 text-right tabular-nums text-ink/50">{vistos} {vistos === 1 ? "vez" : "veces"}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Decisiones más tomadas">
            {m.topDecisions.length === 0 ? (
              <p className="text-xs text-ink/50">Todavía no hay decisiones registradas.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {m.topDecisions.map((d) => {
                  const ev = EVENTS.find((e) => e.id === d.id);
                  return (
                    <li key={d.id} className="rounded-lg bg-sand/60 px-2 py-1.5">
                      <div className="font-bold">
                        {ev?.icon} {ev?.title ?? d.id} · {d.n} {d.n === 1 ? "vez" : "veces"}
                      </div>
                      {ev?.choices.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="flex-1 truncate text-ink/60">{c.label}</span>
                          <span className="tabular-nums">{Math.round(((d.byChoice[i] ?? 0) / d.n) * 100)}%</span>
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          {feedback === null ? (
            <Card><p className="text-xs text-ink/50">Cargando…</p></Card>
          ) : feedback.length === 0 ? (
            <Card><p className="text-xs text-ink/50">Todavía no mandó feedback nadie.</p></Card>
          ) : (
            <>
              <Card title={`${feedback.length} mensajes`}>
                <div className="grid grid-cols-3 gap-2">
                  <KPI label="Nota promedio" value={promedioNota(feedback)} sub="sobre 5 🤖" />
                  <KPI label="Con texto" value={String(feedback.filter((f) => f.texto).length)} />
                  <KPI label="Últimos 7 días" value={String(feedback.filter((f) => Date.now() - new Date(f.created_at).getTime() < 7 * 864e5).length)} />
                </div>
              </Card>
              {feedback.map((f) => (
                <Card key={f.id}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm">{f.rating ? "🤖".repeat(f.rating) : "—"}</span>
                    <span className="ml-auto text-[11px] text-ink/40">{new Date(f.created_at).toLocaleString("es-AR")}</span>
                  </div>
                  {f.texto && <p className="mb-2 whitespace-pre-wrap text-sm">{f.texto}</p>}
                  {f.contexto && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(f.contexto).map(([k, v]) => (
                        <Pill key={k}>{k}: {String(v)}</Pill>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-ink/40">
        Las métricas de partidas son de este navegador. El feedback viene de todos los jugadores.
      </p>
    </main>
  );
}

type FeedbackRow = {
  id: string;
  rating: number | null;
  texto: string | null;
  contexto: Record<string, unknown> | null;
  created_at: string;
};

function promedioNota(rows: FeedbackRow[]) {
  const notas = rows.map((r) => r.rating).filter((n): n is number => !!n);
  return notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : "—";
}

type RunGlobal = {
  sector: string;
  ended_as: string;
  day: number;
  valuation: number;
  peak_users: number;
  equity: number;
  team_size: number;
  features: number;
  user_id: string | null;
  anon_id: string | null;
  created_at: string;
};

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-white px-2 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink/50">{label}</div>
      <div className="text-lg font-black tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-ink/50">{sub}</div>}
    </div>
  );
}

function Num({ label, v, min, max, step = 1, hint, onChange }: { label: string; v: number; min: number; max: number; step?: number; hint?: string; onChange: (v: number) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2 text-sm">
      <span className="flex-1">
        {label}
        {hint && <span className="block text-[10px] text-ink/50">{hint}</span>}
      </span>
      <input type="number" value={v} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-24 rounded-lg border-2 border-ink/20 bg-cream px-2 py-1 text-right font-bold tabular-nums outline-none focus:border-indigo" />
    </label>
  );
}

function Range({ label, v, onChange }: { label: string; v: [number, number]; onChange: (v: [number, number]) => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-sm">
      <span className="flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <input type="number" value={v[0]} min={1} max={90} onChange={(e) => onChange([Number(e.target.value), v[1]])} className="w-16 rounded-lg border-2 border-ink/20 bg-cream px-2 py-1 text-right font-bold tabular-nums outline-none focus:border-indigo" />
        <span className="text-ink/40">a</span>
        <input type="number" value={v[1]} min={1} max={90} onChange={(e) => onChange([v[0], Number(e.target.value)])} className="w-16 rounded-lg border-2 border-ink/20 bg-cream px-2 py-1 text-right font-bold tabular-nums outline-none focus:border-indigo" />
        <span className="text-[10px] text-ink/50">días</span>
      </div>
    </div>
  );
}

function metrics(runs: RunRecord[]) {
  const total = runs.length;
  const finished = runs.filter((r) => r.outcome !== "playing").length;
  const sum = (f: (r: RunRecord) => number) => runs.reduce((a, r) => a + f(r), 0);
  const outcomes: Record<string, number> = {};
  for (const r of runs) outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;

  const days = new Set(runs.map((r) => new Date(r.startedAt).toDateString()));
  // racha de días seguidos
  const sortedDays = [...days].map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  let streak = sortedDays.length ? 1 : 0;
  let best = streak;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / 86400000;
    streak = diff <= 1.5 ? streak + 1 : 1;
    best = Math.max(best, streak);
  }

  const bankrupts = runs.filter((r) => r.outcome === "bankrupt");
  const bySectorMap: Record<string, { n: number; days: number; ipo: number }> = {};
  for (const r of runs) {
    const e = (bySectorMap[r.sector] ??= { n: 0, days: 0, ipo: 0 });
    e.n++;
    e.days += r.days;
    if (r.outcome === "ipo" || r.outcome === "acquired") e.ipo++;
  }

  const decMap: Record<string, { id: string; n: number; byChoice: Record<number, number> }> = {};
  for (const r of runs)
    for (const d of r.decisions) {
      const e = (decMap[d.id] ??= { id: d.id, n: 0, byChoice: {} });
      e.n++;
      e.byChoice[d.choice] = (e.byChoice[d.choice] ?? 0) + 1;
    }

  return {
    total,
    finished,
    outcomes,
    first: runs.length ? runs[0].startedAt : 0,
    totalMin: sum((r) => r.playedMs) / 60000,
    avgMin: total ? sum((r) => r.playedMs) / 60000 / total : 0,
    maxMin: total ? Math.max(...runs.map((r) => r.playedMs)) / 60000 : 0,
    avgDays: total ? sum((r) => r.days) / total : 0,
    maxDays: total ? Math.max(...runs.map((r) => r.days)) : 0,
    avgEvents: total ? sum((r) => r.events) / total : 0,
    avgDecisions: total ? sum((r) => r.decisions.length) / total : 0,
    activeDays: days.size,
    runsPerDay: days.size ? total / days.size : 0,
    streak: best,
    replayRate: total > 1 ? (total - 1) / total : 0,
    bankruptDay: bankrupts.length ? bankrupts.reduce((a, r) => a + r.days, 0) / bankrupts.length : 0,
    bySector: Object.entries(bySectorMap)
      .map(([sector, v]) => ({ sector, n: v.n, avgDays: v.days / v.n, ipo: v.ipo }))
      .sort((a, b) => b.n - a.n),
    topDecisions: Object.values(decMap)
      .sort((a, b) => b.n - a.n)
      .slice(0, 8),
  };
}
