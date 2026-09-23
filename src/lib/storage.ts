import type { SupabaseClient } from "@supabase/supabase-js";
import type { Derived, GameState } from "./game/types";
import { FEATURES, IDEAS, ROLES } from "./game/data";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { candidatosDeHandle, type Vibecoins } from "./perfil";

/** Limpia partidas guardadas por otras versiones: roles o features que esta versión no conoce. */
export function sanitize(s: GameState): GameState {
  const known = (r: string) => r in ROLES;
  s.employees = (s.employees ?? []).filter((e) => known(e.role));
  if (!s.employees.some((e) => e.founder)) s.employees.unshift({ id: "founder", name: s.founderName || "Fundador/a", role: "dev", level: 2, salary: 0, avatar: "🧑‍🚀", founder: true });
  s.candidates = (s.candidates ?? []).filter((c) => known(c.role));
  const feat = (id: string) => FEATURES.some((f) => f.id === id);
  s.done = (s.done ?? []).filter(feat);
  if (s.currentFeature && !feat(s.currentFeature)) {
    s.currentFeature = null;
    s.featureProgress = 0;
  }
  s.idea ||= IDEAS[0];
  s.boardGoal ??= null;
  s.boardFails ??= 0;
  s.pendingEvent ??= null;
  // planificador de eventos (partidas de versiones anteriores)
  s.pace ??= 1;
  s.seenEvents ??= [];
  s.eventCount ??= 0;
  s.lastEventDay ??= -99;
  s.reactiveCd ??= {};
  s.campaignCd ??= {};
  s.runSaved ??= false;
  s.precio ??= 1;
  s.conInvierno ??= false;
  s.inviernoDia ??= 0;
  s.golpesHype ??= [];
  s.officeMax ??= s.office;
  s.escenaVista ??= [];
  s.lastShipDay ??= s.day;
  s.idleDays ??= 0;
  s.hypeHighDays ??= 0;
  s.officeFullDays ??= 0;
  s.usersHistory ??= [];
  s.portfolio ??= [];
  s.achievements ??= [];
  s.log ??= [];
  return s;
}

export const LOCAL_KEY = "startup-tycoon:save";

export function localKey(userId?: string | null) {
  return userId ? `${LOCAL_KEY}:${userId}` : LOCAL_KEY;
}

export function loadLocal(userId?: string | null): GameState | null {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.version !== 1) return null;
    return sanitize(s);
  } catch {
    return null;
  }
}

export function saveLocal(s: GameState, userId?: string | null) {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(s));
  } catch {}
}

export function clearLocal(userId?: string | null) {
  try {
    localStorage.removeItem(localKey(userId));
  } catch {}
}

export interface LeaderRow {
  user_id: string;
  name: string;
  sector: string;
  valuation: number;
  users: number;
  mrr: number;
  stage: number;
  office: number;
  day: number;
  team_size: number;
  game_over: string | null;
  updated_at: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Perfil {
  id: string;
  display_name: string;
  avatar_url: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  handle?: string | null;
  proyecto?: string | null;
  proyecto_url?: string | null;
  proyecto_desc?: string | null;
}

/** Deja solo el usuario, venga como URL, con arroba o pelado. */
export function limpiarHandle(v: string, red: "x" | "linkedin") {
  let s = v.trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (red === "x") s = s.replace(/^(x|twitter)\.com\//i, "");
  else s = s.replace(/^([a-z]{2,3}\.)?linkedin\.com\/(in\/)?/i, "").replace(/^in\//i, "");
  return s.replace(/^@/, "").split(/[/?#]/)[0].slice(0, 40);
}

export const urlX = (h: string) => `https://x.com/${h}`;
export const urlLinkedin = (h: string) => `https://www.linkedin.com/in/${h}`;

/** Trae el perfil propio. Usa select(*) para no romper si faltan columnas nuevas. */
export async function fetchProfile(sb: SupabaseClient, userId: string): Promise<Perfil | null> {
  const { data } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Perfil) ?? null;
}

export async function fetchProfiles(sb: SupabaseClient, ids: string[]): Promise<Record<string, Perfil>> {
  if (!ids.length) return {};
  const { data } = await sb.from("profiles").select("*").in("id", ids);
  const out: Record<string, Perfil> = {};
  for (const p of (data ?? []) as Perfil[]) out[p.id] = p;
  return out;
}

export async function saveProfileLinks(sb: SupabaseClient, userId: string, links: { twitter: string; linkedin: string }) {
  const { error } = await sb.from("profiles").update({ twitter: links.twitter || null, linkedin: links.linkedin || null }).eq("id", userId);
  if (error) throw error;
}

/**
 * Guarda el proyecto y, si todavía no tenía, le asigna un handle. El handle se
 * deriva del nombre y el índice único de la base decide: si está tomado, se
 * reintenta con sufijo en vez de pedirle al jugador que invente uno.
 */
export async function saveProyecto(
  sb: SupabaseClient,
  userId: string,
  datos: { proyecto: string; proyecto_url: string; proyecto_desc: string },
  nombreParaHandle: string,
  handleActual?: string | null,
): Promise<string> {
  const campos = {
    proyecto: datos.proyecto.trim() || null,
    proyecto_url: datos.proyecto_url.trim() || null,
    proyecto_desc: datos.proyecto_desc.trim() || null,
  };
  if (handleActual) {
    const { error } = await sb.from("profiles").update(campos).eq("id", userId);
    if (error) throw error;
    return handleActual;
  }
  for (const handle of candidatosDeHandle(nombreParaHandle)) {
    const { error } = await sb.from("profiles").update({ ...campos, handle }).eq("id", userId);
    if (!error) return handle;
    // 23505 = el handle ya lo tiene otro; se reintenta con sufijo
    if ((error as { code?: string }).code !== "23505") throw error;
  }
  throw new Error("No pude armarte una dirección de perfil. Probá de nuevo.");
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  kind: string;
  created_at: string;
  author?: { display_name: string; avatar_url: string | null };
  startup?: { name: string; sector: string } | null;
  likes: number;
  liked: boolean;
}

export interface IncomingAction {
  id: string;
  from_user: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
  from_name: string;
}

export async function loadCloud(sb: SupabaseClient, userId: string): Promise<GameState | null> {
  const { data, error } = await sb.from("startups").select("state").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const s = data.state as GameState;
  return s?.version === 1 ? sanitize(s) : null;
}

export async function saveCloud(sb: SupabaseClient, userId: string, s: GameState, d: Derived) {
  const { error } = await sb.from("startups").upsert({
    user_id: userId,
    name: s.startupName,
    sector: s.sector,
    valuation: Math.round(d.valuation),
    users: Math.round(s.users),
    mrr: Math.round(d.mrr),
    cash: Math.round(s.cash),
    stage: s.stage,
    office: s.office,
    day: s.day,
    team_size: s.employees.length,
    game_over: s.gameOver,
    state: s,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export type RunRow = {
  game_id: string;
  office_max: number;
  precio: number;
  invierno: boolean;
  invierno_dia: number | null;
  name: string; sector: string; idea: string; ended_as: string; day: number;
  valuation: number; peak_users: number; mrr: number; equity: number;
  team_size: number; stage: number; raised: number; features: number;
};

/** Resumen de una partida terminada, listo para guardar. */
export function buildRun(s: GameState, d: Derived, endedAs: string): RunRow {
  return {
    game_id: s.id,
    office_max: Math.max(s.officeMax ?? 0, s.office),
    precio: s.precio ?? 1,
    // `conInvierno` solo dice que la partida nació con el motor nuevo: lo que
    // hay que medir es si el invierno efectivamente cayó, y qué día.
    invierno: !!s.inviernoDia,
    invierno_dia: s.inviernoDia || null,
    name: s.startupName,
    sector: s.sector,
    idea: s.idea,
    ended_as: endedAs,
    day: s.day,
    valuation: Math.round(d.valuation),
    peak_users: Math.round(s.stats.peakUsers),
    mrr: Math.round(d.mrr),
    equity: s.equity,
    team_size: s.employees.length,
    stage: s.stage,
    raised: Math.round(s.stats.raised),
    features: s.done.length,
  };
}

/** Guarda la partida terminada en el historial. Una sola vez por partida. */
export async function saveRun(sb: SupabaseClient, row: RunRow, userId: string | null, anonId: string) {
  const { error } = await sb.from("runs").insert({ ...row, user_id: userId, anon_id: anonId });
  // 23505 = ya estaba guardada; no es un error que haya que reintentar
  if (error && error.code !== "23505") throw error;
}

/**
 * Sube la partida que estaba esperando y devuelve si quedó guardada. Se usa al
 * compartir: el link solo funciona si la fila ya existe.
 */
export async function asegurarRunGuardada(sb: SupabaseClient, row: RunRow, userId: string | null, anonId: string) {
  if (!leerRunPendiente()) return true; // ya estaba guardada
  try {
    await saveRun(sb, row, userId, anonId);
    borrarRunPendiente();
    return true;
  } catch {
    return false;
  }
}

/**
 * Partida terminada sin sesión: queda esperando en el navegador. Si el jugador
 * entra con Google desde el cartel del final, se guarda a su nombre; si no,
 * se guarda anónima la próxima vez que abra el juego. En ningún caso se pierde.
 */
const PENDING_KEY = "startup-tycoon:pending-run";

export function guardarRunPendiente(row: RunRow) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(row));
  } catch {}
}

export function leerRunPendiente(): RunRow | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as RunRow) : null;
  } catch {
    return null;
  }
}

export function borrarRunPendiente() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

/** Mientras va y vuelve de Google no hay que mandar la partida como anónima. */
let yendoALoguearse = false;
export function marcarLoginEnCurso() {
  yendoALoguearse = true;
}

/**
 * El jugador cierra la pestaña con una partida esperando: se manda anónima ahí
 * mismo. `keepalive` hace que el navegador la termine de enviar aunque la
 * página ya no exista, así no perdemos la estadística de los que no vuelven.
 */
export function enviarRunPendienteAlSalir(anonId: string) {
  if (yendoALoguearse) return;
  const row = leerRunPendiente();
  if (!row || !SUPABASE_URL || !SUPABASE_KEY) return;
  borrarRunPendiente();
  fetch(`${SUPABASE_URL}/rest/v1/runs`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ...row, user_id: null, anon_id: anonId }),
    keepalive: true,
  }).catch(() => guardarRunPendiente(row));
}

export interface RunRanking {
  id: string;
  user_id: string | null;
  name: string;
  sector: string;
  ended_as: string;
  day: number;
  valuation: number;
  peak_users: number;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

const CAMPOS_RUN = "sector, ended_as, day, valuation, peak_users, equity, team_size, stage, created_at";

/** Historial completo del jugador, para la carrera y los logros. */
export async function fetchMisRuns(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb
    .from("runs")
    .select(`id, name, idea, ${CAMPOS_RUN}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

/**
 * Ranking de partidas terminadas. `desdeDias` lo acota a los últimos días
 * (el semanal); sin eso es el salón de la fama. Las partidas sin sesión quedan
 * afuera: no tienen nombre para mostrar.
 */
export async function fetchRankingRuns(sb: SupabaseClient, desdeDias?: number, limit = 50): Promise<RunRanking[]> {
  let q = sb.from("runs_ranking").select("*").not("user_id", "is", null);
  if (desdeDias) q = q.gte("created_at", new Date(Date.now() - desdeDias * 864e5).toISOString());
  const { data, error } = await q.order("valuation", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as RunRanking[]) ?? [];
}

export interface RunsResumen {
  partidas: number;
  ganadas: number;
  jugadores: number;
  con_cuenta: number;
  dias_prom: number;
  features_prom: number;
  ipo: number;
  acquired: number;
  bankrupt: number;
  fired: number;
  abandoned: number;
  ultimas_24h: number;
}

export interface RunsSector {
  sector: string;
  partidas: number;
  ganadas: number;
  dias_prom: number;
}

/**
 * Métricas globales. Las cuentas las hace Postgres porque PostgREST devuelve
 * como máximo 1000 filas: contando del lado del cliente, el panel se quedaría
 * clavado en 1000 partidas para siempre.
 */
export interface RunsActo {
  acto: string;
  partidas: number;
  ganadas: number;
  dias_prom: number;
  equipo_prom: number;
  precio_prom: number | null;
  con_invierno: number;
}

export interface RunsSalida {
  invierno: boolean;
  partidas: number;
  dia_p25: number;
  dia_mediana: number;
  dia_p75: number;
}

/** Métricas por acto y cuándo se bajan. Las cuentas las hace Postgres. */
export async function fetchStatsActos(sb: SupabaseClient) {
  const [actos, salidas] = await Promise.all([
    sb.from("runs_por_acto").select("*"),
    sb.from("runs_salidas").select("*"),
  ]);
  if (actos.error) throw actos.error;
  return { actos: (actos.data ?? []) as RunsActo[], salidas: (salidas.data ?? []) as RunsSalida[] };
}

export async function fetchStatsGlobales(sb: SupabaseClient) {
  const [resumen, sectores] = await Promise.all([
    sb.from("runs_resumen").select("*").single(),
    sb.from("runs_por_sector").select("*"),
  ]);
  if (resumen.error) throw resumen.error;
  if (sectores.error) throw sectores.error;
  return { resumen: resumen.data as RunsResumen, sectores: (sectores.data ?? []) as RunsSector[] };
}

export async function ensureProfile(sb: SupabaseClient, userId: string, name: string) {
  await sb.from("profiles").upsert({ id: userId, display_name: name }, { onConflict: "id", ignoreDuplicates: true });
}

export async function fetchLeaderboard(sb: SupabaseClient, limit = 50): Promise<LeaderRow[]> {
  const { data, error } = await sb.from("leaderboard").select("*").order("valuation", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}

export async function fetchStartupState(sb: SupabaseClient, userId: string): Promise<{ row: LeaderRow; state: GameState } | null> {
  const [{ data: row }, { data: st }] = await Promise.all([
    sb.from("leaderboard").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("startups").select("state").eq("user_id", userId).maybeSingle(),
  ]);
  if (!row || !st) return null;
  return { row: row as LeaderRow, state: st.state as GameState };
}

export async function fetchPortfolioTargets(sb: SupabaseClient, ids: string[]): Promise<Record<string, { mrr: number; valuation: number; name: string }>> {
  if (ids.length === 0) return {};
  const { data } = await sb.from("startups").select("user_id, mrr, valuation, name").in("user_id", ids);
  const out: Record<string, { mrr: number; valuation: number; name: string }> = {};
  for (const r of data ?? []) out[r.user_id] = { mrr: Number(r.mrr), valuation: Number(r.valuation), name: r.name };
  return out;
}

export async function fetchPosts(sb: SupabaseClient, me: string, limit = 40): Promise<Post[]> {
  const { data, error } = await sb
    .from("posts")
    .select("id, user_id, content, kind, created_at, profiles:profiles!posts_user_id_fkey(display_name, avatar_url), post_likes(user_id)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const userIds = Array.from(new Set((data ?? []).map((p) => p.user_id)));
  const { data: startups } = userIds.length ? await sb.from("startups").select("user_id, name, sector").in("user_id", userIds) : { data: [] };
  const byUser = new Map((startups ?? []).map((s) => [s.user_id, { name: s.name, sector: s.sector }]));
  return (data ?? []).map((p) => {
    const likes = (p.post_likes as { user_id: string }[]) ?? [];
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      kind: p.kind,
      created_at: p.created_at,
      author: (prof as { display_name: string; avatar_url: string | null }) ?? undefined,
      startup: byUser.get(p.user_id) ?? null,
      likes: likes.length,
      liked: likes.some((l) => l.user_id === me),
    };
  });
}

export async function createPost(sb: SupabaseClient, userId: string, content: string, kind = "post") {
  const { error } = await sb.from("posts").insert({ user_id: userId, content: content.slice(0, 280), kind });
  if (error) throw error;
}

export async function toggleLike(sb: SupabaseClient, postId: string, userId: string, liked: boolean) {
  if (liked) await sb.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  else await sb.from("post_likes").insert({ post_id: postId, user_id: userId });
}

export async function sendAction(sb: SupabaseClient, from: string, to: string, kind: "invest" | "hype" | "poach", payload: Record<string, unknown>) {
  const { error } = await sb.from("social_actions").insert({ from_user: from, to_user: to, kind, payload });
  if (error) throw error;
}

export async function fetchIncoming(sb: SupabaseClient, userId: string): Promise<IncomingAction[]> {
  const { data, error } = await sb
    .from("social_actions")
    .select("id, from_user, kind, payload, created_at")
    .eq("to_user", userId)
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  const ids = Array.from(new Set((data ?? []).map((a) => a.from_user)));
  const { data: names } = ids.length ? await sb.from("startups").select("user_id, name").in("user_id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.user_id, n.name]));
  return (data ?? []).map((a) => ({ ...a, payload: (a.payload ?? {}) as Record<string, unknown>, from_name: nameOf.get(a.from_user) ?? "Alguien" }));
}

export async function markProcessed(sb: SupabaseClient, ids: string[]) {
  if (!ids.length) return;
  await sb.from("social_actions").update({ processed_at: new Date().toISOString() }).in("id", ids);
}

export async function hypedToday(sb: SupabaseClient, from: string, to: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await sb.from("social_actions").select("id", { count: "exact", head: true }).eq("from_user", from).eq("to_user", to).eq("kind", "hype").gte("created_at", since);
  return (count ?? 0) > 0;
}

/** Saldo de vibecoins del jugador. Se deriva de sus partidas, no se guarda. */
export async function fetchVibecoins(sb: SupabaseClient, userId: string): Promise<Vibecoins | null> {
  const { data } = await sb.from("vibecoins").select("*").eq("user_id", userId).maybeSingle();
  return (data as Vibecoins) ?? null;
}

/**
 * Da una moneda a un proyecto. El saldo lo valida la base: si no alcanza, el
 * insert lo rechaza la policy y devolvemos el motivo en criollo.
 */
export async function votarProyecto(
  sb: SupabaseClient,
  voter: string,
  target: string,
  tipo: "juego" | "invitacion" = "juego",
): Promise<string | null> {
  const { error } = await sb.from("project_votes").insert({ voter, target, tipo });
  if (!error) return null;
  const codigo = (error as { code?: string }).code;
  // la policy junta dos reglas, así que el 42501 puede ser falta de saldo o el
  // tope de 3; quien llama sabe cuál mostrar
  if (codigo === "42501") return "Te quedaste sin vibecoins. Jugá una partida y volvé.";
  if (codigo === "23514") return "No podés votar tu propio proyecto.";
  return error.message;
}

/** Cuántas monedas le dio este jugador a cada proyecto. Tope de 3 por proyecto. */
export const TOPE_VOTOS_POR_PROYECTO = 3;

export async function fetchMisVotos(sb: SupabaseClient, userId: string): Promise<Record<string, number>> {
  // solo las de juego: son las que cuentan para el tope de 3
  const { data } = await sb.from("project_votes").select("target").eq("voter", userId).eq("tipo", "juego").limit(1000);
  const out: Record<string, number> = {};
  for (const v of (data ?? []) as { target: string }[]) out[v.target] = (out[v.target] ?? 0) + 1;
  return out;
}

export const REF_KEY = "startup-tycoon:invitado-por";

/** Guarda quién te invitó, para reclamarlo cuando entres con cuenta. */
export function guardarInvitacion(handle: string) {
  try {
    if (!localStorage.getItem(REF_KEY)) localStorage.setItem(REF_KEY, handle);
  } catch {}
}

/**
 * Atribuye la invitación una sola vez. El trigger de la base se encarga de que
 * no se pueda cambiar después, así que reintentar es inofensivo.
 */
export async function reclamarInvitacion(sb: SupabaseClient, userId: string) {
  let handle: string | null = null;
  try {
    handle = localStorage.getItem(REF_KEY);
  } catch {}
  if (!handle) return;
  const { data: yo } = await sb.from("profiles").select("invitado_por").eq("id", userId).maybeSingle();
  if ((yo as { invitado_por?: string | null } | null)?.invitado_por) {
    try { localStorage.removeItem(REF_KEY); } catch {}
    return;
  }
  const { data: quien } = await sb.from("profiles").select("id").eq("handle", handle.toLowerCase()).maybeSingle();
  const id = (quien as { id?: string } | null)?.id;
  if (!id || id === userId) return;
  await sb.from("profiles").update({ invitado_por: id }).eq("id", userId);
  try { localStorage.removeItem(REF_KEY); } catch {}
}

// ---------------------------------------------------------------------------
// Tu puesto
//
// El ranking muestra 50 filas y hay más de mil jugadores: casi nadie se ve ahí
// adentro, y el que no se ve no tiene forma de saber si le fue bien o mal. En
// vez de traer el ranking entero para buscarse (PostgREST corta en mil filas de
// todos modos), se cuenta cuántas partidas hay por encima.
// ---------------------------------------------------------------------------

export interface MiPuesto {
  puesto: number;
  total: number;
  valuation: number;
  name: string | null;
  /** Cuánto falta para entrar al top que se está mirando. 0 si ya está adentro. */
  falta: number;
}

const desdeISO = (dias?: number) => (dias ? new Date(Date.now() - dias * 864e5).toISOString() : null);

/**
 * Puesto de una valuación en el ranking de partidas terminadas, sin necesidad
 * de que la partida esté guardada todavía: sirve para la pantalla final.
 */
export async function puestoDeValuacion(
  sb: SupabaseClient,
  valuation: number,
  desdeDias?: number,
): Promise<{ puesto: number; total: number } | null> {
  const desde = desdeISO(desdeDias);
  const base = () => {
    let q = sb.from("runs_ranking").select("id", { count: "exact", head: true }).not("user_id", "is", null);
    if (desde) q = q.gte("created_at", desde);
    return q;
  };
  const [arriba, todas] = await Promise.all([base().gt("valuation", Math.round(valuation)), base()]);
  if (arriba.error || todas.error) return null;
  return { puesto: (arriba.count ?? 0) + 1, total: todas.count ?? 0 };
}

/** El mejor puesto del jugador, se vea o no en el top que está mirando. */
export async function fetchMiPuestoRuns(
  sb: SupabaseClient,
  userId: string,
  desdeDias?: number,
): Promise<MiPuesto | null> {
  const desde = desdeISO(desdeDias);
  let q = sb.from("runs_ranking").select("name, valuation").eq("user_id", userId);
  if (desde) q = q.gte("created_at", desde);
  const { data } = await q.order("valuation", { ascending: false }).limit(1);
  const fila = (data as { name: string; valuation: number }[] | null)?.[0];
  if (!fila) return null;
  const r = await puestoDeValuacion(sb, fila.valuation, desdeDias);
  if (!r) return null;
  return { ...r, valuation: Number(fila.valuation), name: fila.name, falta: 0 };
}

/** Puesto de la partida en curso, entre todas las que se están jugando ahora. */
export async function fetchMiPuestoVivo(sb: SupabaseClient, userId: string): Promise<MiPuesto | null> {
  const { data } = await sb.from("leaderboard").select("name, valuation").eq("user_id", userId).maybeSingle();
  const fila = data as { name: string; valuation: number } | null;
  if (!fila) return null;
  const base = () => sb.from("leaderboard").select("user_id", { count: "exact", head: true });
  const [arriba, todas] = await Promise.all([base().gt("valuation", fila.valuation), base()]);
  if (arriba.error || todas.error) return null;
  return {
    puesto: (arriba.count ?? 0) + 1,
    total: todas.count ?? 0,
    valuation: Number(fila.valuation),
    name: fila.name,
    falta: 0,
  };
}
