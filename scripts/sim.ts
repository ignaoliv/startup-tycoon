// Simulación headless de balance: bot simple que juega N días.
import { derive, hire, newGame, raiseRound, resolveEvent, setFeature, tick, upgradeOffice, featureAvailable } from "../src/lib/game/engine";
import { FEATURES, OFFICES, STAGES } from "../src/lib/game/data";
import type { GameState } from "../src/lib/game/types";

function bot(s: GameState) {
  const d = derive(s);
  // resolver eventos: opción 0
  if (s.pendingEvent) resolveEvent(s, 0);
  // elegir feature
  if (!s.currentFeature) {
    const next = FEATURES.filter((f) => featureAvailable(s, f.id)).sort((a, b) => a.cost - b.cost)[0];
    if (next) setFeature(s, next.id);
  }
  // levantar ronda si se puede
  raiseRound(s);
  // mudarse si lleno y hay plata sobrante (2 meses de runway)
  const cap = OFFICES[s.office].capacity;
  const nextOffice = OFFICES[s.office + 1];
  if (s.employees.length >= cap && nextOffice && s.cash > nextOffice.cost + Math.max(0, -d.netDay) * 60 + 5000) upgradeOffice(s);
  // contratar si hay runway > 90 días después de contratar
  const roles = ["ai", "dev", "marketing", "design", "qa", "sales", "ops"] as const;
  const want = roles.map((r) => ({ r, n: s.employees.filter((e) => e.role === r).length }));
  for (const c of s.candidates) {
    const monthlyAfter = (d.costDay * 30 + c.salary) - d.mrr;
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

const DAYS = Number(process.argv[2] ?? 400);
const s = newGame({ startupName: "Sim", founderName: "Bot", sector: process.argv[3] ?? "saas" });
const marks = [30, 60, 90, 120, 180, 240, 300, 365, 400, 500, 600, 800, 1000];
for (let i = 0; i < DAYS; i++) {
  bot(s);
  tick(s);
  if (s.gameOver) { console.log(`GAME OVER ${s.gameOver} día ${s.day}`); break; }
  if (marks.includes(s.day)) {
    const d = derive(s);
    console.log(`d${s.day} cash=${Math.round(s.cash)} users=${Math.round(s.users)} mrr=${Math.round(d.mrr)} net/d=${Math.round(d.netDay)} val=${Math.round(d.valuation)} stage=${STAGES[s.stage].name} team=${s.employees.length} office=${OFFICES[s.office].name} bugs=${s.bugs.toFixed(1)} q=${Math.round(d.quality)} hype=${Math.round(s.hype)} done=${s.done.length}`);
  }
}
console.log("log tail:", s.log.slice(0, 8).map((l) => `d${l.day} ${l.text}`).join(" | "));
