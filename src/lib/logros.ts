/**
 * Logros de carrera: se calculan desde el historial de partidas, no se guardan.
 * Por eso un logro nuevo se lo lleva todo el mundo de forma retroactiva.
 */

export interface RunResumen {
  sector: string;
  ended_as: string;
  day: number;
  valuation: number;
  peak_users: number;
  equity: number;
  team_size: number;
  stage: number;
  created_at: string;
}

export interface Carrera {
  partidas: number;
  ganadas: number;
  ipos: number;
  exits: number;
  quiebras: number;
  echados: number;
  abandonadas: number;
  mejorValuacion: number;
  valuacionSumada: number;
  mejorUsuarios: number;
  usuariosSumados: number;
  diasJugados: number;
  equipoMax: number;
  sectores: number;
  sectoresGanados: number;
  ganoConCripto: boolean;
  ganoSinRonda: boolean;
  quiebraExpres: boolean;
  mejorRacha: number;
  fechasDistintas: number;
  madrugada: boolean;
}

const GANA = (r: RunResumen) => r.ended_as === "ipo" || r.ended_as === "acquired";

export function calcularCarrera(runs: RunResumen[]): Carrera {
  const sectores = new Set<string>();
  const sectoresGanados = new Set<string>();
  const fechas = new Set<string>();
  let racha = 0;
  let mejorRacha = 0;

  // de la más vieja a la más nueva, para que la racha tenga sentido
  const orden = [...runs].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  for (const r of orden) {
    sectores.add(r.sector);
    fechas.add(new Date(r.created_at).toLocaleDateString("es-AR"));
    if (GANA(r)) {
      sectoresGanados.add(r.sector);
      racha += 1;
      mejorRacha = Math.max(mejorRacha, racha);
    } else if (r.ended_as !== "abandoned") {
      racha = 0;
    }
  }

  const suma = (f: (r: RunResumen) => number) => runs.reduce((a, r) => a + f(r), 0);
  const max = (f: (r: RunResumen) => number) => runs.reduce((a, r) => Math.max(a, f(r)), 0);
  const hora = (r: RunResumen) => new Date(r.created_at).getHours();

  return {
    partidas: runs.length,
    ganadas: runs.filter(GANA).length,
    ipos: runs.filter((r) => r.ended_as === "ipo").length,
    exits: runs.filter((r) => r.ended_as === "acquired").length,
    quiebras: runs.filter((r) => r.ended_as === "bankrupt").length,
    echados: runs.filter((r) => r.ended_as === "fired").length,
    abandonadas: runs.filter((r) => r.ended_as === "abandoned").length,
    mejorValuacion: max((r) => r.valuation),
    valuacionSumada: suma((r) => r.valuation),
    mejorUsuarios: max((r) => r.peak_users),
    usuariosSumados: suma((r) => r.peak_users),
    diasJugados: suma((r) => r.day),
    equipoMax: max((r) => r.team_size),
    sectores: sectores.size,
    sectoresGanados: sectoresGanados.size,
    ganoConCripto: runs.some((r) => GANA(r) && r.sector === "crypto"),
    // la etapa se pisa al llegar a la valuación de IPO, así que el que no se
    // diluyó se reconoce por el equity que conservó, no por la etapa
    ganoSinRonda: runs.some((r) => GANA(r) && r.equity >= 90),
    quiebraExpres: runs.some((r) => r.ended_as === "bankrupt" && r.day < 30),
    mejorRacha,
    fechasDistintas: fechas.size,
    madrugada: runs.some((r) => hora(r) >= 3 && hora(r) < 6),
  };
}

export interface Logro {
  id: string;
  icon: string;
  name: string;
  desc: string;
  grupo: "Volumen" | "Plata" | "Salidas" | "Fracaso" | "Amplitud" | "Constancia" | "Escala";
  /** cuánto lleva y cuánto necesita; si no aplica, es de los de sí o no */
  valor: (c: Carrera) => number;
  meta: number;
}

const M = 1_000_000;

export const LOGROS: Logro[] = [
  // --- Volumen
  { id: "j1", icon: "🚀", name: "Primera partida", desc: "Fundaste tu primera startup.", grupo: "Volumen", valor: (c) => c.partidas, meta: 1 },
  { id: "j5", icon: "🔁", name: "Reincidente", desc: "5 partidas jugadas.", grupo: "Volumen", valor: (c) => c.partidas, meta: 5 },
  { id: "j10", icon: "🎰", name: "Diez veces", desc: "10 partidas jugadas.", grupo: "Volumen", valor: (c) => c.partidas, meta: 10 },
  { id: "j25", icon: "🏗️", name: "Veinticinco", desc: "25 partidas jugadas.", grupo: "Volumen", valor: (c) => c.partidas, meta: 25 },
  { id: "j50", icon: "🧱", name: "Cincuenta", desc: "50 partidas jugadas.", grupo: "Volumen", valor: (c) => c.partidas, meta: 50 },
  { id: "j100", icon: "💯", name: "Cien partidas", desc: "100 partidas jugadas. Ya sos parte del mobiliario.", grupo: "Volumen", valor: (c) => c.partidas, meta: 100 },

  // --- Plata
  { id: "v1m", icon: "💵", name: "Primer millón", desc: "Una startup valuada en $1M.", grupo: "Plata", valor: (c) => c.mejorValuacion, meta: M },
  { id: "v10m", icon: "💰", name: "Diez millones", desc: "Una startup valuada en $10M.", grupo: "Plata", valor: (c) => c.mejorValuacion, meta: 10 * M },
  { id: "v100m", icon: "🏦", name: "Cien millones", desc: "Una startup valuada en $100M.", grupo: "Plata", valor: (c) => c.mejorValuacion, meta: 100 * M },
  { id: "unicornio", icon: "🦄", name: "Unicornio", desc: "Una startup valuada en $1.000M.", grupo: "Plata", valor: (c) => c.mejorValuacion, meta: 1000 * M },
  { id: "acum1b", icon: "📈", name: "Mil millones en total", desc: "Sumando todas tus partidas.", grupo: "Plata", valor: (c) => c.valuacionSumada, meta: 1000 * M },

  // --- Salidas
  { id: "ipo1", icon: "🔔", name: "Tu primera IPO", desc: "Tocaste la campana.", grupo: "Salidas", valor: (c) => c.ipos, meta: 1 },
  { id: "exit1", icon: "🏝️", name: "Primer exit", desc: "Te compraron la empresa.", grupo: "Salidas", valor: (c) => c.exits, meta: 1 },
  { id: "exit5", icon: "🎩", name: "Cinco salidas", desc: "5 partidas ganadas.", grupo: "Salidas", valor: (c) => c.ganadas, meta: 5 },
  { id: "exit10", icon: "👑", name: "Diez salidas", desc: "10 partidas ganadas.", grupo: "Salidas", valor: (c) => c.ganadas, meta: 10 },
  { id: "sinronda", icon: "🧊", name: "Sin diluirte", desc: "Ganaste sin levantar una sola ronda.", grupo: "Salidas", valor: (c) => (c.ganoSinRonda ? 1 : 0), meta: 1 },

  // --- Fracaso
  { id: "q1", icon: "💀", name: "Primera quiebra", desc: "Bienvenido al club.", grupo: "Fracaso", valor: (c) => c.quiebras, meta: 1 },
  { id: "q10", icon: "🕳️", name: "Fracaso profesional", desc: "10 quiebras.", grupo: "Fracaso", valor: (c) => c.quiebras, meta: 10 },
  { id: "q25", icon: "⚰️", name: "Serial founder", desc: "25 quiebras y seguís acá.", grupo: "Fracaso", valor: (c) => c.quiebras, meta: 25 },
  { id: "echado", icon: "🪑", name: "Te sacaron la silla", desc: "El board puso otro CEO.", grupo: "Fracaso", valor: (c) => c.echados, meta: 1 },
  { id: "expres", icon: "⏱️", name: "Rápido y furioso", desc: "Quebraste antes del día 30.", grupo: "Fracaso", valor: (c) => (c.quiebraExpres ? 1 : 0), meta: 1 },

  // --- Amplitud
  { id: "sec6", icon: "🧭", name: "Probaste todo", desc: "Jugaste los 6 sectores.", grupo: "Amplitud", valor: (c) => c.sectores, meta: 6 },
  { id: "sec6win", icon: "🌈", name: "Ganaste en todos", desc: "Una victoria en cada sector.", grupo: "Amplitud", valor: (c) => c.sectoresGanados, meta: 6 },
  { id: "cripto", icon: "🪙", name: "Contra todo pronóstico", desc: "Ganaste jugando cripto.", grupo: "Amplitud", valor: (c) => (c.ganoConCripto ? 1 : 0), meta: 1 },

  // --- Constancia
  { id: "racha3", icon: "🔥", name: "Tres al hilo", desc: "3 partidas ganadas seguidas.", grupo: "Constancia", valor: (c) => c.mejorRacha, meta: 3 },
  { id: "racha5", icon: "☄️", name: "Cinco al hilo", desc: "5 partidas ganadas seguidas.", grupo: "Constancia", valor: (c) => c.mejorRacha, meta: 5 },
  { id: "d7", icon: "📆", name: "Una semana", desc: "Jugaste 7 días distintos.", grupo: "Constancia", valor: (c) => c.fechasDistintas, meta: 7 },
  { id: "d30", icon: "🗓️", name: "Un mes", desc: "Jugaste 30 días distintos.", grupo: "Constancia", valor: (c) => c.fechasDistintas, meta: 30 },
  { id: "dias1000", icon: "⏳", name: "Mil días de startup", desc: "Sumando todas tus partidas.", grupo: "Constancia", valor: (c) => c.diasJugados, meta: 1000 },
  { id: "madrugada", icon: "🌙", name: "Founder mode", desc: "Jugaste entre las 3 y las 6 de la mañana.", grupo: "Constancia", valor: (c) => (c.madrugada ? 1 : 0), meta: 1 },

  // --- Escala
  { id: "u1m", icon: "🌍", name: "Un millón de usuarios", desc: "En una sola partida.", grupo: "Escala", valor: (c) => c.mejorUsuarios, meta: M },
  { id: "u10m", icon: "👥", name: "Diez millones", desc: "Sumando todas tus partidas.", grupo: "Escala", valor: (c) => c.usuariosSumados, meta: 10 * M },
  { id: "equipo20", icon: "🧑‍🤝‍🧑", name: "Equipo de 20", desc: "20 personas en una partida.", grupo: "Escala", valor: (c) => c.equipoMax, meta: 20 },
];

export const GRUPOS = ["Volumen", "Plata", "Salidas", "Fracaso", "Amplitud", "Constancia", "Escala"] as const;

export function conseguido(l: Logro, c: Carrera) {
  return l.valor(c) >= l.meta;
}
