"use client";
import { useState } from "react";
import { colorDe, faviconDe } from "@/lib/perfil";

/**
 * El logo del proyecto. No pedimos que suban uno: el sitio ya tiene favicon, y
 * pedir un archivo más es la diferencia entre que carguen el proyecto y que no.
 * Cuando no hay sitio, o el favicon no carga, queda la inicial en un color
 * estable, que es mejor que un cuadrado gris vacío.
 */
export function IconoProyecto({
  nombre,
  url,
  size = 40,
}: {
  nombre: string;
  url: string | null;
  size?: number;
}) {
  const src = faviconDe(url);
  const [falló, setFalló] = useState(false);
  const radio = Math.round(size * 0.28);

  // Google nunca falla: cuando el sitio no tiene favicon devuelve un globo
  // genérico de 16px con estado 200, así que onError no alcanza. Pedimos 128 y
  // lo que venga más chico es ese globo, que ampliado queda como una mancha.
  const esGloboGenerico = (img: HTMLImageElement) => img.naturalWidth > 0 && img.naturalWidth < 32;

  if (!src || falló) {
    return (
      <div
        aria-hidden
        className="flex shrink-0 items-center justify-center font-black text-white"
        style={{
          width: size,
          height: size,
          borderRadius: radio,
          background: colorDe(nombre),
          fontSize: Math.round(size * 0.45),
        }}
      >
        {nombre.trim().charAt(0).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dominio de terceros, no vale configurar remotePatterns para un favicon
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFalló(true)}
      onLoad={(e) => {
        if (esGloboGenerico(e.currentTarget)) setFalló(true);
      }}
      className="shrink-0 border border-ink/10 bg-white object-contain"
      style={{ width: size, height: size, borderRadius: radio }}
    />
  );
}
