"use client";
/**
 * Telemetría local: se guarda por navegador en localStorage.
 * Cuando haya login, estos mismos registros se pueden subir a Supabase sin cambiar la forma.
 */
import type { GameState } from "./game/types";

export const RUNS_KEY = "startup-tycoon:runs";
export const PLAYER_KEY = "startup-tycoon:player";
const MAX_RUNS = 60;

export type Outcome = "playing" | "bankrupt" | "ipo" | "acquired" | "fired" | "abandoned";

export interface RunRecord {
  id: string;
  playerId: string;
  startedAt: number;
  updatedAt: number;
  playedMs: number; // tiempo real con la pestaña abierta
  sector: string;
  pace: number;
  days: number;
  outcome: Outcome;
  users: number;
  valuation: number;
  cash: number;
  stage: number;
  employees: number;
  features: number;
  events: number; // popups que aparecieron
  decisions: { id: string; choice: number; day: number }[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function playerId() {
  let id = read<string | null>(PLAYER_KEY, null);
  if (!id) {
    id = `p${Math.random().toString(36).slice(2, 10)}`;
    write(PLAYER_KEY, id);
  }
  return id;
}

export function getRuns(): RunRecord[] {
  return read<RunRecord[]>(RUNS_KEY, []);
}

function putRun(r: RunRecord) {
  const runs = getRuns().filter((x) => x.id !== r.id);
  runs.push(r);
  runs.sort((a, b) => a.startedAt - b.startedAt);
  write(RUNS_KEY, runs.slice(-MAX_RUNS));
}

export function clearRuns() {
  try {
    localStorage.removeItem(RUNS_KEY);
  } catch {}
}

/** Registra o actualiza la partida en curso. `deltaMs` es el tiempo real transcurrido. */
export function trackRun(s: GameState, deltaMs: number, extra?: { decision?: { id: string; choice: number; day: number } }) {
  const runs = getRuns();
  const prev = runs.find((x) => x.id === s.id);
  const rec: RunRecord = prev ?? {
    id: s.id,
    playerId: playerId(),
    startedAt: Date.now(),
    updatedAt: Date.now(),
    playedMs: 0,
    sector: s.sector,
    pace: s.pace ?? 1,
    days: s.day,
    outcome: "playing",
    users: 0,
    valuation: 0,
    cash: 0,
    stage: 0,
    employees: 0,
    features: 0,
    events: 0,
    decisions: [],
  };
  rec.updatedAt = Date.now();
  rec.playedMs += Math.max(0, Math.min(deltaMs, 60_000));
  rec.days = s.day;
  rec.users = Math.round(s.users);
  rec.cash = Math.round(s.cash);
  rec.stage = s.stage;
  rec.employees = s.employees.length;
  rec.features = s.done.length;
  rec.events = s.eventCount ?? 0;
  rec.pace = s.pace ?? 1;
  if (extra?.decision) rec.decisions.push(extra.decision);
  if (s.gameOver) rec.outcome = s.gameOver;
  putRun(rec);
}

export function trackValuation(s: GameState, valuation: number) {
  const runs = getRuns();
  const rec = runs.find((x) => x.id === s.id);
  if (!rec) return;
  rec.valuation = Math.round(valuation);
  putRun(rec);
}

/** Marca como abandonadas las partidas viejas que quedaron "playing". */
export function closeStaleRuns(currentId?: string) {
  const runs = getRuns();
  let changed = false;
  for (const r of runs) {
    if (r.outcome === "playing" && r.id !== currentId && Date.now() - r.updatedAt > 6 * 3600 * 1000) {
      r.outcome = "abandoned";
      changed = true;
    }
  }
  if (changed) write(RUNS_KEY, runs);
}
