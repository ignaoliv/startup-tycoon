// Cuánto dura una partida en tiempo real, comparando esquemas de tiempo.
import { derive, hire, newGame, raiseRound, resolveEvent, setFeature, tick, upgradeOffice, featureAvailable } from "../src/lib/game/engine";
import { dayMs, FEATURES, OFFICES, TICK_MS_MIN, TICK_MS_START, TICK_RAMP_DAYS } from "../src/lib/game/data";
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

/** minutos reales para llegar al día N con cada esquema */
const minsFijo = (dias: number, ms: number) => (dias * ms) / 60000;
function minsProgresivo(dias: number) {
  let ms = 0;
  for (let d = 1; d <= dias; d++) ms += dayMs(d);
  return ms / 60000;
}

const N = Number(process.argv[2] ?? 100);
const MAX = 1200;
const sectores = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];

interface R {
  dias: number;
  fin: string;
  eventos: number;
  hitos: Record<string, number | null>;
}
const runs: R[] = [];

for (let i = 0; i < N; i++) {
  const s = newGame({ startupName: "Sim", founderName: "Bot", sector: sectores[i % sectores.length] });
  const hitos: Record<string, number | null> = { mvp: null, preseed: null, seed: null, seriea: null, unicornio: null };
  for (let k = 0; k < MAX; k++) {
    bot(s);
    tick(s);
    if (hitos.mvp === null && s.done.includes("mvp")) hitos.mvp = s.day;
    if (hitos.preseed === null && s.stage >= 1) hitos.preseed = s.day;
    if (hitos.seed === null && s.stage >= 2) hitos.seed = s.day;
    if (hitos.seriea === null && s.stage >= 3) hitos.seriea = s.day;
    if (hitos.unicornio === null && s.stage >= 6) hitos.unicornio = s.day;
    if (s.gameOver) break;
  }
  runs.push({ dias: s.day, fin: s.gameOver ?? "sigue", eventos: s.eventCount ?? 0, hitos });
}

const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const med = (v: number[]) => {
  if (!v.length) return 0;
  const x = [...v].sort((a, b) => a - b);
  return x[Math.floor(x.length / 2)];
};
const dias = runs.map((r) => r.dias);
const finales: Record<string, number> = {};
for (const r of runs) finales[r.fin] = (finales[r.fin] ?? 0) + 1;

console.log(`\n=== ${N} partidas simuladas (bot jugando óptimo, velocidad 1x) ===\n`);
console.log(`Días por partida: promedio ${avg(dias).toFixed(0)} · mediana ${med(dias)} · mín ${Math.min(...dias)} · máx ${Math.max(...dias)}`);
console.log(`Finales: ${Object.entries(finales).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
console.log(`Popups por partida: ${avg(runs.map((r) => r.eventos)).toFixed(1)}\n`);

const dProm = avg(dias);
console.log(`--- DURACIÓN REAL DE UNA PARTIDA PROMEDIO (${dProm.toFixed(0)} días) ---`);
console.log(`  Versión 1 (4 s por día fijo):        ${minsFijo(dProm, 4000).toFixed(1)} min`);
console.log(`  Versión anterior (3 s por día fijo): ${minsFijo(dProm, 3000).toFixed(1)} min`);
console.log(`  Ahora (progresivo ${TICK_MS_START / 1000}s → ${TICK_MS_MIN / 1000}s en ${TICK_RAMP_DAYS} días): ${minsProgresivo(Math.round(dProm)).toFixed(1)} min`);

console.log(`\n--- CUÁNDO LLEGA CADA HITO (minutos reales desde que empezás) ---`);
const filas: [string, string][] = [
  ["MVP", "mvp"],
  ["Pre-seed", "preseed"],
  ["Seed", "seed"],
  ["Serie A", "seriea"],
  ["Unicornio", "unicornio"],
];
console.log(`  ${"hito".padEnd(11)}${"día".padStart(6)}${"v1 (4s)".padStart(12)}${"ant. (3s)".padStart(12)}${"ahora".padStart(12)}`);
for (const [label, key] of filas) {
  const v = runs.map((r) => r.hitos[key]).filter((x): x is number => x !== null);
  if (!v.length) {
    console.log(`  ${label.padEnd(11)}${"—".padStart(6)}`);
    continue;
  }
  const d = avg(v);
  const pct = Math.round((v.length / N) * 100);
  console.log(
    `  ${label.padEnd(11)}${d.toFixed(0).padStart(6)}${minsFijo(d, 4000).toFixed(1).padStart(11)}m${minsFijo(d, 3000).toFixed(1).padStart(11)}m${minsProgresivo(Math.round(d)).toFixed(1).padStart(11)}m   (${pct}% de las partidas)`,
  );
}

console.log(`\n--- LOS PRIMEROS DÍAS ---`);
for (const d of [10, 20, 30, 60, 110]) {
  console.log(`  Llegar al día ${String(d).padStart(3)}:  v1 ${minsFijo(d, 4000).toFixed(1)}m · anterior ${minsFijo(d, 3000).toFixed(1)}m · ahora ${minsProgresivo(d).toFixed(1)}m`);
}
console.log();
