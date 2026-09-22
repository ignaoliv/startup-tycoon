import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { SECTORS } from "./game/data";

export interface PerfilPublico {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  twitter: string | null;
  linkedin: string | null;
  proyecto: string | null;
  proyecto_url: string | null;
  proyecto_desc: string | null;
  mejor_startup: string | null;
  mejor_sector: string | null;
  mejor_valuacion: number | null;
  mejor_usuarios: number | null;
  mejor_dia: number | null;
  mejor_final: string | null;
  partidas: number | null;
  ganadas: number | null;
}

/** Perfil por handle, listo para renderizar en el servidor. */
export async function fetchPerfilPorHandle(handle: string): Promise<PerfilPublico | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/perfiles_publicos?select=*&handle=eq.${encodeURIComponent(handle.toLowerCase())}&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 120 } },
  );
  if (!res.ok) return null;
  return ((await res.json()) as PerfilPublico[])[0] ?? null;
}

/**
 * En qué puesto del ranking histórico está su mejor partida. Se cuenta cuántas
 * hay por encima en vez de traerse la tabla entera.
 */
export async function fetchPuesto(valuacion: number): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !valuacion) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/runs_ranking?select=id&user_id=not.is.null&valuation=gt.${valuacion}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      next: { revalidate: 120 },
    },
  );
  if (!res.ok) return null;
  const total = Number(res.headers.get("content-range")?.split("/")[1]);
  return Number.isFinite(total) ? total + 1 : null;
}

/**
 * Un handle a partir del nombre. No garantiza que esté libre: de eso se encarga
 * el índice único, y quien guarda reintenta con sufijo.
 */
export function handleDesdeNombre(nombre: string) {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base.length >= 2 ? base : `jugador-${Math.random().toString(36).slice(2, 7)}`;
}

export const sectorDe = (id: string | null) => (id ? SECTORS.find((s) => s.id === id) : undefined);

/** El link tal como lo escribió el jugador, normalizado para poder abrirlo. */
export function urlProyecto(url: string | null) {
  if (!url) return null;
  const limpio = url.trim();
  if (!limpio) return null;
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
}

export function dominioDe(url: string | null) {
  const u = urlProyecto(url);
  if (!u) return null;
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export interface Vibecoins {
  user_id: string;
  juego_ganadas: number;
  invit_ganadas: number;
  juego_gastadas: number;
  invit_gastadas: number;
  /** Con tope de 3 por proyecto. */
  saldo_juego: number;
  /** Sin tope: se pueden poner donde ya votaste. */
  saldo_invitacion: number;
  saldo: number;
}

export interface ProyectoListado {
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  twitter: string | null;
  proyecto: string;
  proyecto_url: string | null;
  proyecto_desc: string | null;
  created_at: string;
  votos: number;
  votos_semana: number;
  mejor_valuacion: number | null;
  mejor_startup: string | null;
}

/** El ranking de proyectos: más monedas arriba, y a igualdad, lo más nuevo. */
export async function fetchProyectos(limite = 60): Promise<ProyectoListado[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/proyectos?select=*&order=votos.desc,created_at.desc&limit=${limite}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 60 } },
  );
  if (!res.ok) return [];
  return (await res.json()) as ProyectoListado[];
}
