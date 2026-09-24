import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { numCorto, plataCorta } from "@/lib/compartir";
import { dominioDe, fetchPerfilPorHandle, fetchProyectosDe, sectorDe } from "@/lib/perfil";

export const runtime = "nodejs";
export const alt = "Perfil de un vibecoder en Vibe Coding Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgPerfil({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [p, font, logo] = await Promise.all([
    fetchPerfilPorHandle(handle),
    readFile(join(process.cwd(), "src/app/_fonts/nunito-800.ttf")),
    readFile(join(process.cwd(), "src/app/_fonts/logo-og.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const nombre = p?.display_name ?? p?.handle ?? "Vibecoder";
  const sec = sectorDe(p?.mejor_sector ?? null);
  // la tarjeta muestra el proyecto que encabeza; los demás se ven en la página
  const proyectos = p ? await fetchProyectosDe(p.id).catch(() => []) : [];
  const primero = proyectos[0];
  const dominio = dominioDe(primero?.proyecto_url ?? null);

  // Satori: cada bloque con más de un hijo necesita display flex explícito.
  const datos = p?.mejor_valuacion
    ? [
        { k: "Su mejor startup", v: plataCorta(Number(p.mejor_valuacion)) },
        { k: "Usuarios", v: numCorto(Number(p.mejor_usuarios ?? 0)) },
        { k: "Partidas", v: String(p.partidas ?? 0) },
      ]
    : [];

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
          <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.6, display: "flex" }}>{nombre}</div>
          <div style={{ fontSize: 64, color: "#1f1b16", lineHeight: 1.05, marginTop: 4, display: "flex" }}>
            {primero ? `Está construyendo ${primero.proyecto}` : `${nombre} vibecodea startups`}
          </div>
          {primero?.proyecto_desc ? (
            <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.65, marginTop: 10, display: "flex" }}>
              {primero.proyecto_desc}
            </div>
          ) : null}
          {dominio ? (
            <div style={{ fontSize: 28, color: "#5b5bd6", marginTop: 10, display: "flex" }}>{dominio}</div>
          ) : null}

          <div style={{ display: "flex", marginTop: 32 }}>
            {datos.map((d) => (
              <div key={d.k} style={{ display: "flex", flexDirection: "column", background: "#ffffff", border: "5px solid #1f1b16", borderRadius: 22, padding: "14px 24px", marginRight: 16, width: 300 }}>
                <div style={{ fontSize: 20, color: "#1f1b16", opacity: 0.5, display: "flex" }}>{d.k}</div>
                <div style={{ fontSize: 44, color: "#1f1b16", marginTop: 2, display: "flex" }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 30, color: "#1f1b16", opacity: 0.7, display: "flex" }}>
          {p?.mejor_startup ? `${sec?.name ?? "Startup"} · ${p.mejor_startup} · ¿podés hacerlo mejor?` : "Fundá una startup hecha 100% con IA"}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Nunito", data: font, weight: 800, style: "normal" }] },
  );
}
