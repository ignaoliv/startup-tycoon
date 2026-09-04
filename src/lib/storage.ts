import type { SupabaseClient } from "@supabase/supabase-js";
import type { Derived, GameState } from "./game/types";
import { FEATURES, IDEAS, ROLES } from "./game/data";

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
  s.lastShipDay ??= s.day;
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
