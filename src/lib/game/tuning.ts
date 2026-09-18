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
  boardGrowth: number; // cuánto tenés que multiplicar los usuarios (tope de arranque)
  boardShare: number; // qué parte del mercado que queda te pide, cuando el múltiplo no entra
  boardTecho: number; // penetración a partir de la cual deja de pedir crecimiento
  boardDays: number; // en cuántos días
  boardFailsToFire: number; // cuántas metas seguidas podés fallar antes de que te echen
  tamMul: number; // tamaño del mercado (1 = como está definido por sector)
  infraExtra: number; // costo de infraestructura que crece más rápido que los usuarios
  precioElasticidad: number; // cuánto castiga el churn subir el precio (1 = neutro, >1 castiga)
  // --- invierno: el múltiplo se cae y después se recupera. Es una estación,
  // no un clima: si no terminara nunca sería un impuesto permanente.
  inviernoDesde: number; // día en que arranca (0 = apagado)
  inviernoDias: number; // en cuántos días llega al piso
  inviernoPiso: number; // hasta dónde cae (0.35 = vale un tercio)
  inviernoFondo: number; // cuántos días se queda en el piso
  inviernoSalida: number; // en cuántos días vuelve a valer lo que valía
  bankruptLimit: number; // días en rojo antes de cerrar
  startCash: number; // plata inicial
  // --- tope: ninguna partida puede durar más de media hora de reloj
  diaFinal: number; // último día de la partida (0 = sin tope)
  diaAviso: number; // desde acá se ve que se termina
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
  ipoValuation: 5_000_000_000,
  acquireMinUsers: 120000,
  boardEnabled: true,
  boardFromStage: 3,
  boardGrowth: 4.5,
  boardShare: 0.35,
  boardTecho: 0.9,
  boardDays: 75,
  boardFailsToFire: 1,
  tamMul: 0.5,
  infraExtra: 0.005,
  precioElasticidad: 0.8,
  inviernoDesde: 0, // ya no arranca por día: lo dispara el evento del invierno
  inviernoDias: 250,
  inviernoPiso: 0.35,
  inviernoFondo: 120,
  inviernoSalida: 250,
  bankruptLimit: 12,
  startCash: 30000,
  diaFinal: 2300,
  diaAviso: 2050,
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
