import { Suspense } from "react";
import { LoginButtons } from "@/components/LoginButtons";

const FEATURES = [
  { icon: "🤖", t: "Vibecodeá con agentes IA", d: "Rápidos y baratos, pero dejan deuda técnica. Sumá humanos para contenerla." },
  { icon: "🛠️", t: "Shippeá features", d: "Del MVP de un finde al marketplace de agentes. Sobreviví a la IA borrando prod." },
  { icon: "💸", t: "Levantá rondas", d: "Pre-seed, Seed, Serie A, B, C… hasta ser unicornio y tocar la campana." },
  { icon: "🌍", t: "Competí con amigos", d: "Ranking global, muro de fundadores, invertí en otros o robales talento." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-5">
      <div className="text-center">
        <div className="mb-2 text-6xl">🚀</div>
        <h1 className="text-4xl font-black tracking-tight">Startup Tycoon</h1>
        <p className="mt-2 text-sm text-ink/60">Fundá una startup hecha 100% con IA. Sin escribir código. Levantá rondas, sobreviví a los eventos y llegá a unicornio antes que tus amigos.</p>
      </div>
      <div className="card">
        <Suspense>
          <LoginButtons />
        </Suspense>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {FEATURES.map((f) => (
          <li key={f.t} className="rounded-xl border-2 border-ink/10 bg-white/70 p-3">
            <div className="text-2xl">{f.icon}</div>
            <div className="text-sm font-black">{f.t}</div>
            <div className="text-[11px] text-ink/60">{f.d}</div>
          </li>
        ))}
      </ul>
      <p className="text-center text-[11px] text-ink/40">Funciona en el celu y en la compu. Agregalo a la pantalla de inicio.</p>
    </main>
  );
}
