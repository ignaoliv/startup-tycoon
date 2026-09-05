/** Drivers del ritmo de eventos. Se pueden ajustar desde /admin (guardado por navegador). */
export interface Tuning {
  firstEventDay: number;
  cap: number; // tope de popups por partida
  separation: number; // días mínimos entre dos popups cualesquiera
  paceTranquila: number;
  paceNormal: number;
  paceCaotica: number;
  intervalSmall: [number, number]; // garage / pre-seed
  intervalMid: [number, number]; // seed / serie A
  intervalBig: [number, number]; // serie B en adelante
  reactiveCooldownMul: number; // 1 = como está definido en cada evento
  chanceEnabled: boolean; // apagar el azar en las decisiones
  // --- presión de escala (0 = apagado)
  overheadFrom: number; // a partir de cuántas personas empieza a pesar la estructura
  costOverhead: number; // extra de costo por persona de más (0.015 = +1,5% por persona)
  productivityOverhead: number; // productividad perdida por persona de más
  ipoValuation: number; // valuación necesaria para salir a bolsa
  acquireMinUsers: number; // tamaño desde el que una corporación se fija en vos
  // --- board: después de levantar, los inversores piden crecimiento
  boardEnabled: boolean;
  boardFromStage: number; // desde qué ronda empieza a exigir
  boardGrowth: number; // cuánto tenés que multiplicar los usuarios
  boardDays: number; // en cuántos días
  boardFailsToFire: number; // cuántas metas seguidas podés fallar antes de que te echen
  tamMul: number; // tamaño del mercado (1 = como está definido por sector)
  bankruptLimit: number; // días en rojo antes de cerrar
  startCash: number; // plata inicial
}

export const DEFAULT_TUNING: Tuning = {
  firstEventDay: 12,
  cap: 25,
  separation: 7,
  paceTranquila: 1.25,
  paceNormal: 1,
  paceCaotica: 0.8,
  intervalSmall: [15, 25],
  intervalMid: [12, 20],
  intervalBig: [9, 16],
  reactiveCooldownMul: 1,
  chanceEnabled: true,
  overheadFrom: 10,
  costOverhead: 0,
  productivityOverhead: 0,
  ipoValuation: 2_000_000_000,
  acquireMinUsers: 120000,
  boardEnabled: true,
  boardFromStage: 3,
  boardGrowth: 1.8,
  boardDays: 110,
  boardFailsToFire: 2,
  tamMul: 0.5,
  bankruptLimit: 12,
  startCash: 30000,
};

export const TUNING_KEY = "startup-tycoon:tuning";

// objeto vivo que lee el motor (funciona igual en el navegador y en scripts)
export const tuning: Tuning = { ...DEFAULT_TUNING };

export function applyTuning(patch: Partial<Tuning>) {
  Object.assign(tuning, patch);
}

export function loadTuning() {
  try {
    const raw = localStorage.getItem(TUNING_KEY);
    if (raw) applyTuning(JSON.parse(raw) as Partial<Tuning>);
  } catch {}
}

export function saveTuning(patch: Partial<Tuning>) {
  applyTuning(patch);
  try {
    localStorage.setItem(TUNING_KEY, JSON.stringify(tuning));
  } catch {}
}

export function resetTuning() {
  applyTuning(DEFAULT_TUNING);
  try {
    localStorage.removeItem(TUNING_KEY);
  } catch {}
}
