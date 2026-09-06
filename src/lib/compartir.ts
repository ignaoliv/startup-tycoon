/**
 * Datos de una partida para compartirla. Se leen sin cookies porque la tabla
 * `runs` es de lectura pública: así funciona también al generar la imagen de
 * preview, que corre sin sesión.
 */
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { SECTORS } from "./game/data";

export interface RunCompartida {
  game_id: string;
  name: string;
  sector: string;
  idea: string | null;
  ended_as: string;
  day: number;
  valuation: number;
  peak_users: number;
  equity: number;
  team_size: number;
  features: number;
  display_name: string | null;
}

export async function fetchRunPorGameId(gameId: string): Promise<RunCompartida | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const cabeceras = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const opciones = { headers: cabeceras, next: { revalidate: 300 } };

  const campos = "game_id,name,sector,idea,ended_as,day,valuation,peak_users,equity,team_size,features,user_id";
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/runs?select=${campos}&game_id=eq.${encodeURIComponent(gameId)}&limit=1`,
    opciones,
  );
  if (!res.ok) return null;
  const filas = (await res.json()) as (Omit<RunCompartida, "display_name"> & { user_id: string | null })[];
  const fila = filas[0];
  if (!fila) return null;

  // el nombre del jugador vive en profiles; runs no lo tiene
  let display_name: string | null = null;
  if (fila.user_id) {
    const p = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=display_name&id=eq.${fila.user_id}&limit=1`,
      opciones,
    );
    if (p.ok) display_name = ((await p.json())[0]?.display_name as string) ?? null;
  }
  return { ...fila, display_name };
}

export const FINALES: Record<string, { titulo: string; icono: string; tono: "bien" | "mal" }> = {
  ipo: { titulo: "Salió a bolsa", icono: "🔔", tono: "bien" },
  acquired: { titulo: "La compraron", icono: "🏝️", tono: "bien" },
  bankrupt: { titulo: "Cerró", icono: "💀", tono: "mal" },
  fired: { titulo: "Lo echó el board", icono: "🪑", tono: "mal" },
  abandoned: { titulo: "Quedó por el camino", icono: "🚪", tono: "mal" },
};

export const sectorDe = (id: string) => SECTORS.find((s) => s.id === id);

/** Plata corta para la imagen y el tweet: $1,2B / $340M / $58k. */
export function plataCorta(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1).replace(".", ",").replace(",0", "")}B`;
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}k`;
  return `$${Math.round(v)}`;
}

export function numCorto(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",").replace(",0", "")}M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v));
}

/** El texto del tweet. El link va aparte para que X arme la tarjeta. */
export function textoParaCompartir(r: RunCompartida) {
  const s = sectorDe(r.sector);
  const base = `${r.name}${s ? ` · ${s.name}` : ""}`;
  switch (r.ended_as) {
    case "ipo":
      return `🔔 Saqué ${base} a bolsa: ${plataCorta(r.valuation)} en ${r.day} días, con ${numCorto(r.peak_users)} usuarios.\n\n¿Podés hacerlo mejor?`;
    case "acquired":
      return `🏝️ Me compraron ${base} por ${plataCorta(r.valuation)} en ${r.day} días.\n\n¿Podés hacerlo mejor?`;
    case "fired":
      return `🪑 El board me echó de ${base} el día ${r.day}, con ${numCorto(r.peak_users)} usuarios y ${plataCorta(r.valuation)} de valuación.\n\nA ver si te va mejor.`;
    case "bankrupt":
      return `💀 ${base} cerró el día ${r.day}. Pico de ${numCorto(r.peak_users)} usuarios y ${r.features} features.\n\nA ver si te va mejor.`;
    default:
      return `Jugué ${base} en Vibe Coding Game: día ${r.day}, ${numCorto(r.peak_users)} usuarios.`;
  }
}
