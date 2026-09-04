// Simula el SISTEMA DE EVENTOS propuesto sobre partidas reales del motor.
// No modifica el juego: corre la partida como hoy y encima mide cómo se
// comportaría el planificador nuevo (ritmo dinámico, tope, sin repetidos, reactivos).
import { derive, hire, newGame, raiseRound, resolveEvent, setFeature, tick, upgradeOffice, featureAvailable } from "../src/lib/game/engine";
import { EVENTS, FEATURES, OFFICES } from "../src/lib/game/data";
import type { GameState } from "../src/lib/game/types";

function bot(s: GameState) {
  const d = derive(s);
  if (s.pendingEvent) resolveEvent(s, 0);
  if (!s.currentFeature) {
    const next = FEATURES.filter((f) => featureAvailable(s, f.id)).sort((a, b) => a.cost - b.cost)[0];
    if (next) setFeature(s, next.id);
  }
  raiseRound(s);
  const cap = OFFICES[s.office].capacity;
  const nextOffice = OFFICES[s.office + 1];
  if (s.employees.length >= cap && nextOffice && s.cash > nextOffice.cost + Math.max(0, -d.netDay) * 60 + 5000) upgradeOffice(s);
  const roles = ["ai", "dev", "marketing", "design", "qa", "sales", "ops"] as const;
  const want = roles.map((r) => ({ r, n: s.employees.filter((e) => e.role === r).length }));
  for (const c of s.candidates) {
    const monthlyAfter = d.costDay * 30 + c.salary - d.mrr;
    const runway = monthlyAfter > 0 ? s.cash / (monthlyAfter / 30) : 999;
    const counts = Object.fromEntries(want.map((w) => [w.r, w.n]));
    const ok =
      (c.role === "ai" && counts.ai < 2 + counts.dev * 2) ||
      (c.role === "dev" && counts.dev < 1 + Math.floor(counts.ai / 2)) ||
      (c.role === "marketing" && s.done.includes("mvp") && counts.marketing < 1 + Math.floor(s.employees.length / 3)) ||
      (c.role === "qa" && s.bugs > 3 && counts.qa < 1 + Math.floor(counts.ai / 3)) ||
      (c.role === "design" && counts.design < 1 + Math.floor(s.employees.length / 6)) ||
      (c.role === "sales" && s.users > 200 && counts.sales < 1 + Math.floor(s.employees.length / 6)) ||
      (c.role === "ops" && s.employees.length > 8 && counts.ops < 2);
    if (ok && runway > 100 && s.employees.length < cap) hire(s, c.id);
  }
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// --- catálogo propuesto -------------------------------------------------
const BASE = EVENTS.map((e) => ({ id: e.id, minDay: e.minDay ?? 0, minUsers: e.minUsers ?? 0 }));
const GENERICOS = [
  { id: "aceleradora", minDay: 25, minUsers: 0 },
  { id: "cartadoc", minDay: 40, minUsers: 100 },
  { id: "cofundador", minDay: 20, minUsers: 0 },
  { id: "amigo", minDay: 15, minUsers: 0 },
  { id: "usuario_pesado", minDay: 0, minUsers: 150 },
  { id: "cobraste_menos", minDay: 0, minUsers: 200 },
  { id: "uso_inesperado", minDay: 0, minUsers: 300 },
  { id: "competidor_quiebra", minDay: 60, minUsers: 200 },
];
const SECTOR: Record<string, { id: string; minDay: number; minUsers: number }> = {
  saas: { id: "sec_google", minDay: 40, minUsers: 300 },
  fintech: { id: "sec_fraude", minDay: 30, minUsers: 200 },
  devtools: { id: "sec_api", minDay: 30, minUsers: 150 },
  delivery: { id: "sec_vendedor", minDay: 40, minUsers: 300 },
  crypto: { id: "sec_exchange", minDay: 30, minUsers: 100 },
  ai: { id: "sec_proveedor", minDay: 35, minUsers: 150 },
};

// reactivos: condición + enfriamiento
const REACTIVOS = [
  { id: "r_deuda", cd: 80, once: false, test: (s: GameState) => s.bugs > 15 },
  { id: "r_moral", cd: 80, once: false, test: (s: GameState) => s.morale < 52 && s.employees.length >= 3 },
  { id: "r_sinship", cd: 90, once: false, test: (s: GameState, ctx: Ctx) => s.day - ctx.lastShipDay > 55 && s.done.includes("mvp") },
  { id: "r_escala", cd: 100, once: false, test: (s: GameState, ctx: Ctx) => s.users > 800 && s.users > ctx.users20 * 2.5 },
  { id: "r_hype", cd: 100, once: false, test: (s: GameState, ctx: Ctx) => ctx.hypeAltoDias >= 20 && s.employees.length >= 5 },
  { id: "r_equity", cd: 120, once: false, test: (s: GameState) => s.equity < 50 },
  { id: "r_oficina", cd: 999, once: false, test: (s: GameState, ctx: Ctx) => ctx.oficinaLlenaDias >= 12 && s.office < OFFICES.length - 1 },
  { id: "r_hito", cd: 0, once: true, test: (s: GameState) => s.users >= 1000 },
];

interface Ctx {
  lastShipDay: number;
  users20: number;
  hypeAltoDias: number;
  oficinaLlenaDias: number;
}

const CARACTER = [
  { name: "tranquila", mul: 1.25 },
  { name: "normal", mul: 1.0 },
  { name: "caótica", mul: 0.8 },
];
const TOPE = 25;
const SEPARACION = 7; // días mínimos entre dos popups cualesquiera

/** intervalo base según tamaño de la empresa */
function baseInterval(s: GameState) {
  if (s.stage <= 1 && s.employees.length < 6) return [15, 25];
  if (s.stage <= 3) return [12, 20];
  return [9, 16];
}

interface Run {
  dias: number;
  fin: string;
  caracter: string;
  calendario: number;
  reactivos: number;
  total: number;
  distintos: number;
  huecoMax: number;
  huecoProm: number;
  vistos: Set<string>;
  topeDia: number | null;
  hoyTotal: number; // con el sistema actual
  hoyDistintos: number;
}

function run(sector: string, maxDays: number, nuevo: boolean): Run {
  const s = newGame({ startupName: "Sim", founderName: "Bot", sector });
  const caracter = CARACTER[Math.floor(Math.random() * CARACTER.length)];
  const pool = [...BASE, ...GENERICOS, SECTOR[sector]];
  const vistos = new Set<string>();
  const cooldown: Record<string, number> = {};
  const ctx: Ctx = { lastShipDay: 1, users20: 0, hypeAltoDias: 0, oficinaLlenaDias: 0 };
  let next = 12;
  let ultimo = -99;
  let calendario = 0,
    reactivos = 0,
    topeDia: number | null = null;
  const dias: number[] = [];
  // sistema actual, en paralelo
  let hoyNext = 12,
    hoyTotal = 0;
  const hoyVistos = new Set<string>();
  const hist: number[] = [];

  for (let i = 0; i < maxDays; i++) {
    const doneAntes = s.done.length;
    bot(s);
    tick(s);
    if (s.done.length > doneAntes) ctx.lastShipDay = s.day;
    hist.push(s.users);
    ctx.users20 = hist[Math.max(0, hist.length - 21)] ?? 0;
    ctx.hypeAltoDias = s.hype > 85 ? ctx.hypeAltoDias + 1 : 0;
    ctx.oficinaLlenaDias = s.employees.length >= OFFICES[s.office].capacity ? ctx.oficinaLlenaDias + 1 : 0;
    if (s.gameOver) break;

    // --- sistema actual
    if (s.day >= hoyNext) {
      const p = BASE.filter((e) => e.minDay <= s.day && e.minUsers <= s.users);
      if (p.length) {
        hoyVistos.add(p[Math.floor(Math.random() * p.length)].id);
        hoyTotal++;
        hoyNext = s.day + Math.round(rnd(14, 30));
      }
    }

    if (!nuevo) continue;

    // --- reactivos: cuentan para el tope y respetan la separación mínima
    const sepReactivo = calendario + reactivos >= TOPE ? SEPARACION * 2 : SEPARACION;
    if (s.day - ultimo >= sepReactivo) {
      for (const r of REACTIVOS) {
        if (r.once && vistos.has(r.id)) continue;
        if ((cooldown[r.id] ?? -999) > s.day) continue;
        if (!r.test(s, ctx)) continue;
        vistos.add(r.id);
        cooldown[r.id] = s.day + r.cd;
        reactivos++;
        dias.push(s.day);
        ultimo = s.day;
        next = Math.max(next, s.day + SEPARACION); // el reactivo corre el del calendario
        break;
      }
    }

    // --- calendario, con tope y sin repetidos
    if (s.day >= next && s.day - ultimo >= SEPARACION) {
      if (calendario + reactivos >= TOPE) {
        if (topeDia === null) topeDia = s.day;
      } else {
        let disp = pool.filter((e) => e.minDay <= s.day && e.minUsers <= s.users && !vistos.has(e.id));
        if (!disp.length) {
          // pool agotado: se permite repetir el más viejo
          disp = pool.filter((e) => e.minDay <= s.day && e.minUsers <= s.users);
        }
        if (disp.length) {
          const ev = disp[Math.floor(Math.random() * disp.length)];
          vistos.add(ev.id);
          calendario++;
          dias.push(s.day);
          ultimo = s.day;
          const [a, b] = baseInterval(s);
          next = s.day + Math.round(rnd(a, b) * caracter.mul);
        } else {
          next = s.day + 3;
        }
      }
    }
  }

  const huecos: number[] = [];
  dias.sort((a, b) => a - b);
  for (let i = 1; i < dias.length; i++) huecos.push(dias[i] - dias[i - 1]);
  return {
    dias: s.day,
    fin: s.gameOver ?? "sigue",
    caracter: caracter.name,
    calendario,
    reactivos,
    total: calendario + reactivos,
    distintos: vistos.size,
    huecoMax: huecos.length ? Math.max(...huecos) : 0,
    huecoProm: huecos.length ? huecos.reduce((a, b) => a + b, 0) / huecos.length : 0,
    vistos,
    topeDia,
    hoyTotal,
    hoyDistintos: hoyVistos.size,
  };
}

const N = Number(process.argv[2] ?? 120);
const MAX = Number(process.argv[3] ?? 420);
const sectores = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
const runs: Run[] = [];
for (let i = 0; i < N; i++) runs.push(run(sectores[i % sectores.length], MAX, true));

const avg = (f: (r: Run) => number) => runs.reduce((a, r) => a + f(r), 0) / runs.length;
const med = (f: (r: Run) => number) => {
  const v = runs.map(f).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const pct = (f: (r: Run) => boolean) => (runs.filter(f).length / runs.length) * 100;

console.log(`\n=== ${N} partidas simuladas (hasta ${MAX} días) ===\n`);
console.log(`Duración media de la partida: ${avg((r) => r.dias).toFixed(0)} días  (terminan: ${runs.filter((r) => r.fin !== "sigue").length}/${N})`);
console.log(`\n--- SISTEMA ACTUAL ---`);
console.log(`  Popups por partida: ${avg((r) => r.hoyTotal).toFixed(1)} (mediana ${med((r) => r.hoyTotal)})`);
console.log(`  Eventos DISTINTOS vistos: ${avg((r) => r.hoyDistintos).toFixed(1)} de 17  → repetidos: ${(avg((r) => r.hoyTotal) - avg((r) => r.hoyDistintos)).toFixed(1)} por partida`);
console.log(`\n--- SISTEMA PROPUESTO ---`);
console.log(`  Popups por partida: ${avg((r) => r.total).toFixed(1)} (mediana ${med((r) => r.total)})`);
console.log(`     de calendario: ${avg((r) => r.calendario).toFixed(1)} | reactivos: ${avg((r) => r.reactivos).toFixed(1)}`);
console.log(`  Eventos distintos: ${avg((r) => r.distintos).toFixed(1)} de 34 disponibles por partida`);
console.log(`  Días entre popups: ${avg((r) => r.huecoProm).toFixed(1)} de promedio | hueco más largo: ${avg((r) => r.huecoMax).toFixed(0)} días`);
console.log(`  Partidas que llegan al tope de 25: ${pct((r) => r.topeDia !== null).toFixed(0)}% (en promedio al día ${(runs.filter(r=>r.topeDia).reduce((a,r)=>a+r.topeDia!,0)/Math.max(1,runs.filter(r=>r.topeDia).length)).toFixed(0)})`);
console.log(`  Tras el tope siguen solo los reactivos, con el doble de separación`);
console.log(`  Multiplicador vs hoy: x${(avg((r) => r.total) / avg((r) => r.hoyTotal)).toFixed(2)}`);

console.log(`\n--- POR CARÁCTER DE PARTIDA ---`);
for (const c of CARACTER) {
  const rs = runs.filter((r) => r.caracter === c.name);
  if (!rs.length) continue;
  const a = (f: (r: Run) => number) => rs.reduce((x, r) => x + f(r), 0) / rs.length;
  console.log(`  ${c.name.padEnd(9)} → ${a((r) => r.total).toFixed(1)} popups, 1 cada ${a((r) => r.huecoProm).toFixed(1)} días`);
}

console.log(`\n--- VARIEDAD ENTRE PARTIDAS ---`);
let solapamiento = 0,
  pares = 0;
for (let i = 0; i + 1 < runs.length; i += 2) {
  const a = runs[i].vistos,
    b = runs[i + 1].vistos;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  solapamiento += inter / union;
  pares++;
}
console.log(`  Dos partidas seguidas comparten el ${((solapamiento / pares) * 100).toFixed(0)}% de los eventos`);

console.log(`\n--- REACTIVOS: cuántas partidas los ven ---`);
for (const r of REACTIVOS) {
  console.log(`  ${r.id.padEnd(12)} ${pct((x) => x.vistos.has(r.id)).toFixed(0)}%`);
}
console.log();
