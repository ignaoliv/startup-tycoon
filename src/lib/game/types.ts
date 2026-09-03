export type Role = "ai" | "dev" | "design" | "marketing" | "social" | "sales" | "qa" | "ops" | "cto" | "cmo" | "cfo" | "coo";
export type ExecRole = "cto" | "cmo" | "cfo" | "coo";
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
  apply: (s: GameState) => string; // devuelve texto de resultado
}

export interface GameEventDef {
  id: string;
  title: string;
  icon: string;
  text: string;
  minDay?: number;
  minUsers?: number;
  choices: EventChoice[];
}

export interface CampaignDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: (s: GameState) => number;
  cooldown: number; // días
  hype: number;
  followers: (s: GameState) => number;
  users?: (s: GameState) => number;
  morale?: number;
  requires?: (s: GameState) => string | null; // texto de por qué no se puede
  risk?: { chance: number; text: string; hype: number }; // puede salir mal
}

export interface ExecDef {
  role: ExecRole;
  name: string;
  icon: string;
  baseSalary: number; // se multiplica por la valuación
  equity: number; // % que pide al entrar
  desc: string;
  bonus: string;
  penalty: string;
  /** Texto de por qué ya lo necesitás, o null si todavía no. */
  needed: (s: GameState) => string | null;
}

export interface ExecStatus {
  role: ExecRole;
  hired: boolean;
  neededWhy: string | null;
  salary: number;
  fee: number;
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
  bankruptDays: number;
  lastRaiseDay: number; // último ajuste de sueldos por inflación
  gameOver: "bankrupt" | "ipo" | "acquired" | null;
  restarts: number;
  stats: { totalRevenue: number; peakUsers: number; raised: number; hires: number };
  achievements: string[];
  portfolio: PortfolioEntry[];
  followers: number; // seguidores en redes
  campaignCooldowns: Record<string, number>; // id -> día en que vuelve a estar disponible
  adsLevel: number; // 0 apagado .. 3
  buildInPublic: boolean; // #buildinpublic en el perfil: suma fijo todos los días
  customFeatures: number; // features "nuevas" repetibles completadas
  rebrands: number;
  debt: number; // deuda con el banco
  pendingRename: boolean; // rebranding terminado, falta elegir nombre
  exitAmount: number; // lo que cobraste al vender / IPO
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
  socialPts: number;
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
  loanRate: number; // mensual
  loanCapacity: number; // cuánto más te presta el banco
  debtInterestDay: number;
  debtPaymentDay: number;
  sellOffer: number; // oferta por el 100% de la empresa
  hypeDecayDay: number; // cuánto baja el hype por día (negativo = sube)
  followersDay: number;
  organicUsersDay: number; // usuarios que llegan por seguidores
  adsCostDay: number;
  adsUsersDay: number;
  execs: ExecStatus[];
  overhead: number; // multiplicador de productividad por burocracia (1 = sin pérdida)
}
