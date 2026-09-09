"use client";
import { useEffect, useState } from "react";
import { Btn } from "@/components/ui";
import { OfficeView } from "@/components/OfficeView";
import { escenaDe } from "@/lib/game/escenas";
import type { GameState } from "@/lib/game/types";

/**
 * El corte entre actos. La oficina nueva aparece vacía y se va llenando; el
 * texto no explica ninguna regla, solo pone el clima. En la primera la cámara
 * se acerca y la gente entra de a una; en la segunda se aleja y entran en
 * oleada, porque ahí el punto es que ya son demasiados.
 */
export function EscenaMudanza({ state, onClose }: { state: GameState; onClose: () => void }) {
  const escena = escenaDe(state.office);
  const [fase, setFase] = useState(0);
  const primera = escena?.oficina === 2;

  useEffect(() => {
    const tiempos = [300, 2200, 2800, 3400];
    const ids = tiempos.map((ms, i) => setTimeout(() => setFase(i + 1), ms));
    return () => ids.forEach(clearTimeout);
  }, []);

  if (!escena) return null;

  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-y-auto bg-ink p-4"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border-4 border-ink/60 shadow-2xl transition-transform duration-[2500ms] ease-out"
        style={{ transform: fase === 0 ? (primera ? "scale(0.94)" : "scale(1.18)") : "scale(1)" }}
      >
        <OfficeView state={state} llegando={fase >= 1} ritmo={primera ? 150 : 40} />
      </div>

      <div className="mt-6 max-w-md text-center">
        <h2
          className={`text-2xl font-black text-cream transition-all duration-500 sm:text-3xl ${fase >= 2 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
        >
          {escena.titulo}
        </h2>
        {escena.cuerpo && (
          <p
            className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-cream/70 transition-all duration-500 ${fase >= 3 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
          >
            {escena.cuerpo(state.day)}
          </p>
        )}
      </div>

      <Btn variant="amber" className={`mt-6 transition-opacity duration-300 ${fase >= 3 ? "opacity-100" : "opacity-0"}`} onClick={onClose}>
        Seguir
      </Btn>
      <p className="mt-3 text-[11px] text-cream/40">tocá en cualquier lado para seguir</p>
    </div>
  );
}
