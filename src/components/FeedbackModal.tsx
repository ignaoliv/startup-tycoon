"use client";
import { useState } from "react";
import { Btn } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";

const ESPERA_MS = 5 * 60 * 1000;
const CLAVE = "vcg_feedback_at";
const NOTAS = ["", "Un plomo", "Ahí nomás", "Está bueno", "Muy bueno", "No lo puedo soltar"];

/** Devuelve cuánto falta para poder mandar otro, en minutos. 0 = puede mandar. */
function esperaRestante() {
  try {
    const last = Number(localStorage.getItem(CLAVE) ?? 0);
    const falta = last + ESPERA_MS - Date.now();
    return falta > 0 ? Math.ceil(falta / 60000) : 0;
  } catch {
    return 0;
  }
}

export default function FeedbackModal({ contexto, onClose }: { contexto: Record<string, unknown>; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puede = rating > 0 || texto.trim().length >= 3;

  async function enviar() {
    const falta = esperaRestante();
    if (falta > 0) {
      setError(`Ya mandaste uno recién. Probá de nuevo en ${falta} min.`);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setError("No se pudo conectar. Escribime por X y lo arreglamos igual.");
      return;
    }
    setEnviando(true);
    setError(null);
    const { data: { user } } = await sb.auth.getUser();
    const { error: err } = await sb.from("feedback").insert({
      user_id: user?.id ?? null,
      rating: rating || null,
      texto: texto.trim() || null,
      contexto,
    });
    setEnviando(false);
    if (err) {
      setError("No salió. Fijate la conexión y probá de nuevo.");
      return;
    }
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {}
    setListo(true);
    setTimeout(onClose, 1600);
  }

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-3 sm:items-center">
      <div className="pop card w-full max-w-md">
        {listo ? (
          <div className="py-4 text-center">
            <div className="mb-2 text-5xl">🙌</div>
            <h2 className="text-xl font-black">¡Gracias!</h2>
            <p className="text-sm text-ink/70">Lo leo yo, en serio.</p>
          </div>
        ) : (
          <>
            <div className="mb-1 text-3xl">💬</div>
            <h2 className="mb-1 text-xl font-black">¿Cómo la venís pasando?</h2>
            <p className="mb-3 text-sm text-ink/70">Dos segundos. Me sirve muchísimo para mejorarlo.</p>

            <div className="mb-1 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n === rating ? 0 : n)}
                  aria-label={`${n} de 5`}
                  aria-pressed={n <= rating}
                  className={`rounded-xl px-1.5 py-1 text-3xl transition ${n <= rating ? "scale-110" : "opacity-30 grayscale hover:opacity-60"}`}
                >
                  🤖
                </button>
              ))}
            </div>
            <div className="mb-3 h-4 text-center text-xs font-bold text-ink/60">{NOTAS[rating]}</div>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="¿Qué te enganchó? ¿Qué te aburrió? ¿Qué le falta?"
              className="mb-3 w-full resize-none rounded-xl border-2 border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-indigo"
            />

            {error && <p className="mb-2 text-xs font-bold text-red">{error}</p>}

            <div className="flex gap-2">
              <Btn className="flex-1" disabled={!puede || enviando} onClick={enviar}>
                {enviando ? "Mandando…" : "Enviar"}
              </Btn>
              <Btn variant="ghost" onClick={onClose}>
                Ahora no
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
