"use client";
import { useMemo } from "react";

const COLORES = ["#f5b731", "#5b5bd6", "#2e8b57", "#e05252", "#f08a3c", "#8b5cf6"];

/**
 * Explosión de papelitos. Es CSS puro: cada papelito cae con su propia demora,
 * duración y desvío, así que no hace falta ninguna librería ni canvas.
 */
export function Confeti({ piezas = 90 }: { piezas?: number }) {
  const papelitos = useMemo(
    () =>
      Array.from({ length: piezas }, (_, i) => {
        // pseudoaleatorio estable: no cambia entre renders
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          i,
          izq: r(1) * 100,
          dx: `${(r(2) - 0.5) * 40}vw`,
          giro: `${540 + r(3) * 900}deg`,
          dur: `${2.6 + r(4) * 2.2}s`,
          retraso: `${r(5) * 0.9}s`,
          color: COLORES[i % COLORES.length],
          ancho: 6 + r(6) * 6,
          alto: 9 + r(7) * 10,
          redondo: r(8) > 0.75,
        };
      }),
    [piezas],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {papelitos.map((p) => (
        <span
          key={p.i}
          className="papelito"
          style={
            {
              left: `${p.izq}%`,
              width: p.ancho,
              height: p.alto,
              background: p.color,
              borderRadius: p.redondo ? 999 : 2,
              "--dx": p.dx,
              "--giro": p.giro,
              "--dur": p.dur,
              "--retraso": p.retraso,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
