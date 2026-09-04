import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Startup Tycoon — fundá una startup con IA y llegá a unicornio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARDS = [
  { i: "🤖", t: "Agentes IA" },
  { i: "🛠️", t: "Producto" },
  { i: "💸", t: "Rondas" },
  { i: "🦄", t: "Unicornio" },
];

export default async function OgImage() {
  const font = await readFile(join(process.cwd(), "src/app/_fonts/nunito-800.ttf"));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fbf7ef", padding: 72, position: "relative" }}>
        {/* manchas decorativas */}
        <div style={{ position: "absolute", top: -140, right: -110, width: 480, height: 480, borderRadius: 999, background: "#f5b731", opacity: 0.28, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -190, left: -130, width: 420, height: 420, borderRadius: 999, background: "#5b5bd6", opacity: 0.16, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 112, height: 112, borderRadius: 28, background: "#5b5bd6", alignItems: "center", justifyContent: "center", fontSize: 66, border: "6px solid #1f1b16", marginRight: 26 }}>🚀</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, color: "#1f1b16", letterSpacing: -3, lineHeight: 1 }}>Startup Tycoon</div>
            <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.55, marginTop: 10 }}>vibecodingame.com</div>
          </div>
        </div>

        <div style={{ fontSize: 42, color: "#1f1b16", marginTop: 44, maxWidth: 1000, lineHeight: 1.3, opacity: 0.9 }}>
          Fundá una startup hecha 100% con IA. Contratá agentes, shippeá features, levantá rondas y llegá a unicornio.
        </div>

        <div style={{ display: "flex", marginTop: 48 }}>
          {CARDS.map((c) => (
            <div key={c.t} style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "5px solid #1f1b16", borderRadius: 24, padding: "18px 30px", fontSize: 32, color: "#1f1b16", marginRight: 18 }}>
              <span style={{ fontSize: 40, marginRight: 14 }}>{c.i}</span>
              <span>{c.t}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, emoji: "noto", fonts: [{ name: "Nunito", data: font, weight: 800, style: "normal" }] },
  );
}
