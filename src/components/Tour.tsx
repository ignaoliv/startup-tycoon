"use client";
import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/ui";

export const TOUR_KEY = "startup-tycoon:tour-done";

export interface TourStep {
  target?: string; // valor de data-tour
  tab?: string; // pestaña que se abre antes del paso
  icon: string;
  title: string;
  text: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    icon: "🚀",
    title: "Sos el fundador",
    text: "Arrancás en un garage con $30.000, una laptop y un agente de IA. Tu startup se construye sin escribir código: los agentes vibecodean por vos.",
  },
  {
    icon: "🦄",
    title: "El objetivo",
    text: "Conseguir usuarios, facturar y levantar rondas hasta valer $1.000 millones. Si te quedás sin plata 12 días seguidos, cerrás.",
  },
  {
    target: "speed",
    icon: "⏯️",
    title: "El tiempo corre",
    text: "Cada 4 segundos pasa un día. Pausá para pensar tranquilo, acelerá cuando todo fluye. Aunque cierres la app, el tiempo sigue.",
  },
  {
    target: "stats",
    icon: "📊",
    title: "Tus números",
    text: "Caja, usuarios, facturación mensual, valuación, hype y moral. Si la caja se pone roja, es hora de recortar o levantar una ronda.",
  },
  {
    target: "tab-product",
    tab: "product",
    icon: "🛠️",
    title: "Producto",
    text: "Elegí qué construir. Empezá por el MVP: sin producto no entra un solo usuario. Cada feature cambia cómo crecés.",
  },
  {
    target: "tab-team",
    tab: "team",
    icon: "🧑‍🤝‍🧑",
    title: "Equipo",
    text: "Los agentes IA son rápidos y baratos pero dejan bugs. Los humanos los limpian. Cuidá la moral: multiplica todo lo que produce el equipo.",
  },
  {
    target: "tab-money",
    tab: "money",
    icon: "💸",
    title: "Plata",
    text: "Levantá rondas cuando la valuación llegue al mínimo (cedés equity), mudate a oficinas más grandes y tocá la campana en la IPO.",
  },
  {
    target: "tab-social",
    tab: "social",
    icon: "🌍",
    title: "Social",
    text: "Con cuenta de Google entrás al ranking global, el muro de fundadores y podés meterte en la startup de otro para darle hype, invertirle o robarle talento.",
  },
  {
    target: "tab-office",
    tab: "office",
    icon: "💡",
    title: "Si te perdés, mirá acá",
    text: "En la Oficina aparecen consejos amarillos que te dicen qué conviene hacer ahora. Con eso alcanza para arrancar. ¡Suerte!",
  },
];

export function isTourDone() {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return true;
  }
}
export function setTourDone(done: boolean) {
  try {
    if (done) localStorage.setItem(TOUR_KEY, "1");
    else localStorage.removeItem(TOUR_KEY);
  } catch {}
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Tour({ onClose, setTab }: { onClose: () => void; setTab: (t: string) => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [dontShow, setDontShow] = useState(true);
  const [vh, setVh] = useState(800);
  const step = TOUR_STEPS[i];
  const last = i === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (step.tab) setTab(step.tab);
  }, [step, setTab]);

  // medimos el objetivo continuamente: sobrevive a cambios de pestaña, scroll y resize
  const targetRef = useRef<string | undefined>(step.target);
  useEffect(() => {
    targetRef.current = step.target;
  }, [step]);

  useEffect(() => {
    const measure = () => {
      setVh(window.innerHeight);
      const target = targetRef.current;
      if (!target) return setBox(null);
      const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)).find((n) => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!el) return setBox(null);
      const r = el.getBoundingClientRect();
      setBox((prev) => {
        const next = { top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 };
        if (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height) return prev;
        return next;
      });
    };
    const id = setInterval(measure, 120);
    measure();
    return () => clearInterval(id);
  }, []);

  const finish = () => {
    setTourDone(dontShow);
    onClose();
  };

  // la tarjeta se ubica del lado con más espacio libre (alto estimado de la tarjeta)
  const CARD_H = 260;
  let top = Math.max(16, vh / 2 - CARD_H / 2);
  if (box) {
    const below = vh - (box.top + box.height);
    if (below > CARD_H + 24) top = box.top + box.height + 16;
    else if (box.top > CARD_H + 24) top = Math.max(16, box.top - CARD_H - 16);
    else top = Math.max(16, vh - CARD_H - 16);
  }
  const cardStyle: React.CSSProperties = { top, left: "50%", transform: "translateX(-50%)" };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Tutorial" aria-modal>
      {box ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-amber transition-all duration-300 ease-out"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height, boxShadow: "0 0 0 9999px rgba(31,27,22,0.72)" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "rgba(31,27,22,0.72)" }} />
      )}

      <div className="pop absolute w-[calc(100%-24px)] max-w-sm rounded-2xl border-2 border-ink/15 bg-white p-4 shadow-2xl" style={cardStyle}>
        <div className="mb-1 flex items-start justify-between">
          <div className="text-3xl">{step.icon}</div>
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-indigo" : "w-1.5 bg-ink/20"}`} />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-black leading-tight">{step.title}</h3>
        <p className="mt-1 text-sm leading-snug text-ink/70">{step.text}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-ink/60">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="h-3.5 w-3.5 accent-indigo" />
            No mostrar más
          </label>
          <div className="flex gap-1.5">
            {!last && (
              <Btn size="sm" variant="ghost" onClick={finish}>
                Saltar
              </Btn>
            )}
            {i > 0 && (
              <Btn size="sm" variant="ghost" onClick={() => setI(i - 1)} aria-label="Anterior">
                ‹
              </Btn>
            )}
            <Btn size="sm" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "¡A jugar!" : "Siguiente ›"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
