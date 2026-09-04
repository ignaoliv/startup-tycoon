export type Role = "ai" | "dev" | "design" | "marketing" | "sales" | "qa" | "ops";
export type Level = 1 | 2 | 3;
export type Speed = 0 | 1 | 2;

export interface Employee {
  id: string;
  name: string;
  role: Role;
  level: Level;
  salary: number; // mensual
  avatar: string;
  founder?: boolean;
}

export interface Candidate extends Employee {
  fee: number;
}

export interface FeatureDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number; // puntos de dev
  requires?: string[];
  effects: {
    growth?: number; // multiplicador aditivo de adquisición (0.2 = +20%)
    arpu?: number; // $ mensual por usuario extra
    churn?: number; // reducción absoluta de churn diario (0.005)
    quality?: number; // puntos de calidad
    hype?: number; // hype instantáneo
  };
}

export interface OfficeDef {
  id: string;
  name: string;
  icon: string;
  capacity: number;
  rent: number; // mensual
  cost: number;
  morale: number;
  cols: number;
  rows: number;
}

export interface StageDef {
  id: string;
  name: string;
  minValuation: number;
  raise: number;
  equity: number; // % que se cede
  multiple: number; // múltiplo de ARR para valuación
}

export interface SectorDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  growth: number;
  arpu: number;
  tam: number; // mercado total (usuarios)
}

export interface EventChoice {
  label: string;
  desc: string;
  /** Si está definida, la opción es una apuesta: probabilidad (0..1) de que salga bien. */
  chance?: number;
  apply: (s: GameState, ok: boolean) => string; // devuelve texto de resultado
}

/** Contexto que mira el motor para disparar eventos reactivos. */
export interface ReactiveCtx {
  netDay: number;
  mrr: number;
  lastShipDay: number;
  hypeHighDays: number;
  officeFullDays: number;
  users20: number;
}

export interface GameEventDef {
  id: string;
  title: string;
  icon: string;
  text: string;
  minDay?: number;
  minUsers?: number;
  /** Solo aparece jugando este sector. */
  sector?: string;
  /** Si está, no entra en el calendario: lo dispara el estado de la partida. */
  reactive?: {
    test: (s: GameState, ctx: ReactiveCtx) => boolean;
    cooldown: number;
    once?: boolean;
  };
  choices: EventChoice[];
}

export interface PendingEvent {
  id: string;
  day: number;
}

export interface LogEntry {
  day: number;
  text: string;
  kind: "info" | "good" | "bad" | "social";
}

export interface PortfolioEntry {
  targetId: string;
  targetName: string;
  amount: number;
  stake: number; // fracción
  day: number;
  lastMrr: number;
}

export interface GameState {
  version: 1;
  id: string;
  startupName: string;
  founderName: string;
  idea: string;
  sector: string;
  day: number;
  cash: number;
  users: number;
  hype: number;
  morale: number;
  bugs: number;
  equity: number;
  stage: number;
  office: number;
  employees: Employee[];
  candidates: Candidate[];
  candidatesDay: number;
  currentFeature: string | null;
  featureProgress: number;
  done: string[];
  log: LogEntry[];
  pendingEvent: PendingEvent | null;
  nextEventDay: number;
  // --- planificador de eventos
  pace: number; // carácter de la partida (multiplicador del intervalo)
  seenEvents: string[]; // para no repetir
  eventCount: number; // cuántos popups van (tope)
  lastEventDay: number;
  reactiveCd: Record<string, number>;
  lastShipDay: number;
  hypeHighDays: number;
  officeFullDays: number;
  usersHistory: number[];
  bankruptDays: number;
  /** meta que pone el board después de levantar una ronda */
  boardGoal: { users: number; dueDay: number } | null;
  boardFails: number;
  gameOver: "bankrupt" | "ipo" | "acquired" | "fired" | null;
  restarts: number;
  stats: { totalRevenue: number; peakUsers: number; raised: number; hires: number };
  achievements: string[];
  portfolio: PortfolioEntry[];
  lastTickAt: number;
  speed: Speed;
  nextId: number;
}

export interface Derived {
  devPts: number;
  qaPts: number;
  mktPts: number;
  salesPts: number;
  designPts: number;
  opsPts: number;
  quality: number;
  arpu: number;
  mrr: number;
  revenueDay: number;
  costDay: number;
  salariesMonth: number;
  rentMonth: number;
  serverMonth: number;
  netDay: number;
  newUsersDay: number;
  churnDay: number;
  valuation: number;
  capacity: number;
  featureDaysLeft: number | null;
}
