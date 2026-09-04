/**
 * Simulación con jugadores REALES, no un bot óptimo.
 * Tres perfiles que se equivocan de distinta manera: novato, intermedio y experto.
 */
import { derive, fire, hire, ipo, marketingPush, newGame, raiseRound, resolveEvent, setFeature, teamPerk, tick, upgradeOffice, featureAvailable } from "../src/lib/game/engine";
import { dayMs, EVENTS, FEATURES, OFFICES } from "../src/lib/game/data";
import type { GameState } from "../src/lib/game/types";

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
        tick(s);
        if (s.gameOver) break;
        continue; // en modo pánico no contrata
      }

      // contratar
      for (const c of s.candidates) {
        if (s.employees.length >= cap) break;
        if (s.cash < c.fee * (p.cuidaCaja ? 3 : 1.2)) continue;
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
    }

    tick(s);
    if (s.gameOver) break;
  }
  return s;
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

const N = Number(process.argv[2] ?? 100);
const sectores = ["saas", "fintech", "devtools", "delivery", "crypto", "ai"];
const minsProg = (n: number) => {
  let ms = 0;
  for (let d = 1; d <= n; d++) ms += dayMs(d);
  return ms / 60000;
};
const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);

console.log(`\n=== ${N} partidas por perfil ===\n`);
console.log(`${"perfil".padEnd(12)}${"gana".padStart(7)}${"IPO".padStart(7)}${"exit".padStart(7)}${"quiebra".padStart(9)}${"sin fin".padStart(9)}${"días".padStart(7)}${"minutos".padStart(9)}${"popups".padStart(8)}`);

for (const p of PERFILES) {
  const finales: Record<string, number> = {};
  const dias: number[] = [];
  const popups: number[] = [];
  for (let i = 0; i < N; i++) {
    const s = jugar(p, sectores[i % sectores.length]);
    const fin = s.gameOver ?? "sigue";
    finales[fin] = (finales[fin] ?? 0) + 1;
    dias.push(s.day);
    popups.push(s.eventCount ?? 0);
  }
  const gana = (finales.ipo ?? 0) + (finales.acquired ?? 0);
  const d = avg(dias);
  console.log(
    `${p.nombre.padEnd(12)}${String(Math.round((gana / N) * 100) + "%").padStart(7)}${String(finales.ipo ?? 0).padStart(7)}${String(finales.acquired ?? 0).padStart(7)}${String(finales.bankrupt ?? 0).padStart(9)}${String(finales.sigue ?? 0).padStart(9)}${d.toFixed(0).padStart(7)}${(minsProg(Math.round(d)).toFixed(1) + "m").padStart(9)}${avg(popups).toFixed(1).padStart(8)}`,
  );
}
console.log(`\n(los minutos no incluyen lo que tarda una persona en leer y decidir cada popup)\n`);
