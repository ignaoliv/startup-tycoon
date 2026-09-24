import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { fetchProyectos } from "@/lib/perfil";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const alt = "Los proyectos de la comunidad de vibecoders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Cuántos proyectos hay. Se cuenta en la base y no se traen las filas. */
async function contarProyectos(): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/proyectos?select=user_id`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    next: { revalidate: 300 },
  });
  const total = Number(res.headers.get("content-range")?.split("/")[1]);
  return Number.isFinite(total) ? total : null;
}

export default async function OgProyectos() {
  const [proyectos, total, font, logo] = await Promise.all([
    fetchProyectos(3).catch(() => []),
    contarProyectos().catch(() => null),
    readFile(join(process.cwd(), "src/app/_fonts/nunito-800.ttf")),
    readFile(join(process.cwd(), "src/app/_fonts/logo-og.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  // Con dos o tres proyectos la grilla anuncia un salón vacío, así que hasta
  // que haya con qué llenarla la tarjeta invita en vez de contar.
  const haySala = proyectos.length >= 3 && (total ?? 0) >= 5;

  // Satori: cada bloque con más de un hijo necesita display flex explícito.
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbf7ef", padding: 64, position: "relative" }}>
        <div style={{ position: "absolute", top: -160, right: -130, width: 470, height: 470, borderRadius: 999, background: "#f5b731", opacity: 0.26, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -210, left: -150, width: 420, height: 420, borderRadius: 999, background: "#5b5bd6", opacity: 0.14, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logoSrc} width={300} height={80} alt="Vibe Coding Game" />
          <div style={{ fontSize: 24, color: "#1f1b16", opacity: 0.5, marginLeft: 16, display: "flex" }}>vibecodingame.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, color: "#1f1b16", lineHeight: 1.05, display: "flex" }}>
            Qué está vibecodeando la comunidad
          </div>
          <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.65, marginTop: 12, display: "flex" }}>
            {haySala && total
              ? `${total} proyectos reales de gente que juega`
              : "Mostrá el tuyo al lado de tu mejor partida"}
          </div>

          <div style={{ display: "flex", marginTop: 32 }}>
            {(haySala ? proyectos : []).map((p) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", background: "#ffffff", border: "5px solid #1f1b16", borderRadius: 22, padding: "14px 24px", marginRight: 16, width: 330 }}>
                <div style={{ fontSize: 34, color: "#1f1b16", display: "flex" }}>{p.proyecto.slice(0, 18)}</div>
                <div style={{ fontSize: 22, color: "#1f1b16", opacity: 0.5, marginTop: 2, display: "flex" }}>
                  🪙 {p.votos} · {p.display_name ?? p.handle}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.7, display: "flex" }}>
          Se votan con vibecoins, que se ganan jugando · sumá el tuyo
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Nunito", data: font, weight: 800, style: "normal" }] },
  );
}
