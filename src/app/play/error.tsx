"use client";
import { LOCAL_KEY } from "@/lib/storage";

export default function PlayError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const wipe = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(LOCAL_KEY))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.href = "/play?local=1";
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6 text-center">
      <div className="text-5xl">💥</div>
      <h1 className="text-xl font-black">Se rompió algo</h1>
      <p className="text-sm text-ink/60">La app tuvo un error al cargar la partida. Probá de nuevo o empezá una partida limpia.</p>
      <p className="rounded-lg bg-ink/5 p-2 text-left font-mono text-[11px] text-ink/60">{error.message}</p>
      <button onClick={reset} className="btn bg-indigo border-ink px-4 py-2 text-sm text-white">
        Reintentar
      </button>
      <button onClick={wipe} className="btn bg-white border-ink/30 px-4 py-2 text-sm">
        Borrar la partida y empezar de nuevo
      </button>
    </div>
  );
}
