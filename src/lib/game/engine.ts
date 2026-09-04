import { ADS_LEVELS, AI_LEVEL_NAMES, AI_NAMES, AUTO_CAMPAIGNS, AVATARS, BUILD_IN_PUBLIC, BURNOUT, CAMPAIGNS, CUSTOM_FEATURE_NAMES, EVENTS, EVENT_DEFAULT_DAYS, EXECS, ONBOARDING_DAYS, SALARY_INFLATION, FEATURES, NEW_FEATURE_ID, REBRAND_ID, FIRST_NAMES, IPO_VALUATION, LAST_NAMES, LEVEL_NAMES, OFFICES, OFFLINE_MAX_DAYS, ROLES, SECTORS, STAGES, START_CASH, STARTUP_NAME_PARTS, TICK_MS } from "./data";
import type { Candidate, Derived, Employee, EventPayload, ExecRole, ExecStatus, FeatureDef, GameEventDef, GameState, Level, LogEntry, PendingEvent, Role } from "./types";

const EXEC_SET = new Set<string>(["cto", "cmo", "cfo", "coo"]);
export function isExec(role: Role) {
  return EXEC_SET.has(role);
}
/** Sueldo de un ejecutivo: escala con la valuación (x1 a 50k, x2 a 500k, x3 a 5M, x4 a 50M...). */
export function execSalary(role: ExecRole, grossValuation: number) {
  const def = EXECS.find((e) => e.role === role)!;
  const mult = 1 + Math.log10(Math.max(1, grossValuation / 50000));
  return Math.round((def.baseSalary * Math.max(1, mult)) / 100) * 100;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function randomStartupName() {
  return pick(STARTUP_NAME_PARTS.a) + pick(STARTUP_NAME_PARTS.b);
}

export function makeCandidate(s: GameState, role?: Role): Candidate {
  const r = role ?? pick((Object.keys(ROLES) as Role[]).filter((x) => !isExec(x)));
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
    events: [],
    nextEventDay: 10,
    lastEventDay: 0,
    effects: [],
    crunch: false,
    burnout: 0,
    founderOffUntil: 0,
    bankruptDays: 0,
    lastRaiseDay: 1,
    gameOver: null,
    restarts: opts.restarts ?? 0,
    stats: { totalRevenue: 0, peakUsers: 0, raised: 0, hires: 0 },
    achievements: [],
    portfolio: [],
    followers: 0,
    campaignCooldowns: {},
    adsLevel: 0,
    buildInPublic: false,
    customFeatures: 0,
    rebrands: 0,
    pendingRename: false,
    exitAmount: 0,
    lastTickAt: Date.now(),
    speed: 1,
    nextId: 1,
  };
  s.employees.push({ id: `e${s.nextId++}`, name: opts.founderName || "Fundador/a", role: "dev", level: 2, salary: 0, avatar: "🧑‍🚀", founder: true });
  s.employees.push({ id: `e${s.nextId++}`, name: "Claudio Mini", role: "ai", level: 1, salary: 600, avatar: "🤖" });
  refreshCandidates(s);
  addLog(s, `Nace ${s.startupName}. Tenés $${START_CASH.toLocaleString("es-AR")}, un garage, una laptop y una suscripción a la IA. El equipo arranca por el MVP.`, "info");
  return s;
}

export function addLog(s: GameState, text: string, kind: LogEntry["kind"] = "info") {
  s.log.unshift({ day: s.day, text, kind });
  if (s.log.length > 40) s.log.length = 40;
}

export function derive(s: GameState): Derived {
  const office = OFFICES[s.office];
  const sector = SECTORS.find((x) => x.id === s.sector) ?? SECTORS[1];
  const has = (r: ExecRole) => s.employees.some((e) => e.role === r);
  const needs = (r: ExecRole) => !has(r) && Boolean(EXECS.find((e) => e.role === r)!.needed(s));
  // burocracia: cada persona por encima de 10 resta productividad; el COO la reduce a la mitha
  const overheadRaw = Math.min(0.4, Math.max(0, s.employees.length - 10) * 0.012);
  const overhead = 1 - overheadRaw * (has("coo") ? 0.5 : 1) - (needs("coo") ? 0.15 : 0);
  const fx0 = { cost: 1, revenue: 1, growth: 1, pts: 1 };
  for (const e of s.effects ?? []) {
    if (e.until < s.day) continue;
    fx0.cost *= e.costMul ?? 1;
    fx0.revenue *= e.revenueMul ?? 1;
    fx0.growth *= e.growthMul ?? 1;
    fx0.pts *= e.ptsMul ?? 1;
  }
  const crunchMul = s.crunch ? 1.3 : 1;
  const moraleMul = (0.5 + s.morale / 200) * overhead * crunchMul * fx0.pts; // 0.5..1, menos burocracia
  const founderOff = s.founderOffUntil > s.day;
  const personFactor = (e: Employee) => {
    if (e.founder) return founderOff ? 0 : 1.5 * (1 - s.burnout / 200);
    if (e.role === "ai") return 1;
    const days = s.day - (e.hiredDay ?? -999);
    return days < ONBOARDING_DAYS ? 0.5 + (0.5 * days) / ONBOARDING_DAYS : 1;
  };
  const pts = (role: Role) => s.employees.filter((e) => e.role === role).reduce((a, e) => a + e.level * personFactor(e), 0) * moraleMul;
  const aiPts = pts("ai") * 1.6; // la IA vibecodea rápido
  const humanDev = pts("dev");
  const devMul = has("cto") ? 1.1 : needs("cto") ? 0.7 : 1;
  const devPts = (aiPts + humanDev + pts("ops") * 0.2) * devMul;
  const qaPts = pts("qa");
  const mktPts = pts("marketing");
  const salesPts = pts("sales");
  const designPts = pts("design");
  const socialPts = pts("social");
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
  fx.growth += s.customFeatures * 0.08;
  fx.arpu += s.customFeatures * 0.15;
  fx.quality += s.customFeatures * 1;
  const hasMvp = s.done.includes("mvp");
  const hasPrd = s.done.includes("prd");
  const quality = clamp(fx.quality + designPts * 4 - s.bugs * 0.6, 0, 100);
  const arpu = hasMvp ? Math.max(0.5, 1.5 + sector.arpu + fx.arpu + salesPts * 0.25) : 0;
  const mrr = s.users * arpu;
  const revenueDay = (mrr / 30) * fx0.revenue;
  // valuación bruta preliminar para el sueldo de los ejecutivos (sin cash ni deuda, evita circularidad)
  const arpuPre = hasMvp ? Math.max(0.5, 1.5 + sector.arpu + fx.arpu + salesPts * 0.25) : 0;
  const prelimValuation = s.users * arpuPre * 12 * STAGES[s.stage].multiple + s.users * 8;
  const salariesMonth = s.employees.reduce((a, e) => a + (isExec(e.role) ? execSalary(e.role as ExecRole, prelimValuation) : e.salary), 0);
  const rentMonth = office.rent;
  const serverMonth = (s.users * (s.sector === "ai" ? 0.35 : 0.15) + aiPts * 120) * (1 - Math.min(0.6, opsPts * 0.08));
  const adsCostDay = ADS_LEVELS[s.adsLevel]?.spendDay ?? 0;
  const costMul = has("cfo") ? 0.92 : needs("cfo") ? 1.15 : 1;
  const costDay = ((salariesMonth + rentMonth + serverMonth) / 30 + adsCostDay) * costMul * fx0.cost;
  const cmoMul = has("cmo") ? 1.15 : needs("cmo") ? 0.65 : 1;
  const growthMul = (1 + fx.growth + sector.growth) * (0.3 + (quality / 100) * 0.9) * (0.5 + (s.hype / 100) * 0.7) * (hasPrd ? 1 : 0.65) * cmoMul * fx0.growth;
  const saturation = Math.max(0, 1 - s.users / sector.tam); // el mercado se agota
  const base = hasMvp ? 1.5 + mktPts * 2.5 + s.hype * 0.15 : 0;
  const viral = hasMvp ? s.users * 0.0016 * (quality / 100) * (0.4 + s.hype / 100) : 0;
  const organicUsersDay = hasMvp ? Math.min(s.followers * 0.0012, 1500 + s.followers * 0.0004) * (0.5 + quality / 200) * saturation : 0;
  const cac = 25 + s.users * 0.003; // cada usuario pago sale más caro a medida que crecés
  const adsUsersDay = hasMvp ? (adsCostDay / cac) * (0.5 + quality / 200) * saturation : 0;
  const newUsersDay = (base + viral) * growthMul * saturation + organicUsersDay + adsUsersDay;
  const bip = s.buildInPublic;
  // a más hype, más rápido se enfría; seguidores, growth, community, ads y #buildinpublic lo sostienen
  const hypeDecayDay = 0.5 + s.hype * 0.012 - Math.min(0.5, s.followers / 60000) - mktPts * 0.15 - socialPts * 0.1 - s.adsLevel * 0.12 - (bip ? BUILD_IN_PUBLIC.hypeDay : 0) + (needs("cmo") ? 0.4 : 0) - (has("cmo") ? 0.2 : 0);
  const followersDay = s.hype * 0.3 + mktPts * 5 + socialPts * 25 + s.adsLevel * 15 + (bip ? BUILD_IN_PUBLIC.followersDay : 0) - s.followers * 0.006;
  const churnRate = clamp(0.012 + s.bugs * 0.0008 - fx.churn - designPts * 0.0008, 0.003, 0.15);
  const churnDay = s.users * churnRate;
  const stage = STAGES[s.stage];
  const grossValuation = Math.max(0, mrr * 12 * stage.multiple + s.users * 8 + Math.max(0, s.cash) * 0.5 + (s.done.length + s.customFeatures) * 5000);
  const valuation = grossValuation;
  const featureDaysLeft = s.currentFeature ? (devPts > 0 ? Math.ceil((getFeature(s, s.currentFeature).cost - s.featureProgress) / devPts) : null) : null;
  const sellOffer = hasMvp ? valuation * (0.7 + s.hype / 500) : 0;
  const execs: ExecStatus[] = EXECS.map((e) => {
    const salary = execSalary(e.role, grossValuation);
    return { role: e.role, hired: has(e.role), neededWhy: has(e.role) ? null : e.needed(s), salary, fee: salary * 2 };
  });
  return {
    devPts, qaPts, mktPts, salesPts, designPts, socialPts, opsPts, quality, arpu, mrr, revenueDay, costDay,
    salariesMonth, rentMonth, serverMonth, netDay: revenueDay - costDay, newUsersDay, churnDay, valuation,
    capacity: office.capacity, featureDaysLeft, sellOffer,
    hypeDecayDay, followersDay, organicUsersDay, adsCostDay, adsUsersDay, execs, overhead,
    incidentChance: Math.min(0.06, s.bugs * 0.0015), effectCostMul: fx0.cost, effectRevenueMul: fx0.revenue, effectPtsMul: fx0.pts,
  };
}

/** Definición de una feature, incluyendo los proyectos repetibles (feature nueva, rebranding). */
export function getFeature(s: GameState, id: string): FeatureDef {
  if (id === NEW_FEATURE_ID) {
    const n = s.customFeatures + 1;
    return { id, name: `Feature nueva #${n}`, icon: "✨", desc: "Algo que pidió un usuario. Suma un poco de crecimiento, ARPU y calidad. Nunca se acaban.", cost: Math.round(30 * Math.pow(1.18, s.customFeatures)), effects: { growth: 0.08, arpu: 0.15, quality: 1, hype: 8 } };
  }
  if (id === REBRAND_ID) {
    return { id, name: s.rebrands > 0 ? `Rebranding #${s.rebrands + 1}` : "Rebranding", icon: "🎨", desc: "Logo nuevo, nombre nuevo, mismo producto. Mucho hype, algunos usuarios se confunden.", cost: Math.round(25 * Math.pow(1.4, s.rebrands)), effects: { hype: 35, quality: 5 } };
  }
  return FEATURES.find((x) => x.id === id) ?? { id, name: id, icon: "❓", desc: "", cost: 1, effects: {} };
}

export function isRepeatable(id: string) {
  return id === NEW_FEATURE_ID || id === REBRAND_ID;
}

export function featureAvailable(s: GameState, id: string) {
  if (isRepeatable(id)) return s.done.includes("mvp");
  const f = FEATURES.find((x) => x.id === id);
  if (!f || s.done.includes(id)) return false;
  return (f.requires ?? []).every((r) => s.done.includes(r));
}

/** Un día de juego. `quiet` = sin eventos (para progreso offline). */
export function tick(s: GameState, quiet = false) {
  if (s.gameOver) return;
  const d = derive(s);
  s.day += 1;

  // efectos temporales vencidos
  s.effects = s.effects.filter((e) => e.until >= s.day);

  // decisiones que se vencen: se resuelven solas con la opción pasiva
  if (!quiet) {
    for (let i = s.events.length - 1; i >= 0; i--) {
      if (s.events[i].expiresDay <= s.day) {
        const def = EVENTS.find((e) => e.id === s.events[i].id);
        const idx = def?.defaultChoice ?? (def ? def.choices.length - 1 : 0);
        resolveEvent(s, i, idx, true);
      }
    }
  }

  // crunch y burnout del fundador
  if (s.crunch) s.burnout = clamp(s.burnout + BURNOUT.crunchPerDay, 0, 100);
  else s.burnout = clamp(s.burnout - (s.morale > 60 ? BURNOUT.recoverPerDay : BURNOUT.recoverPerDay * 0.5), 0, 100);
  if (s.cash < 0) s.burnout = clamp(s.burnout + BURNOUT.redPerDay, 0, 100);
  if (s.founderOffUntil === s.day) addLog(s, "🧘 Volviste de la licencia. Hay 400 mensajes sin leer.", "info");
  if (!quiet && s.burnout >= BURNOUT.breakAt && s.founderOffUntil < s.day && !s.events.some((e) => e.id === "burnout_founder")) pushEvent(s, "burnout_founder", undefined, true);

  // desarrollo
  if (s.currentFeature) {
    s.featureProgress += d.devPts;
    // la IA deja deuda técnica; los devs humanos la contienen
    const aiShare = s.employees.filter((e) => e.role === "ai").reduce((a, e) => a + e.level, 0) * 1.6;
    const humanShare = s.employees.filter((e) => e.role === "dev").reduce((a, e) => a + e.level * (e.founder ? 1.5 : 1), 0);
    const hasCto = s.employees.some((e) => e.role === "cto");
    const needsCto = !hasCto && Boolean(EXECS[0].needed(s));
    s.bugs += (Math.max(0, aiShare * 0.1 - humanShare * 0.1) + humanShare * 0.03) * (hasCto ? 0.75 : needsCto ? 1.6 : 1);
    const f = getFeature(s, s.currentFeature);
    if (s.featureProgress >= f.cost) {
      s.featureProgress = 0;
      s.currentFeature = null;
      if (f.effects.hype) s.hype = clamp(s.hype + f.effects.hype, 0, 100);
      if (f.id === NEW_FEATURE_ID) {
        s.customFeatures += 1;
        const name = CUSTOM_FEATURE_NAMES[(s.customFeatures - 1) % CUSTOM_FEATURE_NAMES.length];
        addLog(s, `✨ Lanzaste ${name} (feature #${s.customFeatures}).`, "good");
        s.currentFeature = NEW_FEATURE_ID; // nunca se acaban
      } else if (f.id === REBRAND_ID) {
        s.rebrands += 1;
        s.users = Math.round(s.users * 0.97);
        s.pendingRename = true;
        addLog(s, `🎨 Rebranding listo. Elegí el nombre nuevo.`, "good");
      } else {
        s.done.push(f.id);
        // sigue solo con la más barata disponible; si no queda nada, features nuevas infinitas
        const next = FEATURES.filter((x) => featureAvailable(s, x.id)).sort((a, b) => a.cost - b.cost)[0];
        s.currentFeature = next ? next.id : NEW_FEATURE_ID;
        const nf = getFeature(s, s.currentFeature);
        addLog(s, `${f.icon} Lanzaste ${f.name}. El equipo sigue con ${nf.icon} ${nf.name} (podés cambiarlo en Producto).`, "good");
      }
    }
  }
  // bugs
  s.bugs = Math.max(0, s.bugs * 0.95 - d.qaPts * 1.0 - 0.05);

  // usuarios
  const added = d.newUsersDay + rnd(-0.1, 0.1) * d.newUsersDay;
  s.users = Math.max(0, s.users + added - d.churnDay);
  s.stats.peakUsers = Math.max(s.stats.peakUsers, s.users);

  // dinero
  s.cash += d.revenueDay - d.costDay;
  s.stats.totalRevenue += d.revenueDay;


  // portfolio (inversiones en otras startups)
  for (const p of s.portfolio) {
    const div = (p.lastMrr / 30) * p.stake * 0.5;
    s.cash += div;
  }

  // hype y moral
  s.hype = clamp(s.hype - d.hypeDecayDay, 0, 100);
  s.followers = Math.max(0, s.followers + d.followersDay);

  // community: las campañas salen solas según cuánta gente de redes tenés
  if (d.socialPts > 0 && !quiet) {
    const cm = s.employees.filter((e) => e.role === "social");
    for (const a of AUTO_CAMPAIGNS) {
      if (d.socialPts < a.minPts) continue;
      const st = campaignStatus(s, a.id);
      if (!st.ok || st.cost > s.cash * 0.05) continue;
      const who = cm[Math.floor(Math.random() * cm.length)];
      const err = runCampaign(s, a.id, who?.name);
      if (!err) break; // una por día
    }
  }
  const hasCoo = s.employees.some((e) => e.role === "coo");
  const needsCoo = !hasCoo && Boolean(EXECS[3].needed(s));
  const targetMorale = OFFICES[s.office].morale + d.opsPts * 2 - (s.cash < 0 ? 25 : 0) - (s.employees.length > d.capacity ? 15 : 0) + (hasCoo ? 8 : 0) - (needsCoo ? 15 : 0) - (s.crunch ? 22 : 0);
  s.morale = clamp(s.morale + (targetMorale - s.morale) * 0.05, 0, 100);

  // quiebra
  if (s.cash < 0) {
    s.bankruptDays += 1;
    if (s.bankruptDays === 1) addLog(s, "Estás en rojo. Tenés 12 días para arreglarlo o cerrás: recortá gente, apagá ads o levantá una ronda.", "bad");
    if (s.bankruptDays >= 12) {
      s.gameOver = "bankrupt";
      addLog(s, "💀 Sin plata y sin inversores. Cerró la startup.", "bad");
      return;
    }
  } else s.bankruptDays = 0;

  // inflación de sueldos: los humanos piden ajuste cada 60 días
  if (s.day - s.lastRaiseDay >= SALARY_INFLATION.everyDays) {
    s.lastRaiseDay = s.day;
    let n = 0;
    for (const e of s.employees) if (!e.founder && e.role !== "ai" && !isExec(e.role)) { e.salary = Math.round((e.salary * (1 + SALARY_INFLATION.pct)) / 10) * 10; n++; }
    if (n > 0) addLog(s, `📈 Ajuste por inflación: ${n} sueldos humanos suben ${Math.round(SALARY_INFLATION.pct * 100)}%.`, "bad");
  }

  // candidatos
  if (s.day - s.candidatesDay >= 7) refreshCandidates(s);

  // renuncias: humanos con moral baja, sueldo atrasado o crunch
  if (!quiet && !s.events.some((e) => e.id === "quit_dyn")) {
    for (const e of s.employees) {
      if (e.founder || e.role === "ai" || isExec(e.role)) continue;
      if ((s.day - (e.hiredDay ?? 0)) < 20) continue;
      const market = marketSalary(s, e);
      let p = s.morale < 35 ? 0.004 : s.morale < 55 ? 0.0015 : 0.0003;
      if (s.crunch) p += 0.002;
      if (e.salary < market * 0.85) p += 0.003;
      if (Math.random() < p) {
        const offer = Math.round((Math.max(market, e.salary) * 1.25) / 50) * 50;
        const reason = s.morale < 55 ? "Dice que el clima está pesado" : e.salary < market * 0.85 ? "Dice que acá cobra menos que el mercado" : s.crunch ? "Está cansado del crunch" : "";
        pushEvent(s, "quit_dyn", { employeeId: e.id, name: e.name, roleName: ROLES[e.role].name, offer, reason });
        break;
      }
    }
  }

  // incidentes técnicos: probabilidad diaria proporcional a la deuda técnica
  if (!quiet && s.done.includes("mvp") && Math.random() < d.incidentChance && !s.events.some((e) => EVENTS.find((x) => x.id === e.id)?.incident)) {
    const pool = EVENTS.filter((e) => e.incident && (e.minDay ?? 0) <= s.day && (e.minUsers ?? 0) <= s.users);
    // con la deuda disparada (>3%/día) el incidente no espera el espaciado
    if (pool.length) pushEvent(s, pick(pool).id, undefined, d.incidentChance > 0.03);
  }

  // eventos generales
  if (!quiet && s.day >= s.nextEventDay) {
    const pool = EVENTS.filter((e) => !e.dynamic && !e.incident && (e.minDay ?? 0) <= s.day && (e.minUsers ?? 0) <= s.users && !s.events.some((x) => x.id === e.id));
    if (pool.length && pushEvent(s, pick(pool).id)) s.nextEventDay = s.day + Math.round(rnd(10, 20));
    else s.nextEventDay = s.day + 3; // reintenta en unos días
  } else if (quiet && s.day >= s.nextEventDay) {
    s.nextEventDay = s.day + Math.round(rnd(3, 8));
  }

  // IPO
  if (d.valuation >= IPO_VALUATION && s.stage < STAGES.length - 1) {
    s.stage = STAGES.length - 1;
    addLog(s, "🦄 ¡Sos unicornio! Valuación de $1B. Podés salir a bolsa cuando quieras.", "good");
  }
  checkAchievements(s, d);
}

export const EVENT_MIN_GAP = 8; // días mínimos entre decisiones (salvo urgencias)

/** Encola una decisión. Devuelve false si no había lugar (espaciado o bandeja llena). */
export function pushEvent(s: GameState, id: string, payload?: EventPayload, urgent = false): boolean {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) return false;
  if (!urgent) {
    if (s.day - s.lastEventDay < EVENT_MIN_GAP) return false;
    if (s.events.length >= 2) return false;
  }
  const pe: PendingEvent = { id, day: s.day, expiresDay: s.day + (def.days ?? EVENT_DEFAULT_DAYS), payload };
  s.events.push(pe);
  s.lastEventDay = s.day;
  return true;
}

export interface GrowthFactor {
  icon: string;
  text: string;
  effect: string; // ej. "×0.65" o "+30%"
  tone: "good" | "bad" | "neutral";
  weight: number; // para ordenar: cuánto se aleja de 1
}

/** Explica en palabras qué está empujando o frenando el crecimiento hoy. */
export function explainGrowth(s: GameState, d: Derived): GrowthFactor[] {
  const out: GrowthFactor[] = [];
  const mul = (v: number) => `×${v.toFixed(2)}`;
  const push = (icon: string, text: string, v: number, kind: "mul" | "pct" = "mul") => {
    const eff = kind === "mul" ? mul(v) : `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`;
    const w = kind === "mul" ? Math.abs(Math.log(Math.max(0.01, v))) : Math.abs(v);
    out.push({ icon, text, effect: eff, tone: (kind === "mul" ? v < 0.98 : v < 0) ? "bad" : (kind === "mul" ? v > 1.02 : v > 0) ? "good" : "neutral", weight: w });
  };
  if (!s.done.includes("mvp")) return [{ icon: "🚀", text: "Sin MVP no entra nadie. Todo lo demás no importa todavía.", effect: "×0", tone: "bad", weight: 99 }];
  const sector = SECTORS.find((x) => x.id === s.sector) ?? SECTORS[0];
  push("⭐", `Calidad ${Math.round(d.quality)}`, 0.3 + (d.quality / 100) * 0.9);
  push("🔥", `Hype ${Math.round(s.hype)}`, 0.5 + (s.hype / 100) * 0.7);
  if (!s.done.includes("prd")) push("📝", "Sin PRD el equipo construye a ciegas", 0.65);
  const cmo = d.execs.find((e) => e.role === "cmo");
  if (cmo?.hired) push("🧑‍🎤", "Tenés CMO", 1.15);
  else if (cmo?.neededWhy) push("🧑‍🎤", "Te falta un CMO", 0.65);
  const feat = s.done.reduce((a, id) => a + (FEATURES.find((f) => f.id === id)?.effects.growth ?? 0), 0) + s.customFeatures * 0.08;
  push("🛠️", `${s.done.length + s.customFeatures} features lanzadas`, feat, "pct");
  if (sector.growth !== 0) push(sector.icon, `Sector ${sector.name}`, sector.growth, "pct");
  const sat = Math.max(0, 1 - s.users / sector.tam);
  if (sat < 0.95) push("🌍", "Mercado saturándose", sat);
  if (d.effectPtsMul !== 1 || (d.overhead < 1 && d.overhead)) {
    if (d.overhead < 0.98) push("🏢", "Burocracia por tamaño de equipo (productividad)", d.overhead);
  }
  for (const e of s.effects) if (e.until >= s.day && e.growthMul && e.growthMul !== 1) push(e.icon, e.label, e.growthMul);
  if (d.mktPts > 0) push("📣", `Growth: ${d.mktPts.toFixed(1)} pts traen usuarios directos`, d.mktPts * 3 / Math.max(1, d.newUsersDay), "pct");
  if (d.adsUsersDay > 0.5) push("📈", `Ads: +${Math.round(d.adsUsersDay)} usuarios/día`, d.adsUsersDay / Math.max(1, d.newUsersDay), "pct");
  if (d.organicUsersDay > 0.5) push("📱", `Seguidores: +${Math.round(d.organicUsersDay)} usuarios/día orgánicos`, d.organicUsersDay / Math.max(1, d.newUsersDay), "pct");
  if (s.bugs > 3) push("🐛", `Deuda técnica ${Math.round(s.bugs)}: más churn e incidentes`, -Math.min(0.9, s.bugs * 0.02), "pct");
  return out.sort((a, b) => b.weight - a.weight).slice(0, 6);
}

/** Qué partes de la UI ya tienen sentido mostrar. Revelado progresivo. */
export function unlocks(s: GameState, d: Derived) {
  const mvp = s.done.includes("mvp");
  return {
    hype: mvp,
    buildInPublic: mvp,
    campaigns: mvp,
    ads: s.done.includes("landing"),
    community: s.employees.some((e) => e.role === "social") || s.followers >= 2000,
    sponsors: s.stage >= 1,
    execs: s.office >= 2 || d.execs.some((e) => e.neededWhy || e.hired),
    crunch: s.crunch || s.employees.length >= 3,
    repeatables: s.done.length >= 8 || !FEATURES.some((f) => featureAvailable(s, f.id)) || s.customFeatures > 0 || s.rebrands > 0,
    sell: s.stage >= 1 || s.users >= 500,
    burnout: s.crunch || s.burnout > 10 || s.founderOffUntil > s.day,
    social: mvp,
  };
}

export function eventTitle(def: GameEventDef, s: GameState, p: EventPayload = {}) {
  return typeof def.title === "function" ? def.title(s, p) : def.title;
}
export function eventText(def: GameEventDef, s: GameState, p: EventPayload = {}) {
  return typeof def.text === "function" ? def.text(s, p) : def.text;
}

/** Resuelve la decisión `eventIdx` de la bandeja con la opción `choiceIdx`. */
export function resolveEvent(s: GameState, eventIdx: number, choiceIdx: number, auto = false) {
  const pe = s.events[eventIdx];
  if (!pe) return;
  s.events.splice(eventIdx, 1);
  const ev = EVENTS.find((e) => e.id === pe.id);
  if (!ev) return;
  const c = ev.choices[choiceIdx] ?? ev.choices[0];
  const result = c.apply(s, pe.payload ?? {});
  addLog(s, `${ev.icon} ${eventTitle(ev, s, pe.payload)}${auto ? ` (se resolvió solo: ${c.label})` : ""}: ${result}`, auto ? "bad" : "info");
}

export function marketSalary(s: GameState, e: Employee) {
  const infl = 1 + SALARY_INFLATION.pct * Math.floor(s.day / SALARY_INFLATION.everyDays);
  return ROLES[e.role].baseSalary * [0, 1, 1.9, 3.6][e.level] * infl;
}

export function toggleCrunch(s: GameState): string | null {
  if (!s.crunch && s.founderOffUntil > s.day) return "Estás de licencia. Nada de crunch.";
  s.crunch = !s.crunch;
  addLog(s, s.crunch ? "🔥 Modo crunch: +30% productividad. La moral y tu salud lo van a pagar." : "🧘 Fin del crunch. El equipo respira.", s.crunch ? "bad" : "good");
  return null;
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
  s.employees.push({ ...emp, hiredDay: s.day });
  s.candidates = s.candidates.filter((x) => x.id !== candId);
  s.stats.hires += 1;
  addLog(s, `${emp.avatar} ${emp.role === "ai" ? "Activaste" : "Contrataste"} a ${emp.name} (${ROLES[emp.role].name} ${(emp.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[emp.level]}).`, "good");
  return null;
}

export function hireExec(s: GameState, role: ExecRole): string | null {
  const d = derive(s);
  const st = d.execs.find((e) => e.role === role)!;
  const def = EXECS.find((e) => e.role === role)!;
  if (st.hired) return `Ya tenés ${def.name}.`;
  if (s.office < 1) return "Un ejecutivo no va a trabajar en un garage. Mudate primero.";
  if (s.employees.length >= OFFICES[s.office].capacity) return "La oficina está llena.";
  if (s.cash < st.fee) return `El headhunter cobra $${st.fee.toLocaleString("es-AR")} (dos sueldos).`;
  if (s.equity - def.equity < 1) return "No te queda equity para ofrecer.";
  s.cash -= st.fee;
  s.equity -= def.equity;
  s.employees.push({ id: `e${s.nextId++}`, name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} (${def.name})`, role, level: 3, salary: st.salary, avatar: def.icon, hiredDay: s.day });
  s.stats.hires += 1;
  addLog(s, `${def.icon} Contrataste un ${def.name}: $${st.salary.toLocaleString("es-AR")}/mes (escala con la valuación) y ${def.equity}% de equity.`, "good");
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
  if (!featureAvailable(s, id)) return isRepeatable(id) ? "Primero terminá el MVP." : "Todavía no podés construir eso.";
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
  if (s.stage + 1 >= 3 && !s.employees.some((e) => e.role === "cfo")) return "Los VCs no firman una Serie A sin CFO. Contratá uno en Equipo.";
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
  s.exitAmount = (d.valuation * s.equity) / 100;
  addLog(s, "🔔 ¡Tocaste la campana! IPO exitosa.", "good");
  return null;
}

export function campaignStatus(s: GameState, id: string): { ok: boolean; reason: string | null; daysLeft: number; cost: number } {
  const c = CAMPAIGNS.find((x) => x.id === id)!;
  const cost = Math.round(c.cost(s));
  const until = s.campaignCooldowns[id] ?? 0;
  const daysLeft = Math.max(0, until - s.day);
  const req = c.requires?.(s) ?? null;
  if (!s.done.includes("mvp")) return { ok: false, reason: "Primero el MVP. No hay nada que mostrar.", daysLeft, cost };
  if (c.minStage !== undefined && s.stage < c.minStage) return { ok: false, reason: `Se desbloquea con la ronda ${STAGES[c.minStage].name}.`, daysLeft, cost };
  if (req) return { ok: false, reason: req, daysLeft, cost };
  if (daysLeft > 0) return { ok: false, reason: c.cooldown >= 100000 ? "Ya lo hiciste. Es una sola vez." : `Disponible en ${daysLeft} días.`, daysLeft, cost };
  if (s.cash < cost) return { ok: false, reason: "No te alcanza.", daysLeft, cost };
  return { ok: true, reason: null, daysLeft, cost };
}

export function toggleBuildInPublic(s: GameState): string | null {
  s.buildInPublic = !s.buildInPublic;
  addLog(s, s.buildInPublic ? "🧵 Pusiste #buildinpublic en el perfil. Todos los días contás qué hiciste." : "Sacaste #buildinpublic del perfil.", "info");
  return null;
}

export function runCampaign(s: GameState, id: string, by?: string): string | null {
  const c = CAMPAIGNS.find((x) => x.id === id);
  if (!c) return "Campaña desconocida.";
  const st = campaignStatus(s, id);
  if (!st.ok) return st.reason;
  s.cash -= st.cost;
  s.campaignCooldowns[id] = s.day + c.cooldown;
  const flopped = c.risk && Math.random() < c.risk.chance;
  // con el hype alto cada campaña rinde menos
  const hype = flopped ? c.risk!.hype : Math.round(c.hype * (1 - s.hype / 160));
  s.hype = clamp(s.hype + hype, 0, 100);
  const fol = Math.round(Math.min(c.followers(s), 20000 + s.followers * 0.01) * (flopped ? 0.3 : 1));
  s.followers += fol;
  const users = c.users && !flopped ? Math.round(c.users(s) * 0.6) : 0;
  s.users += users;
  if (c.morale) s.morale = clamp(s.morale + c.morale, 0, 100);
  const parts = [`${hype >= 0 ? "+" : ""}${hype} hype`, `+${fol.toLocaleString("es-AR")} seguidores`];
  if (users) parts.push(`+${users.toLocaleString("es-AR")} usuarios`);
  if (c.morale) parts.push(`+${c.morale} moral`);
  addLog(s, `${c.icon} ${by ? `${by} hizo ` : ""}${c.name}: ${flopped ? c.risk!.text + " " : ""}${parts.join(", ")}.`, flopped ? "bad" : "good");
  return null;
}

export function setAdsLevel(s: GameState, level: number): string | null {
  if (!ADS_LEVELS[level]) return "Nivel inválido.";
  if (level > 0 && !s.done.includes("mvp")) return "Sin MVP no hay adónde mandar el tráfico.";
  s.adsLevel = level;
  addLog(s, `${ADS_LEVELS[level].icon} Ads en modo ${ADS_LEVELS[level].name} (${ADS_LEVELS[level].spendDay > 0 ? `$${(ADS_LEVELS[level].spendDay * 30).toLocaleString("es-AR")}/mes` : "sin gasto"}).`, "info");
  return null;
}

export function pizzaCost(s: GameState) {
  return Math.round(80 * s.employees.length);
}
export function asadoCost(s: GameState) {
  return Math.round(300 * s.employees.length);
}
export function pizza(s: GameState): string | null {
  const cost = pizzaCost(s);
  if (s.cash < cost) return "No te alcanza ni para pizza.";
  s.cash -= cost;
  s.morale = clamp(s.morale + 5, 0, 100);
  addLog(s, `🍕 Pizza para el equipo: +5 moral por $${cost.toLocaleString("es-AR")}.`, "info");
  return null;
}
export function asado(s: GameState): string | null {
  const cost = asadoCost(s);
  if (s.cash < cost) return "No te alcanza para el asado.";
  s.cash -= cost;
  s.morale = clamp(s.morale + 12, 0, 100);
  addLog(s, `🥩 Asado de equipo: +12 moral por $${cost.toLocaleString("es-AR")}.`, "info");
  return null;
}

export function sellCompany(s: GameState): string | null {
  const d = derive(s);
  if (d.sellOffer <= 0) return "Nadie compra una startup sin producto.";
  s.exitAmount = (d.sellOffer * s.equity) / 100;
  s.gameOver = "acquired";
  addLog(s, `🏦 Vendiste ${s.startupName} por $${Math.round(d.sellOffer).toLocaleString("es-AR")}. Tu parte: $${Math.round(s.exitAmount).toLocaleString("es-AR")}.`, "good");
  return null;
}

export function applyRename(s: GameState, name: string | null) {
  s.pendingRename = false;
  const clean = (name ?? "").trim().slice(0, 24);
  if (clean && clean !== s.startupName) {
    addLog(s, `🎨 ${s.startupName} ahora se llama ${clean}.`, "good");
    s.startupName = clean;
  } else {
    addLog(s, `🎨 Rebranding: mismo nombre, logo nuevo. Hype igual.`, "info");
  }
}

/** Completa campos que faltan en partidas guardadas con versiones anteriores. */
export function migrate(s: GameState): GameState {
  s.followers ??= 0;
  s.campaignCooldowns ??= {};
  s.adsLevel ??= 0;
  s.buildInPublic ??= false;
  s.lastRaiseDay ??= s.day;
  s.events ??= [];
  s.lastEventDay ??= 0;
  s.effects ??= [];
  s.crunch ??= false;
  s.burnout ??= 0;
  s.founderOffUntil ??= 0;
  if (s.pendingEvent) {
    s.events.push({ id: s.pendingEvent.id, day: s.pendingEvent.day, expiresDay: s.day + EVENT_DEFAULT_DAYS });
    s.pendingEvent = null;
  }
  s.customFeatures ??= 0;
  s.rebrands ??= 0;
  s.pendingRename ??= false;
  s.exitAmount ??= 0;
  s.portfolio ??= [];
  s.achievements ??= [];
  return s;
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
    if (s.gameOver) break;
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
  { id: "fol10k", name: "10k seguidores", icon: "📱", test: (s) => s.followers >= 10000 },
  { id: "fol50k", name: "50k seguidores", icon: "🌟", test: (s) => s.followers >= 50000 },
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
