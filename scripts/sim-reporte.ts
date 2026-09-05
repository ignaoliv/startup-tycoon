/**
 * Reporte de equilibrio: tiempo, acciones, atención, finales y enganche.
 *   pnpm dlx tsx scripts/sim-reporte.ts [partidas]
 */
import { CAMPAIGNS, campaignAvailable, derive, fire, hire, ipo, marketingPush, newGame, raiseRound, resolveEvent, teamPerk, tick, upgradeOffice } from "../src/lib/game/engine";
import { EVENTS, OFFICES, SECTORS, dayMs } from "../src/lib/game/data";
import { applyTuning, DEFAULT_TUNING } from "../src/lib/game/tuning";

applyTuning({ ...DEFAULT_TUNING });
const N = Number(process.argv[2] ?? 300);
const SECTORES = SECTORS.map((s) => s.id);

interface Perfil { nombre: string; mira: number; cuida: boolean; azar: boolean; marketing: boolean }
const PERFILES: Perfil[] = [
  { nombre: "Novato", mira: 9, cuida: false, azar: true, marketing: false },
  { nombre: "Intermedio", mira: 4, cuida: true, azar: false, marketing: true },
  { nombre: "Experto", mira: 1, cuida: true, azar: false, marketing: true },
];

function jugar(p: Perfil, sector: string) {
  const s = newGame({ startupName: "S", founderName: "B", sector });
  let acciones = 0, popupsVistos = 0, miradas = 0, ultimaMirada = 0;
  let ultimoLanzamiento = 0, huecoLanzar = 0, huecoPopup = 0, ultimoPopup = 0;
  let msJugados = 0;

  for (let k = 0; k < 2000; k++) {
    if (s.pendingEvent) {
      const ev = EVENTS.find((e) => e.id === s.pendingEvent!.id);
      const i = p.azar ? Math.floor(Math.random() * (ev?.choices.length ?? 1))
        : ev?.id === "acquire" ? (derive(s).valuation >= DEFAULT_TUNING.ipoValuation * 0.4 ? 1 : 0) : 0;
      resolveEvent(s, i);
      popupsVistos++; acciones++;
      huecoPopup = Math.max(huecoPopup, s.day - ultimoPopup); ultimoPopup = s.day;
    }
    if (s.day - ultimaMirada >= p.mira) {
      ultimaMirada = s.day; miradas++;
      const d = derive(s);
      // el panel avisa cuando la ronda ya está disponible
      if (!raiseRound(s)) acciones++;
      if (!ipo(s)) acciones++;
      const cap = OFFICES[s.office].capacity, sig = OFFICES[s.office + 1];
      if (s.employees.length >= cap && sig && s.cash > sig.cost + (p.cuida ? Math.max(0, -d.netDay) * 60 + 5000 : 0)) { if (!upgradeOffice(s)) acciones++; }
      for (const c of s.candidates) {
        if (s.employees.length >= cap) break;
        if (s.cash < c.fee * (p.cuida ? 3 : 1.2)) continue;
        // todos ven en pantalla en cuántos días de caja los deja cada contratación
        const men = d.costDay * 30 + c.salary - d.mrr;
        const rw = men > 0 ? s.cash / (men / 30) : 999;
        if (rw < (p.cuida ? 100 : 55)) continue;
        if (!hire(s, c.id)) acciones++;
      }
      if (s.cash < 0 && s.bankruptDays >= 3) { const v = s.employees.filter((e) => !e.founder).sort((a, b) => b.salary - a.salary)[0]; if (v) { fire(s, v.id); acciones++; } }
      if (p.cuida && s.morale < 55 && s.cash > 20000) { if (!teamPerk(s)) acciones++; }
      if (p.marketing) { const pos = CAMPAIGNS.filter((c) => campaignAvailable(s, c.id) && s.cash > c.cost(s) * 4); const el = pos[pos.length - 1]; if (el && !marketingPush(s, el.id)) acciones++; }
    }
    const antes = s.done.length;
    msJugados += dayMs(s.day);
    tick(s);
    if (s.done.length > antes) { huecoLanzar = Math.max(huecoLanzar, s.day - ultimoLanzamiento); ultimoLanzamiento = s.day; }
    if (s.gameOver) break;
  }
  const min = msJugados / 60000;
  return { fin: s.gameOver ?? "sigue", dia: s.day, min, acciones, popupsVistos, miradas, huecoLanzar, huecoPopup,
    features: s.done.length, equity: s.equity, usuarios: s.stats.peakUsers, decisionesPorMin: acciones / Math.max(1, min) };
}

const med = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const p50 = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const pct = (n: number, t: number) => Math.round((n / t) * 100);

console.log(`\n${"=".repeat(70)}\nREPORTE DE EQUILIBRIO · ${N} partidas por perfil\n${"=".repeat(70)}`);

for (const p of PERFILES) {
  const rs = Array.from({ length: N }, (_, i) => jugar(p, SECTORES[i % SECTORES.length]));
  const f = rs.reduce<Record<string, number>>((a, r) => ({ ...a, [r.fin]: (a[r.fin] ?? 0) + 1 }), {});
  const gana = (f.ipo ?? 0) + (f.acquired ?? 0);
  const mins = rs.map((r) => r.min);
  console.log(`\n── ${p.nombre.toUpperCase()} (mira el juego cada ${p.mira} ${p.mira === 1 ? "día" : "días"}) ──`);
  console.log(`  RESULTADO   gana ${pct(gana, N)}%  ·  ${Object.entries(f).sort((a,b)=>b[1]-a[1]).map(([k, v]) => `${k} ${pct(v, N)}%`).join(" · ")}`);
  console.log(`  TIEMPO      ${med(mins).toFixed(1)} min de promedio · mediana ${p50(mins).toFixed(1)} · más corta ${Math.min(...mins).toFixed(1)} · más larga ${Math.max(...mins).toFixed(1)}`);
  console.log(`  DÍAS        ${med(rs.map((r) => r.dia)).toFixed(0)} días de juego · ${med(rs.map((r) => r.features)).toFixed(1)} features lanzadas`);
  console.log(`  ACCIONES    ${med(rs.map((r) => r.acciones)).toFixed(0)} decisiones por partida · ${med(rs.map((r) => r.decisionesPorMin)).toFixed(1)} por minuto`);
  console.log(`  POPUPS      ${med(rs.map((r) => r.popupsVistos)).toFixed(1)} por partida · hueco más largo entre popups ${med(rs.map((r) => r.huecoPopup)).toFixed(0)} días`);
  console.log(`  RITMO       hueco más largo sin lanzar nada: ${med(rs.map((r) => r.huecoLanzar)).toFixed(0)} días`);
  const cortas = rs.filter((r) => r.min < 6).length, largas = rs.filter((r) => r.min > 20).length;
  console.log(`  EXTREMOS    ${pct(cortas, N)}% dura menos de 6 min · ${pct(largas, N)}% pasa de 20 min`);
  const gan = rs.filter((r) => r.fin === "ipo" || r.fin === "acquired");
  const per = rs.filter((r) => r.fin === "bankrupt" || r.fin === "fired");
  if (gan.length) console.log(`  AL GANAR    ${med(gan.map((r) => r.min)).toFixed(1)} min · ${med(gan.map((r) => r.features)).toFixed(1)} features · equity ${med(gan.map((r) => r.equity)).toFixed(0)}%`);
  if (per.length) console.log(`  AL PERDER   ${med(per.map((r) => r.min)).toFixed(1)} min · ${med(per.map((r) => r.features)).toFixed(1)} features`);
}
