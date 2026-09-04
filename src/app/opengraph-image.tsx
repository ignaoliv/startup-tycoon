import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Vibe Coding Game — fundá una startup con IA y llegá a unicornio";
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
  const logo = await readFile(join(process.cwd(), "src/app/_fonts/logo-og.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fbf7ef", padding: 72, position: "relative" }}>
        {/* manchas decorativas */}
        <div style={{ position: "absolute", top: -140, right: -110, width: 480, height: 480, borderRadius: 999, background: "#f5b731", opacity: 0.28, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -190, left: -130, width: 420, height: 420, borderRadius: 999, background: "#5b5bd6", opacity: 0.16, display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={560} height={150} alt="Vibe Coding Game" />
          <div style={{ fontSize: 28, color: "#1f1b16", opacity: 0.55, marginTop: 2, marginLeft: 6 }}>vibecodingame.com</div>
        </div>

        <div style={{ fontSize: 38, color: "#1f1b16", marginTop: 34, maxWidth: 1010, lineHeight: 1.32, opacity: 0.9 }}>
          Fundá una startup hecha 100% con IA: contratá agentes, shippeá features y llegá a unicornio.
        </div>

        <div style={{ display: "flex", marginTop: 40 }}>
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
