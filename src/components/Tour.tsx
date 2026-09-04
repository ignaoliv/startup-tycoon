"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { Btn } from "@/components/ui";

export const TOUR_KEY = "startup-tycoon:tour-done";

export interface TourStep {
  target?: string; // selector [data-tour=...]
  tab?: string; // pestaña que hay que abrir antes
  title: string;
  text: string;
  icon: string;
}

export const TOUR_STEPS: TourStep[] = [
  { icon: "🚀", title: "Tu startup vibecodeada", text: "Tenés $30.000, un garage y un agente IA. El objetivo: llegar a unicornio (valer $1.000 millones) sin quedarte sin plata. Te muestro los botones que importan." },
  { icon: "⏯️", target: "speed", title: "El tiempo", text: "Cada 5 segundos pasa un día. Pausá cuando quieras pensar, acelerá cuando todo va bien. Si cerrás la app, el tiempo sigue un rato." },
  { icon: "📊", target: "stats", title: "Los números", text: "Caja (y cuánto ganás o perdés por mes), usuarios, ingresos mensuales, valuación, hype y moral. Si la caja se pone roja, tenés 12 días para arreglarlo." },
  { icon: "🛠️", target: "tab-product", tab: "product", title: "Producto", text: "Acá está el roadmap. Los devs y agentes construyen la feature elegida; al terminarla siguen solos con la próxima. Empezá por el MVP: sin producto no entra nadie." },
  { icon: "🧑‍🤝‍🧑", target: "tab-team", tab: "team", title: "Equipo", text: "Activá agentes IA (rápidos y baratos, pero dejan deuda técnica) y contratá humanos para contenerla. Cuidá la moral con pizza o asado. La oficina limita cuánta gente entra." },
  { icon: "🔥", target: "tab-hype", tab: "hype", title: "Hype", text: "El hype trae usuarios y se enfría solo. Cuando tengas MVP, acá vas a tener campañas, redes y ads para mantenerlo arriba." },
  { icon: "💸", target: "tab-money", tab: "money", title: "Plata", text: "Levantá rondas cuando la valuación llegue al mínimo (cedés equity), mudate a oficinas más grandes y, si querés, vendé la empresa." },
  { icon: "📬", target: "tab-office", tab: "office", title: "Decisiones", text: "Cada tanto pasa algo: un tweet viral, la IA que borra la base, un inversor. Te aparece un popup con opciones y una cuenta regresiva. Si no decidís, pasa lo pasivo. El juego no se frena." },
  { icon: "💡", title: "Los consejos", text: "En la Oficina aparecen tips amarillos que te dicen qué conviene hacer ahora, y el panel 'Por qué crecés así' explica qué te frena. Con eso alcanza. ¡Suerte!" },
];

export function isTourDone() {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return true;
  }
}
export function setTourDone(v: boolean) {
  try {
    if (v) localStorage.setItem(TOUR_KEY, "1");
    else localStorage.removeItem(TOUR_KEY);
  } catch {}
}

export function Tour({ onClose, setTab }: { onClose: () => void; setTab: (t: string) => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [dontShow, setDontShow] = useState(true);
  const step = TOUR_STEPS[i];

  useEffect(() => {
    if (step.tab) setTab(step.tab);
  }, [step, setTab]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!step.target) return setRect(null);
      const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`)).find((x) => x.offsetParent !== null);
      if (!el) return setRect(null);
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      setRect(el.getBoundingClientRect());
    };
    const t = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  const finish = () => {
    setTourDone(dontShow);
    onClose();
  };
  const last = i === TOUR_STEPS.length - 1;
  const pad = 6;
  // tooltip abajo del target si hay lugar, si no arriba
  const below = rect ? rect.bottom + 12 : null;
  const placeBelow = rect ? rect.bottom + 220 < window.innerHeight : true;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Tutorial">
      {rect ? (
        <div className="absolute rounded-xl ring-4 ring-amber transition-all duration-200" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(31,27,22,0.6)" }} />
      ) : (
        <div className="absolute inset-0 bg-ink/60" />
      )}
      <div
        className="pop absolute left-1/2 w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-2xl border-2 border-ink/15 bg-white p-4 shadow-xl"
        style={rect ? (placeBelow ? { top: below! } : { bottom: window.innerHeight - rect.top + 12 }) : { top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="text-3xl">{step.icon}</div>
          <div className="text-[11px] font-bold text-ink/40">
            {i + 1} / {TOUR_STEPS.length}
          </div>
        </div>
        <h3 className="text-lg font-black">{step.title}</h3>
        <p className="mt-1 text-sm text-ink/70">{step.text}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/60">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            No mostrar más
          </label>
          <div className="flex gap-1.5">
            {!last && (
              <Btn size="sm" variant="ghost" onClick={finish}>
                Saltar
              </Btn>
            )}
            {i > 0 && (
              <Btn size="sm" variant="ghost" onClick={() => setI(i - 1)}>
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
