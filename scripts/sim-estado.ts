/**
 * Foto del estado del juego: cómo terminan las partidas, por sector, el ritmo
 * de lanzamientos y si se puede sobrevivir sin levantar rondas.
 *   pnpm dlx tsx scripts/sim-estado.ts [partidas]
 */
import { CAMPAIGNS, campaignAvailable, derive, fire, hire, ipo, marketingPush, newGame, raiseRound, resolveEvent, teamPerk, tick, upgradeOffice } from "../src/lib/game/engine";
import { EVENTS, OFFICES, SECTORS } from "../src/lib/game/data";
import { applyTuning, DEFAULT_TUNING } from "../src/lib/game/tuning";
import type { GameState } from "../src/lib/game/types";

applyTuning({ ...DEFAULT_TUNING });
const N = Number(process.argv[2] ?? 200);
const SECTORES = SECTORS.map((s) => s.id);

type Estilo = "vc" | "bootstrap";

/** Un jugador competente. En modo bootstrap no levanta rondas y contrata con el freno de mano. */
function jugar(sector: string, estilo: Estilo) {
  const s = newGame({ startupName: "S", founderName: "B", sector });
  let ultimoLanzamiento = 0;
  let huecoMax = 0;
  let diasRentable = 0;
  let rentableSeguidos = 0;

  for (let k = 0; k < 2000; k++) {
    if (s.pendingEvent) {
      const ev = EVENTS.find((e) => e.id === s.pendingEvent!.id);
      // en la oferta de compra decide según qué tan lejos ve la IPO
      const i = ev?.id === "acquire" ? (derive(s).valuation >= DEFAULT_TUNING.ipoValuation * 0.4 ? 1 : 0) : 0;
      resolveEvent(s, i);
    }
    const d = derive(s);
    if (estilo === "vc") raiseRound(s);
    ipo(s);

    const cap = OFFICES[s.office].capacity;
    const sig = OFFICES[s.office + 1];
    const colchon = estilo === "bootstrap" ? Math.max(0, -d.netDay) * 120 + 20000 : Math.max(0, -d.netDay) * 60 + 5000;
    if (s.employees.length >= cap && sig && s.cash > sig.cost + colchon) upgradeOffice(s);

    for (const c of s.candidates) {
      if (s.employees.length >= cap) break;
      const mensual = d.costDay * 30 + c.salary - d.mrr;
      const runway = mensual > 0 ? s.cash / (mensual / 30) : 999;
      // el bootstrapper exige mucho más colchón antes de sumar un sueldo
      const minRunway = estilo === "bootstrap" ? 220 : 100;
      if (runway > minRunway && s.cash > c.fee * (estilo === "bootstrap" ? 6 : 3)) hire(s, c.id);
    }
    if (estilo === "bootstrap" && d.netDay < 0 && s.cash < -d.netDay * 60) {
      const victima = [...s.employees].filter((e) => !e.founder).sort((a, b) => b.salary - a.salary)[0];
      if (victima) fire(s, victima.id);
    }
    if (s.morale < 55 && s.cash > 20000) teamPerk(s);
    const posibles = CAMPAIGNS.filter((c) => campaignAvailable(s, c.id) && s.cash > c.cost(s) * (estilo === "bootstrap" ? 10 : 4));
    const camp = posibles[posibles.length - 1];
    if (camp) marketingPush(s, camp.id);

    const antes = s.done.length;
    tick(s);
    if (s.done.length > antes) {
      huecoMax = Math.max(huecoMax, s.day - ultimoLanzamiento);
      ultimoLanzamiento = s.day;
    }
    const dd = derive(s);
    if (dd.netDay > 0) { diasRentable++; rentableSeguidos++; } else rentableSeguidos = 0;
    if (s.gameOver) break;
  }
  return {
    fin: s.gameOver ?? "sigue",
    dia: s.day,
    features: s.done.length,
    equity: s.equity,
    mrr: derive(s).mrr,
    valuacion: derive(s).valuation,
    usuarios: s.stats.peakUsers,
    popups: s.eventCount,
    huecoMax,
    colaMuerta: s.day - ultimoLanzamiento,
    rentable90: rentableSeguidos >= 90 || diasRentable >= 90,
    rentableSeguidos,
  };
}

const pct = (n: number, t: number) => `${Math.round((n / t) * 100)}%`;
const med = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const gana = (r: { fin: string }) => r.fin === "ipo" || r.fin === "acquired";

for (const estilo of ["vc", "bootstrap"] as Estilo[]) {
  const rs = Array.from({ length: N }, (_, i) => jugar(SECTORES[i % SECTORES.length], estilo));
  console.log(`\n${"=".repeat(62)}`);
  console.log(estilo === "vc" ? "JUGADOR QUE LEVANTA RONDAS" : "JUGADOR QUE NUNCA LEVANTA RONDAS (bootstrap)");
  console.log("=".repeat(62));
  const finales = rs.reduce<Record<string, number>>((a, r) => ({ ...a, [r.fin]: (a[r.fin] ?? 0) + 1 }), {});
  console.log(`  gana ${pct(rs.filter(gana).length, N)}  ·  ${Object.entries(finales).map(([k, v]) => `${k} ${pct(v, N)}`).join(" · ")}`);
  console.log(`  partida: ${med(rs.map((r) => r.dia)).toFixed(0)} días · ${med(rs.map((r) => r.features)).toFixed(1)} features · ${med(rs.map((r) => r.popups)).toFixed(1)} popups`);
  console.log(`  equity final: ${med(rs.map((r) => r.equity)).toFixed(0)}%  ·  MRR: $${Math.round(med(rs.map((r) => r.mrr))).toLocaleString("es-AR")}`);
  console.log(`  hueco más largo sin lanzar: ${med(rs.map((r) => r.huecoMax)).toFixed(0)} días · cola final muerta: ${med(rs.map((r) => r.colaMuerta)).toFixed(0)} días`);
  console.log(`  llegó a 90 días de rentabilidad: ${pct(rs.filter((r) => r.rentable90).length, N)}`);
  console.log("  por sector:");
  for (const sec of SECTORES) {
    const g = rs.filter((_, i) => SECTORES[i % SECTORES.length] === sec);
    const nombre = SECTORS.find((x) => x.id === sec)!.name;
    console.log(`    ${nombre.padEnd(12)} gana ${pct(g.filter(gana).length, g.length).padStart(4)} · ${med(g.map((r) => r.dia)).toFixed(0)} días · $${Math.round(med(g.map((r) => r.valuacion))).toLocaleString("es-AR")} de valuación`);
  }
}
