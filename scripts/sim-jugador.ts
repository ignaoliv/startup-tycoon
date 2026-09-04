/**
 * Simulación con jugadores REALES, no un bot óptimo.
 * Tres perfiles que se equivocan de distinta manera: novato, intermedio y experto.
 */
import { derive, fire, hire, hirePM, ipo, marketingPush, newGame, raiseRound, resolveEvent, setFeature, teamPerk, tick, tienePM, upgradeOffice, featureAvailable } from "../src/lib/game/engine";
import { dayMs, EVENTS, FEATURES, OFFICES } from "../src/lib/game/data";
import type { GameState } from "../src/lib/game/types";
import { applyTuning, DEFAULT_TUNING } from "../src/lib/game/tuning";

interface Perfil {
  nombre: string;
  /** cada cuántos días toca el juego (no micromanagea) */
  atencion: number;
  /** mira el runway antes de contratar */
  cuidaCaja: boolean;
  /** días que tarda en darse cuenta de que le falta feature en desarrollo */
  demoraFeature: number;
  /** probabilidad de levantar la ronda cuando ya puede */
  probRonda: number;
  /** probabilidad de mudarse cuando la oficina está llena y le alcanza */
  probMudanza: number;
  /** cómo elige en los popups: al azar, o la opción sin costo inmediato */
  decision: "azar" | "cauto" | "optimo";
  /** cuida la moral con asado */
  cuidaMoral: boolean;
  /** hace campañas de marketing */
  haceMarketing: boolean;
  /** contrata de más sin necesidad */
  sobrecontrata: boolean;
  /** ve el runway en pantalla al contratar: no contrata si le queda poca caja */
  veRunway?: boolean;
  /** contrata un Project Manager apenas puede */
  contrataPM?: boolean;
}

const PERFILES: Perfil[] = [
  { nombre: "Novato", atencion: 9, cuidaCaja: false, demoraFeature: 10, probRonda: 0.35, probMudanza: 0.4, decision: "azar", cuidaMoral: false, haceMarketing: false, sobrecontrata: true },
  { nombre: "Intermedio", atencion: 4, cuidaCaja: true, demoraFeature: 4, probRonda: 0.7, probMudanza: 0.75, decision: "cauto", cuidaMoral: true, haceMarketing: true, sobrecontrata: false },
  { nombre: "Experto", atencion: 1, cuidaCaja: true, demoraFeature: 0, probRonda: 1, probMudanza: 1, decision: "optimo", cuidaMoral: true, haceMarketing: true, sobrecontrata: false },
];

/** elige una opción del popup según el perfil */
function elegir(s: GameState, p: Perfil): number {
  const ev = EVENTS.find((e) => e.id === s.pendingEvent!.id);
  if (!ev) return 0;
  if (p.decision === "azar") return Math.floor(Math.random() * ev.choices.length);
  if (p.decision === "cauto") {
    // evita lo que suene a gastar plata si está corto de caja, si no elige la primera
    const d = derive(s);
    const runway = d.netDay < 0 ? s.cash / -d.netDay : 999;
    if (runway < 45) {
      const i = ev.choices.findIndex((c) => !/\$|-cash|Pagar|Contratar|Invertir/i.test(c.desc + c.label));
      if (i >= 0) return i;
    }
    return 0;
  }
  return 0;
}


/** todo lo que hace el jugador cuando mira el juego. Devuelve desde cuándo está sin feature. */
function pasoDeJuego(s: GameState, p: Perfil, sinFeatureDesde = -1): number {
      const d = derive(s);

  // elegir qué construir (con demora según el perfil)
  if (!s.currentFeature) {
    if (sinFeatureDesde < 0) sinFeatureDesde = s.day;
    if (s.day - sinFeatureDesde >= p.demoraFeature) {
      const disp = FEATURES.filter((f) => featureAvailable(s, f.id));
      const elegida = p.decision === "azar" ? disp[Math.floor(Math.random() * disp.length)] : disp.sort((a, b) => a.cost - b.cost)[0];
      if (elegida) setFeature(s, elegida.id);
      sinFeatureDesde = -1;
    }
  } else sinFeatureDesde = -1;

  // ronda / IPO
  if (Math.random() < p.probRonda) raiseRound(s);
  if (p.decision !== "azar" || Math.random() < 0.5) ipo(s);

  // mudanza
  const cap = OFFICES[s.office].capacity;
  const sig = OFFICES[s.office + 1];
  if (s.employees.length >= cap && sig && Math.random() < p.probMudanza) {
    const colchon = p.cuidaCaja ? Math.max(0, -d.netDay) * 60 + 5000 : 0;
    if (s.cash > sig.cost + colchon) upgradeOffice(s);
  }

  // pánico: cuando la caja está en rojo, cualquiera reacciona (la pantalla lo grita)
  if (s.cash < 0) {
    raiseRound(s);
    if (s.cash < 0 && s.bankruptDays >= (p.decision === "azar" ? 5 : 2)) {
      const candidatos = s.employees.filter((e) => !e.founder);
      const victima = p.decision === "azar" ? candidatos[Math.floor(Math.random() * candidatos.length)] : [...candidatos].sort((a, b) => b.salary - a.salary)[0];
      if (victima) fire(s, victima.id);
    }
    return sinFeatureDesde; // en modo pánico no contrata
  }

  // contratar
  for (const c of s.candidates) {
    if (s.employees.length >= cap) break;
    if (s.cash < c.fee * (p.cuidaCaja ? 3 : 1.2)) continue;
    if (p.veRunway && !p.cuidaCaja) {
      // ve el número en pantalla y frena si queda poca caja, aunque no sepa optimizar
      const mensual = d.costDay * 30 + c.salary - d.mrr;
      const runway = mensual > 0 ? s.cash / (mensual / 30) : 999;
      if (runway < 55) continue;
    }
    if (p.cuidaCaja) {
      const mensual = d.costDay * 30 + c.salary - d.mrr;
      const runway = mensual > 0 ? s.cash / (mensual / 30) : 999;
      if (runway < 100) continue;
      const cuenta = (r: string) => s.employees.filter((e) => e.role === r).length;
      const ok =
        (c.role === "ai" && cuenta("ai") < 2 + cuenta("dev") * 2) ||
        (c.role === "dev" && cuenta("dev") < 1 + Math.floor(cuenta("ai") / 2)) ||
        (c.role === "marketing" && s.done.includes("mvp") && cuenta("marketing") < 1 + Math.floor(s.employees.length / 3)) ||
        (c.role === "qa" && s.bugs > 3 && cuenta("qa") < 1 + Math.floor(cuenta("ai") / 3)) ||
        (c.role === "design" && cuenta("design") < 1 + Math.floor(s.employees.length / 6)) ||
        (c.role === "sales" && s.users > 200 && cuenta("sales") < 1 + Math.floor(s.employees.length / 6)) ||
        (c.role === "ops" && s.employees.length > 8 && cuenta("ops") < 2);
      if (!ok) continue;
    } else if (!p.sobrecontrata && Math.random() < 0.5) continue;
    hire(s, c.id);
  }

  // moral y marketing
  if (p.cuidaMoral && s.morale < 55 && s.cash > 20000) teamPerk(s);
  if (p.haceMarketing && s.hype < 25 && s.cash > 30000) marketingPush(s);
    
  return sinFeatureDesde;
}

function jugar(p: Perfil, sector: string, maxDias = 1200) {
  const s = newGame({ startupName: "Sim", founderName: "Bot", sector });
  let ultimaMirada = 0;
  let sinFeatureDesde = -1;

  for (let k = 0; k < maxDias; k++) {
    // los popups siempre se atienden (frenan el juego)
    if (s.pendingEvent) resolveEvent(s, elegir(s, p));

    const mira = s.day - ultimaMirada >= p.atencion;
    if (mira) {
      ultimaMirada = s.day;
      sinFeatureDesde = pasoDeJuego(s, p, sinFeatureDesde);
    }

    tick(s);
    if (s.gameOver) break;
  }
  return s;
}

// ¿cuándo aparecen los hitos tempranos?
if (process.argv[3] === "hitos") {
  applyTuning({ ...DEFAULT_TUNING });
  const secs = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
  const dias: Record<string, number[]> = {};
  const N2 = 60;
  for (let i = 0; i < N2; i++) {
    const s = newGame({ startupName: "Sim", founderName: "Bot", sector: secs[i % 6] });
    const p = { ...PERFILES[1], veRunway: true };
    let ultimaMirada = 0;
    const vistos = new Set<string>();
    for (let k = 0; k < 400; k++) {
      if (s.pendingEvent) {
        const id = s.pendingEvent.id;
        if (!vistos.has(id)) {
          vistos.add(id);
          (dias[id] ??= []).push(s.day);
        }
        resolveEvent(s, elegir(s, p));
      }
      if (s.day - ultimaMirada >= p.atencion) {
        ultimaMirada = s.day;
        pasoDeJuego(s, p);
      }
      tick(s);
      if (s.gameOver) break;
    }
  }
  const prog = (n: number) => { let ms = 0; for (let d = 1; d <= n; d++) ms += dayMs(d); return ms / 60000; };
  console.log(`\n=== CUÁNDO APARECEN LOS HITOS (${N2} partidas, jugador intermedio) ===`);
  for (const id of ["h_diez", "h_equipo", "h_cien", "r_sinship", "r_hito", "h_verde"]) {
    const v = dias[id] ?? [];
    if (!v.length) { console.log(`  ${id.padEnd(10)} nunca`); continue; }
    const prom = v.reduce((a, b) => a + b, 0) / v.length;
    console.log(`  ${id.padEnd(10)} día ${prom.toFixed(0).padStart(4)} (${prog(Math.round(prom)).toFixed(1)} min) · en el ${Math.round((v.length / N2) * 100)}% de las partidas`);
  }
  console.log();
  process.exit(0);
}

// ¿cuánto crece en 110 días una partida real? Sirve para calibrar la meta del board
if (process.argv[3] === "crecimiento") {
  applyTuning({ ...DEFAULT_TUNING, boardEnabled: false });
  const secs = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
  const ratios: { etapa: number; ratio: number }[] = [];
  for (const perfil of [PERFILES[1]]) {
    for (let i = 0; i < 80; i++) {
      const s = newGame({ startupName: "Sim", founderName: "Bot", sector: secs[i % 6] });
      const p = { ...perfil, veRunway: true };
      const hist: number[] = [];
      let ultimaMirada = 0;
      for (let k = 0; k < 900; k++) {
        if (s.pendingEvent) resolveEvent(s, elegir(s, p));
        if (s.day - ultimaMirada >= p.atencion) {
          ultimaMirada = s.day;
          pasoDeJuego(s, p);
        }
        tick(s);
        hist.push(s.users);
        if (s.stage >= 2 && hist.length > 110) {
          const antes = hist[hist.length - 111];
          if (antes > 50) ratios.push({ etapa: s.stage, ratio: s.users / antes });
        }
        if (s.gameOver) break;
      }
    }
  }
  const porEtapa: Record<number, number[]> = {};
  for (const r of ratios) (porEtapa[r.etapa] ??= []).push(r.ratio);
  console.log(`\n=== CUÁNTO CRECEN LOS USUARIOS EN 110 DÍAS (jugador intermedio) ===`);
  console.log(`  ${"etapa".padEnd(10)}${"muestras".padStart(10)}${"p10".padStart(9)}${"p30".padStart(9)}${"mediana".padStart(9)}${"p70".padStart(9)}`);
  const nom = ["Bootstrap", "Pre-seed", "Seed", "Serie A", "Serie B", "Serie C", "Unicornio"];
  for (const etapa of Object.keys(porEtapa).map(Number).sort()) {
    const v = porEtapa[etapa].sort((a, b) => a - b);
    const q = (p: number) => v[Math.floor(v.length * p)].toFixed(1);
    console.log(`  ${(nom[etapa] ?? etapa).padEnd(10)}${String(v.length).padStart(10)}${q(0.1).padStart(9)}${q(0.3).padStart(9)}${q(0.5).padStart(9)}${q(0.7).padStart(9)}`);
  }
  console.log();
  process.exit(0);
}

// ¿se puede perder una vez que sos rentable?
if (process.argv[3] === "rentable") {
  applyTuning({ ...DEFAULT_TUNING });
  let rentables = 0, murieronDespues = 0, ganaron = 0;
  const secs = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
  for (const perfil of [PERFILES[0], PERFILES[1]]) {
    for (let i = 0; i < 120; i++) {
      const s = newGame({ startupName: "Sim", founderName: "Bot", sector: secs[i % 6] });
      let fueRentable = false;
      const p = { ...perfil, veRunway: true };
      let ultimaMirada = 0;
      for (let k = 0; k < 1200; k++) {
        if (s.pendingEvent) resolveEvent(s, elegir(s, p));
        if (s.day - ultimaMirada >= p.atencion) {
          ultimaMirada = s.day;
          pasoDeJuego(s, p);
        }
        tick(s);
        const d = derive(s);
        // rentable de verdad: gana plata y ya pasó el arranque
        if (!fueRentable && d.netDay > 0 && s.day > 120 && s.cash > 50000) fueRentable = true;
        if (s.gameOver) break;
      }
      if (fueRentable) {
        rentables++;
        if (s.gameOver === "bankrupt") murieronDespues++;
        if (s.gameOver === "ipo" || s.gameOver === "acquired") ganaron++;
      }
    }
  }
  console.log(`\n=== ¿SE PUEDE PERDER SIENDO RENTABLE? ===`);
  console.log(`  partidas que llegaron a ser rentables: ${rentables}`);
  console.log(`  de esas, terminaron en quiebra: ${murieronDespues} (${((murieronDespues / rentables) * 100).toFixed(1)}%)`);
  console.log(`  de esas, ganaron: ${ganaron} (${((ganaron / rentables) * 100).toFixed(1)}%)\n`);
  process.exit(0);
}

// diagnóstico: por qué muere el novato
if (process.argv[3] === "diag") {
  const p = PERFILES[0];
  const muertes: GameState[] = [];
  for (let i = 0; i < 60; i++) {
    const s = jugar(p, ["saas", "fintech", "devtools", "delivery", "crypto", "ai"][i % 6]);
    if (s.gameOver === "bankrupt") muertes.push(s);
  }
  const avgD = (f: (s: GameState) => number) => muertes.reduce((a, s) => a + f(s), 0) / muertes.length;
  console.log(`\n=== POR QUÉ MUERE EL NOVATO (${muertes.length} quiebras) ===`);
  console.log(`  día promedio de quiebra: ${avgD((s) => s.day).toFixed(0)}`);
  console.log(`  equipo al morir: ${avgD((s) => s.employees.length).toFixed(1)} personas`);
  console.log(`  sueldos: $${avgD((s) => s.employees.reduce((a, e) => a + e.salary, 0)).toFixed(0)}/mes`);
  console.log(`  facturación (MRR): $${avgD((s) => derive(s).mrr).toFixed(0)}/mes`);
  console.log(`  usuarios: ${avgD((s) => s.users).toFixed(0)}`);
  console.log(`  features lanzadas: ${avgD((s) => s.done.length).toFixed(1)}`);
  console.log(`  llegó a levantar ronda: ${((muertes.filter((s) => s.stage > 0).length / muertes.length) * 100).toFixed(0)}%`);
  console.log(`  tenía MVP: ${((muertes.filter((s) => s.done.includes("mvp")).length / muertes.length) * 100).toFixed(0)}%`);
  console.log(`  se mudó de oficina: ${((muertes.filter((s) => s.office > 0).length / muertes.length) * 100).toFixed(0)}%`);
  console.log(`  popups vistos: ${avgD((s) => s.eventCount ?? 0).toFixed(1)}`);
  console.log();
  process.exit(0);
}

const ESCENARIOS: { nombre: string; tuning: Partial<import("../src/lib/game/tuning").Tuning>; runway: boolean; pm?: boolean }[] = [
  { nombre: "Sin PM (eligen a mano)", tuning: {}, runway: false },
  { nombre: "Contratan PM apenas pueden", tuning: {}, runway: false, pm: true },
];

const N = Number(process.argv[2] ?? 100);
const sectores = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
const minsProg = (n: number) => {
  let ms = 0;
  for (let d = 1; d <= n; d++) ms += dayMs(d);
  return ms / 60000;
};
const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);

console.log(`\n=== ${N} partidas por perfil y escenario ===\n`);
console.log(`${"escenario".padEnd(21)}${"NOVATO".padStart(9)}${"INTERM.".padStart(9)}${"EXPERTO".padStart(9)}   ${"min/partida (interm.)".padStart(10)}`);

for (const esc of ESCENARIOS) {
  applyTuning({ ...DEFAULT_TUNING, ...esc.tuning });
  const res: string[] = [];
  let minutosInterm = 0;
  for (const base of PERFILES) {
    const p = { ...base, veRunway: esc.runway, contrataPM: esc.pm };
    const finales: Record<string, number> = {};
    const dias: number[] = [];
    for (let i = 0; i < N; i++) {
      const s = jugar(p, sectores[i % sectores.length]);
      finales[s.gameOver ?? "sigue"] = (finales[s.gameOver ?? "sigue"] ?? 0) + 1;
      dias.push(s.day);
    }
    const gana = (finales.ipo ?? 0) + (finales.acquired ?? 0);
    res.push(`${Math.round((gana / N) * 100)}%${finales.fired ? `/${Math.round(((finales.fired ?? 0) / N) * 100)}e` : ""}`);
    if (base.nombre === "Intermedio") minutosInterm = minsProg(Math.round(avg(dias)));
  }
  console.log(`${esc.nombre.padEnd(21)}${res[0].padStart(9)}${res[1].padStart(9)}${res[2].padStart(9)}   ${(minutosInterm.toFixed(1) + " min").padStart(10)}`);
}
console.log(`\nObjetivo buscado: novato ~30% · intermedio ~55% · experto ~70%\n`);
