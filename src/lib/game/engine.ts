import { AI_LEVEL_NAMES, AI_NAMES, AVATARS, EVENTS, FEATURES, FIRST_NAMES, IPO_VALUATION, LAST_NAMES, LEVEL_NAMES, OFFICES, OFFLINE_MAX_DAYS, ROLES, SECTORS, STAGES, START_CASH, STARTUP_NAME_PARTS, TICK_MS } from "./data";
import type { Candidate, Derived, Employee, GameState, Level, LogEntry, ReactiveCtx, Role } from "./types";
import { tuning } from "./tuning";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function randomStartupName() {
  return pick(STARTUP_NAME_PARTS.a) + pick(STARTUP_NAME_PARTS.b);
}

export function makeCandidate(s: GameState, role?: Role): Candidate {
  const r = role ?? pick(Object.keys(ROLES) as Role[]);
  // niveles más altos aparecen a medida que crecés
  const roll = Math.random();
  const lvl: Level = roll < 0.55 ? 1 : roll < 0.85 ? 2 : 3;
  const base = ROLES[r].baseSalary;
  const salary = Math.round((base * [0, 1, 1.9, 3.6][lvl] * rnd(0.9, 1.15)) / 50) * 50;
  const id = `e${s.nextId++}`;
  return {
    id,
    name: r === "ai" ? `${pick(AI_NAMES)} ${["", "Mini", "Pro", "Ultra"][lvl]}` : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    role: r,
    level: lvl,
    salary,
    avatar: pick(AVATARS[r]),
    fee: Math.round(salary * 0.5),
  };
}

export function refreshCandidates(s: GameState) {
  s.candidates = [];
  const roles = Object.keys(ROLES) as Role[];
  // aseguramos que siempre haya un agente IA
  s.candidates.push(makeCandidate(s, "ai"));
  for (let i = 0; i < 3; i++) s.candidates.push(makeCandidate(s, pick(roles)));
  s.candidatesDay = s.day;
}

export function newGame(opts: { startupName: string; founderName: string; sector: string; restarts?: number }): GameState {
  const s: GameState = {
    version: 1,
    id: `g${Date.now().toString(36)}`,
    startupName: opts.startupName || randomStartupName(),
    founderName: opts.founderName || "Fundador/a",
    sector: opts.sector,
    day: 1,
    cash: START_CASH + (opts.restarts ?? 0) * 10000,
    users: 0,
    hype: 15,
    morale: 70,
    bugs: 0,
    equity: 100,
    stage: 0,
    office: 0,
    employees: [],
    candidates: [],
    candidatesDay: 1,
    currentFeature: "mvp",
    featureProgress: 0,
    done: [],
    log: [],
    pendingEvent: null,
    nextEventDay: tuning.firstEventDay,
    pace: pick([tuning.paceTranquila, tuning.paceNormal, tuning.paceCaotica]),
    seenEvents: [],
    eventCount: 0,
    lastEventDay: -99,
    reactiveCd: {},
    lastShipDay: 1,
    hypeHighDays: 0,
    officeFullDays: 0,
    usersHistory: [],
    bankruptDays: 0,
    gameOver: null,
    restarts: opts.restarts ?? 0,
    stats: { totalRevenue: 0, peakUsers: 0, raised: 0, hires: 0 },
    achievements: [],
    portfolio: [],
    lastTickAt: Date.now(),
    speed: 1,
    nextId: 1,
  };
  s.employees.push({ id: `e${s.nextId++}`, name: opts.founderName || "Fundador/a", role: "dev", level: 2, salary: 0, avatar: "🧑‍🚀", founder: true });
  s.employees.push({ id: `e${s.nextId++}`, name: "Claudio Mini", role: "ai", level: 1, salary: 600, avatar: "🤖" });
  refreshCandidates(s);
  addLog(s, `Nace ${s.startupName}. Tenés $${START_CASH.toLocaleString("es-AR")}, un garage, una laptop y una suscripción a la IA.`, "info");
  return s;
}

export function addLog(s: GameState, text: string, kind: LogEntry["kind"] = "info") {
  s.log.unshift({ day: s.day, text, kind });
  if (s.log.length > 40) s.log.length = 40;
}

export function derive(s: GameState): Derived {
  const office = OFFICES[s.office];
  const sector = SECTORS.find((x) => x.id === s.sector) ?? SECTORS[1];
  const moraleMul = 0.5 + s.morale / 200; // 0.5..1
  const pts = (role: Role) => s.employees.filter((e) => e.role === role).reduce((a, e) => a + e.level * (e.founder ? 1.5 : 1), 0) * moraleMul;
  const aiPts = pts("ai") * 1.6; // la IA vibecodea rápido
  const humanDev = pts("dev");
  const devPts = aiPts + humanDev + pts("ops") * 0.2;
  const qaPts = pts("qa");
  const mktPts = pts("marketing");
  const salesPts = pts("sales");
  const designPts = pts("design");
  const opsPts = pts("ops");

  const fx = { growth: 0, arpu: 0, churn: 0, quality: 0 };
  for (const id of s.done) {
    const f = FEATURES.find((x) => x.id === id);
    if (!f) continue;
    fx.growth += f.effects.growth ?? 0;
    fx.arpu += f.effects.arpu ?? 0;
    fx.churn += f.effects.churn ?? 0;
    fx.quality += f.effects.quality ?? 0;
  }
  const hasMvp = s.done.includes("mvp");
  const quality = clamp(fx.quality + designPts * 4 - s.bugs * 0.6, 0, 100);
  const arpu = hasMvp ? Math.max(0.5, 1.5 + sector.arpu + fx.arpu + salesPts * 0.25) : 0;
  const mrr = s.users * arpu;
  const revenueDay = mrr / 30;
  const salariesMonth = s.employees.reduce((a, e) => a + e.salary, 0);
  const rentMonth = office.rent;
  const serverMonth = (s.users * (s.sector === "ai" ? 0.35 : 0.15) + aiPts * 120) * (1 - Math.min(0.6, opsPts * 0.08));
  const costDay = (salariesMonth + rentMonth + serverMonth) / 30;
  const growthMul = (1 + fx.growth + sector.growth) * (0.3 + (quality / 100) * 0.9) * (0.5 + (s.hype / 100) * 0.7);
  const saturation = Math.max(0, 1 - s.users / sector.tam); // el mercado se agota
  const base = hasMvp ? 2 + mktPts * 3 + s.hype * 0.2 : 0;
  const viral = hasMvp ? s.users * 0.0025 * (quality / 100) * (0.4 + s.hype / 100) : 0;
  const newUsersDay = (base + viral) * growthMul * saturation;
  const churnRate = clamp(0.012 + s.bugs * 0.0008 - fx.churn - designPts * 0.0008, 0.003, 0.15);
  const churnDay = s.users * churnRate;
  const stage = STAGES[s.stage];
  const valuation = Math.max(0, mrr * 12 * stage.multiple + s.users * 8 + Math.max(0, s.cash) * 0.5 + s.done.length * 5000);
  const featureDaysLeft = s.currentFeature
    ? devPts > 0
      ? Math.ceil(((FEATURES.find((f) => f.id === s.currentFeature)?.cost ?? 0) - s.featureProgress) / devPts)
      : null
    : null;
  return {
    devPts, qaPts, mktPts, salesPts, designPts, opsPts, quality, arpu, mrr, revenueDay, costDay,
    salariesMonth, rentMonth, serverMonth, netDay: revenueDay - costDay, newUsersDay, churnDay, valuation,
    capacity: office.capacity, featureDaysLeft,
  };
}

export function featureAvailable(s: GameState, id: string) {
  const f = FEATURES.find((x) => x.id === id);
  if (!f || s.done.includes(id)) return false;
  return (f.requires ?? []).every((r) => s.done.includes(r));
}

/** Un día de juego. `quiet` = sin eventos (para progreso offline). */
export function tick(s: GameState, quiet = false) {
  if (s.gameOver || s.pendingEvent) return;
  // defensa para guardados de versiones anteriores
  s.usersHistory ??= [];
  s.seenEvents ??= [];
  s.reactiveCd ??= {};
  s.eventCount ??= 0;
  s.lastEventDay ??= -99;
  s.lastShipDay ??= s.day;
  s.pace ??= 1;
  const d = derive(s);
  s.day += 1;

  // desarrollo
  if (s.currentFeature) {
    s.featureProgress += d.devPts;
    // la IA deja deuda técnica; los devs humanos la contienen
    const aiShare = s.employees.filter((e) => e.role === "ai").reduce((a, e) => a + e.level, 0) * 1.6;
    const humanShare = s.employees.filter((e) => e.role === "dev").reduce((a, e) => a + e.level * (e.founder ? 1.5 : 1), 0);
    s.bugs += Math.max(0, aiShare * 0.1 - humanShare * 0.1) + humanShare * 0.03;
    const f = FEATURES.find((x) => x.id === s.currentFeature)!;
    if (s.featureProgress >= f.cost) {
      s.done.push(f.id);
      s.lastShipDay = s.day;
      s.featureProgress = 0;
      s.currentFeature = null;
      if (f.effects.hype) s.hype = clamp(s.hype + f.effects.hype, 0, 100);
      addLog(s, `${f.icon} Lanzaste ${f.name}.`, "good");
      // autoelegir la siguiente disponible más barata
      const next = FEATURES.filter((x) => featureAvailable(s, x.id)).sort((a, b) => a.cost - b.cost)[0];
      if (next) s.currentFeature = next.id;
    }
  }
  // bugs
  s.bugs = Math.max(0, s.bugs * 0.95 - d.qaPts * 1.0 - 0.05);

  // usuarios
  const added = d.newUsersDay + rnd(-0.1, 0.1) * d.newUsersDay;
  s.users = Math.max(0, s.users + added - d.churnDay);
  s.stats.peakUsers = Math.max(s.stats.peakUsers, s.users);

  // dinero
  s.cash += d.netDay;
  s.stats.totalRevenue += d.revenueDay;

  // portfolio (inversiones en otras startups)
  for (const p of s.portfolio) {
    const div = (p.lastMrr / 30) * p.stake * 0.5;
    s.cash += div;
  }

  // hype y moral
  s.hype = clamp(s.hype - 0.7 + d.mktPts * 0.25, 0, 100);
  const targetMorale = OFFICES[s.office].morale + d.opsPts * 2 - (s.cash < 0 ? 25 : 0) - (s.employees.length > d.capacity ? 15 : 0);
  s.morale = clamp(s.morale + (targetMorale - s.morale) * 0.05, 0, 100);

  // quiebra
  if (s.cash < 0) {
    s.bankruptDays += 1;
    if (s.bankruptDays === 1) addLog(s, "Estás en rojo. Tenés 12 días para arreglarlo o cerrás.", "bad");
    if (s.bankruptDays >= 12) {
      s.gameOver = "bankrupt";
      addLog(s, "💀 Sin plata y sin inversores. Cerró la startup.", "bad");
      return;
    }
  } else s.bankruptDays = 0;

  // candidatos
  if (s.day - s.candidatesDay >= 7) refreshCandidates(s);

  // contexto para los eventos reactivos
  s.usersHistory.push(s.users);
  if (s.usersHistory.length > 21) s.usersHistory.shift();
  s.hypeHighDays = s.hype > 85 ? s.hypeHighDays + 1 : 0;
  s.officeFullDays = s.employees.length >= OFFICES[s.office].capacity ? s.officeFullDays + 1 : 0;

  if (!quiet) scheduleEvent(s);
  else if (s.day >= s.nextEventDay) s.nextEventDay = s.day + Math.round(rnd(3, 8));

  // IPO
  if (d.valuation >= IPO_VALUATION && s.stage < STAGES.length - 1) {
    s.stage = STAGES.length - 1;
    addLog(s, "🦄 ¡Sos unicornio! Valuación de $1B. Podés salir a bolsa cuando quieras.", "good");
  }
  checkAchievements(s, d);
}

export function reactiveCtx(s: GameState): ReactiveCtx {
  return {
    lastShipDay: s.lastShipDay,
    hypeHighDays: s.hypeHighDays,
    officeFullDays: s.officeFullDays,
    users20: s.usersHistory[0] ?? 0,
  };
}

/** Intervalo base entre popups según el tamaño de la empresa. */
function eventInterval(s: GameState): [number, number] {
  if (s.stage <= 1 && s.employees.length < 6) return tuning.intervalSmall;
  if (s.stage <= 3) return tuning.intervalMid;
  return tuning.intervalBig;
}

/** Decide si hoy aparece un popup: primero los reactivos, después el calendario. */
function scheduleEvent(s: GameState) {
  if (s.pendingEvent) return;
  const capped = s.eventCount >= tuning.cap;
  const sep = capped ? tuning.separation * 2 : tuning.separation;
  if (s.day - s.lastEventDay < sep) return;

  // reactivos: consecuencia de cómo venís jugando
  const ctx = reactiveCtx(s);
  for (const e of EVENTS) {
    if (!e.reactive) continue;
    if (e.reactive.once && s.seenEvents.includes(e.id)) continue;
    if ((s.reactiveCd[e.id] ?? -999) > s.day) continue;
    if (!e.reactive.test(s, ctx)) continue;
    fireEvent(s, e.id);
    s.reactiveCd[e.id] = s.day + Math.round(e.reactive.cooldown * tuning.reactiveCooldownMul);
    return;
  }

  // calendario: se apaga al llegar al tope
  if (capped || s.day < s.nextEventDay) return;
  const disponibles = EVENTS.filter(
    (e) =>
      !e.reactive &&
      (e.sector === undefined || e.sector === s.sector) &&
      (e.minDay ?? 0) <= s.day &&
      (e.minUsers ?? 0) <= s.users &&
      !s.seenEvents.includes(e.id),
  );
  if (!disponibles.length) {
    s.nextEventDay = s.day + 3; // nada disponible todavía: reintenta pronto
    return;
  }
  fireEvent(s, pick(disponibles).id);
  const [a, b] = eventInterval(s);
  s.nextEventDay = s.day + Math.max(sep, Math.round(rnd(a, b) * s.pace));
}

function fireEvent(s: GameState, id: string) {
  s.pendingEvent = { id, day: s.day };
  if (!s.seenEvents.includes(id)) s.seenEvents.push(id);
  s.eventCount += 1;
  s.lastEventDay = s.day;
}

export function resolveEvent(s: GameState, choiceIdx: number) {
  if (!s.pendingEvent) return;
  const ev = EVENTS.find((e) => e.id === s.pendingEvent!.id);
  s.pendingEvent = null;
  if (!ev) return;
  const c = ev.choices[choiceIdx] ?? ev.choices[0];
  const ok = c.chance === undefined || !tuning.chanceEnabled ? true : Math.random() < c.chance;
  const result = c.apply(s, ok);
  addLog(s, `${ev.icon} ${ev.title}: ${result}`, c.chance !== undefined && !ok ? "bad" : "info");
}

export function hire(s: GameState, candId: string): string | null {
  const c = s.candidates.find((x) => x.id === candId);
  if (!c) return "Ese candidato ya no está.";
  const cap = OFFICES[s.office].capacity;
  if (s.employees.length >= cap) return `Tu ${OFFICES[s.office].name} está lleno (${cap}). Mudate a una oficina más grande.`;
  if (s.cash < c.fee) return "No te alcanza para el fee de contratación.";
  s.cash -= c.fee;
  const { fee: _fee, ...emp } = c;
  void _fee;
  s.employees.push(emp);
  s.candidates = s.candidates.filter((x) => x.id !== candId);
  s.stats.hires += 1;
  addLog(s, `${emp.avatar} ${emp.role === "ai" ? "Activaste" : "Contrataste"} a ${emp.name} (${ROLES[emp.role].name} ${(emp.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[emp.level]}).`, "good");
  return null;
}

export function fire(s: GameState, empId: string): string | null {
  const e = s.employees.find((x) => x.id === empId);
  if (!e) return null;
  if (e.founder) return "No podés echarte a vos mismo. Todavía.";
  s.employees = s.employees.filter((x) => x.id !== empId);
  if (e.role === "ai") {
    addLog(s, `Cancelaste la suscripción de ${e.name}.`, "info");
  } else {
    s.morale = clamp(s.morale - 6, 0, 100);
    addLog(s, `${e.name} dejó la empresa.`, "bad");
  }
  return null;
}

export function rerollCandidates(s: GameState): string | null {
  const cost = 500 + s.employees.length * 100;
  if (s.cash < cost) return "No te alcanza.";
  s.cash -= cost;
  refreshCandidates(s);
  return null;
}

export function setFeature(s: GameState, id: string): string | null {
  if (!featureAvailable(s, id)) return "Todavía no podés construir eso.";
  if (s.currentFeature !== id) {
    s.currentFeature = id;
    s.featureProgress = 0;
  }
  return null;
}

export function upgradeOffice(s: GameState): string | null {
  const next = OFFICES[s.office + 1];
  if (!next) return "Ya estás en la oficina más grande.";
  if (s.cash < next.cost) return `Necesitás $${next.cost.toLocaleString("es-AR")}.`;
  s.cash -= next.cost;
  s.office += 1;
  s.morale = clamp(s.morale + 10, 0, 100);
  addLog(s, `${next.icon} Mudanza a ${next.name}. Lugar para ${next.capacity} personas.`, "good");
  return null;
}

export function raiseRound(s: GameState): string | null {
  const d = derive(s);
  const next = STAGES[s.stage + 1];
  if (!next || next.raise === 0) return "No hay más rondas. Toca IPO.";
  if (d.valuation < next.minValuation) return `Los inversores quieren ver una valuación de $${next.minValuation.toLocaleString("es-AR")}.`;
  s.cash += next.raise;
  s.equity -= next.equity;
  s.stage += 1;
  s.stats.raised += next.raise;
  s.hype = clamp(s.hype + 20, 0, 100);
  s.bankruptDays = 0;
  addLog(s, `💸 Cerraste la ronda ${next.name}: $${next.raise.toLocaleString("es-AR")} por ${next.equity}% de equity.`, "good");
  return null;
}

export function ipo(s: GameState): string | null {
  const d = derive(s);
  if (d.valuation < IPO_VALUATION) return "Para salir a bolsa necesitás valer $1B.";
  s.gameOver = "ipo";
  addLog(s, "🔔 ¡Tocaste la campana! IPO exitosa.", "good");
  return null;
}

export function marketingPush(s: GameState): string | null {
  const cost = Math.round(2000 + s.users * 0.5);
  if (s.cash < cost) return "No te alcanza.";
  s.cash -= cost;
  s.hype = clamp(s.hype + 15, 0, 100);
  addLog(s, `📣 Campaña de marketing: +15 hype por $${cost.toLocaleString("es-AR")}.`, "info");
  return null;
}

export function teamPerk(s: GameState): string | null {
  const cost = Math.round(300 * s.employees.length);
  if (s.cash < cost) return "No te alcanza.";
  s.cash -= cost;
  s.morale = clamp(s.morale + 12, 0, 100);
  addLog(s, `🥩 Asado de equipo: +12 moral por $${cost.toLocaleString("es-AR")}.`, "info");
  return null;
}

export function investOut(s: GameState, amount: number, target: { id: string; name: string; valuation: number; mrr: number }): string | null {
  if (amount <= 0) return "Monto inválido.";
  if (s.cash < amount) return "No te alcanza.";
  if (s.portfolio.some((p) => p.targetId === target.id)) return "Ya invertiste en esta startup.";
  s.cash -= amount;
  const stake = amount / Math.max(1, target.valuation + amount);
  s.portfolio.push({ targetId: target.id, targetName: target.name, amount, stake, day: s.day, lastMrr: target.mrr });
  addLog(s, `🤝 Invertiste $${amount.toLocaleString("es-AR")} en ${target.name} (${(stake * 100).toFixed(1)}%).`, "social");
  return null;
}

/** Aplica acciones sociales recibidas de otros jugadores. */
export function applyIncoming(s: GameState, a: { kind: string; from_name: string; payload: Record<string, unknown> }) {
  if (a.kind === "invest") {
    const amt = Number(a.payload.amount ?? 0);
    s.cash += amt;
    s.hype = clamp(s.hype + 8, 0, 100);
    s.stats.raised += amt;
    addLog(s, `💰 ${a.from_name} invirtió $${amt.toLocaleString("es-AR")} en tu startup.`, "social");
  } else if (a.kind === "hype") {
    s.hype = clamp(s.hype + 5, 0, 100);
    addLog(s, `🔥 ${a.from_name} le dio hype a tu startup (+5).`, "social");
  } else if (a.kind === "poach") {
    const empId = String(a.payload.employeeId ?? "");
    const e = s.employees.find((x) => x.id === empId && !x.founder);
    const comp = Number(a.payload.compensation ?? 0);
    if (e) {
      s.employees = s.employees.filter((x) => x.id !== empId);
      s.cash += comp;
      s.morale = clamp(s.morale - 5, 0, 100);
      addLog(s, `😤 ${a.from_name} te robó a ${e.name}. Te dejaron $${comp.toLocaleString("es-AR")} de indemnización.`, "social");
    } else {
      s.cash += Math.round(comp / 2);
      addLog(s, `${a.from_name} intentó robarte gente, pero ya no estaba. Cobraste igual.`, "social");
    }
  }
}

export function applyOffline(s: GameState, now = Date.now()): number {
  const elapsed = now - s.lastTickAt;
  const days = Math.min(OFFLINE_MAX_DAYS, Math.floor(elapsed / TICK_MS));
  if (days <= 0) return 0;
  const before = s.cash;
  const beforeDay = s.day;
  for (let i = 0; i < days; i++) {
    tick(s, true);
    if (s.gameOver || s.pendingEvent) break; // un evento pendiente frena el tiempo
  }
  s.lastTickAt = now;
  const simulated = s.day - beforeDay;
  if (simulated <= 0) return 0;
  const delta = s.cash - before;
  addLog(s, `⏰ Pasaron ${simulated} días mientras no estabas. Caja: ${delta >= 0 ? "+" : ""}$${Math.round(delta).toLocaleString("es-AR")}.`, "info");
  return simulated;
}

const ACHIEVEMENTS: { id: string; name: string; icon: string; test: (s: GameState, d: Derived) => boolean }[] = [
  { id: "mvp", name: "Shippeaste un finde", icon: "🚀", test: (s) => s.done.includes("mvp") },
  { id: "ai5", name: "5 agentes IA", icon: "🤖", test: (s) => s.employees.filter((e) => e.role === "ai").length >= 5 },
  { id: "clean", name: "Cero deuda técnica", icon: "🧹", test: (s) => s.day > 30 && s.bugs < 0.5 },
  { id: "u100", name: "100 usuarios", icon: "👥", test: (s) => s.users >= 100 },
  { id: "u10k", name: "10.000 usuarios", icon: "🌊", test: (s) => s.users >= 10000 },
  { id: "u1m", name: "1 millón de usuarios", icon: "🌍", test: (s) => s.users >= 1000000 },
  { id: "team10", name: "Equipo de 10", icon: "🧑‍🤝‍🧑", test: (s) => s.employees.length >= 10 },
  { id: "mrr10k", name: "$10k MRR", icon: "💵", test: (_s, d) => d.mrr >= 10000 },
  { id: "mrr1m", name: "$1M MRR", icon: "🏦", test: (_s, d) => d.mrr >= 1000000 },
  { id: "seed", name: "Ronda Seed", icon: "🌱", test: (s) => s.stage >= 2 },
  { id: "seriesa", name: "Serie A", icon: "🅰️", test: (s) => s.stage >= 3 },
  { id: "unicorn", name: "Unicornio", icon: "🦄", test: (_s, d) => d.valuation >= IPO_VALUATION },
  { id: "investor", name: "Inversor ángel", icon: "😇", test: (s) => s.portfolio.length > 0 },
  { id: "survivor", name: "Sobreviviste al rojo", icon: "🩹", test: (s) => s.bankruptDays === 0 && s.log.some((l) => l.text.startsWith("Estás en rojo")) },
];
export const ACHIEVEMENT_DEFS = ACHIEVEMENTS;

function checkAchievements(s: GameState, d: Derived) {
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.test(s, d)) {
      s.achievements.push(a.id);
      addLog(s, `🏆 Logro: ${a.name}`, "good");
    }
  }
}

export function poachCost(e: Employee) {
  return Math.round(e.salary * 4 + 2000);
}

export type { Employee };
