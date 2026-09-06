import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { FINALES, fetchRunPorGameId, numCorto, plataCorta, sectorDe } from "@/lib/compartir";

export const runtime = "nodejs";
export const alt = "Resultado de una partida en Vibe Coding Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgPartida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r, font, logo] = await Promise.all([
    fetchRunPorGameId(id),
    readFile(join(process.cwd(), "src/app/_fonts/nunito-800.ttf")),
    readFile(join(process.cwd(), "src/app/_fonts/logo-og.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const fin = FINALES[r?.ended_as ?? ""] ?? FINALES.abandoned;
  const sec = r ? sectorDe(r.sector) : null;
  const gano = fin.tono === "bien";

  const datos = r
    ? [
        { k: "Valuación", v: plataCorta(r.valuation) },
        { k: "Usuarios", v: numCorto(r.peak_users) },
        { k: "Días", v: String(r.day) },
        { k: "Features", v: String(r.features) },
      ]
    : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbf7ef", padding: 64, position: "relative" }}>
        <div style={{ position: "absolute", top: -150, right: -120, width: 470, height: 470, borderRadius: 999, background: gano ? "#f5b731" : "#e05252", opacity: 0.26, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -200, left: -140, width: 420, height: 420, borderRadius: 999, background: "#5b5bd6", opacity: 0.14, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logoSrc} width={300} height={80} alt="Vibe Coding Game" />
          <div style={{ fontSize: 24, color: "#1f1b16", opacity: 0.5, marginLeft: 16 }}>vibecodingame.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 76, marginRight: 20, display: "flex" }}>{fin.icono}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 58, color: "#1f1b16", lineHeight: 1.05 }}>{r ? r.name : "Vibe Coding Game"}</div>
              <div style={{ fontSize: 28, color: gano ? "#2e8b57" : "#c0392b", marginTop: 6 }}>
                {r ? `${fin.titulo} el día ${r.day}${sec ? ` · ${sec.name}` : ""}` : "Fundá una startup hecha 100% con IA"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 34 }}>
            {datos.map((d) => (
              <div key={d.k} style={{ display: "flex", flexDirection: "column", background: "#ffffff", border: "5px solid #1f1b16", borderRadius: 22, padding: "14px 24px", marginRight: 16, width: 232 }}>
                <div style={{ fontSize: 20, color: "#1f1b16", opacity: 0.5 }}>{d.k}</div>
                <div style={{ fontSize: 44, color: "#1f1b16", marginTop: 2 }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.7, display: "flex" }}>
          {r?.display_name ? `Fundada por ${r.display_name} · ¿podés hacerlo mejor?` : "¿Podés hacerlo mejor? vibecodingame.com"}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Nunito", data: font, weight: 800, style: "normal" }] },
  );
}
