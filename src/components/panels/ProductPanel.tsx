"use client";
import { Bar, Card, Pill } from "@/components/ui";
import { FEATURES } from "@/lib/game/data";
import { featureAvailable, setFeature } from "@/lib/game/engine";
import type { Game } from "@/hooks/useGame";

export function ProductPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const cur = s.currentFeature ? FEATURES.find((f) => f.id === s.currentFeature) : null;

  // el roadmap es largo y se va abriendo solo: mostramos lo lanzado, lo que se
  // puede elegir ahora y apenas un par de las que vienen, no las 50
  const lanzadas = FEATURES.filter((f) => s.done.includes(f.id));
  const disponibles = FEATURES.filter((f) => featureAvailable(s, f.id));
  const proximas = FEATURES.filter((f) => !s.done.includes(f.id) && !featureAvailable(s, f.id)).slice(0, 3);
  const visibles = [...lanzadas, ...disponibles, ...proximas];
  const restantes = FEATURES.length - visibles.length;

  return (
    <div className="space-y-3">
      <Card title="En desarrollo">
        {cur ? (
          <>
            <div className="mb-1 flex items-center justify-between">
              <div className="text-base font-black">
                {cur.icon} {cur.name}
              </div>
              <Pill tone="indigo">{d.featureDaysLeft !== null ? `${d.featureDaysLeft} días` : "necesitás devs"}</Pill>
            </div>
            <p className="mb-2 text-xs text-ink/60">{cur.desc}</p>
            <Bar value={s.featureProgress} max={cur.cost} color="bg-green" />
            <div className="mt-1 text-[11px] text-ink/50">
              {Math.floor(s.featureProgress)}/{cur.cost} puntos · {d.devPts.toFixed(1)} pts/día
            </div>
          </>
        ) : (
          <p className="text-sm text-ink/60">Nada. Elegí algo abajo.</p>
        )}
      </Card>

      <Card title="Roadmap">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visibles.map((f) => {
            const done = s.done.includes(f.id);
            const active = s.currentFeature === f.id;
            const avail = featureAvailable(s, f.id);
            const locked = !done && !avail;
            return (
              <li key={f.id}>
                <button
                  disabled={done || locked}
                  onClick={() => game.mutate((st) => setFeature(st, f.id))}
                  className={`w-full rounded-xl border-2 p-2.5 text-left transition ${done ? "border-green/40 bg-green/10" : active ? "border-indigo bg-indigo/10" : locked ? "border-ink/10 bg-ink/5 opacity-50" : "border-ink/20 bg-white hover:border-indigo"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black">
                      {f.icon} {f.name}
                    </span>
                    <span className="text-[10px] font-bold text-ink/50">{done ? "✅" : active ? "🔨" : locked ? "🔒" : `${f.cost} pts`}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink/60">{f.desc}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.effects.growth && <Pill tone="good">+{Math.round(f.effects.growth * 100)}% crecimiento</Pill>}
                    {f.effects.arpu && <Pill tone="amber">+${f.effects.arpu} ARPU</Pill>}
                    {f.effects.churn && <Pill tone="indigo">-churn</Pill>}
                    {f.effects.quality && <Pill>+{f.effects.quality} calidad</Pill>}
                    {f.effects.hype && <Pill tone="bad">+{f.effects.hype} hype</Pill>}
                  </div>
                  {locked && f.requires && <div className="mt-1 text-[10px] text-ink/40">Requiere: {f.requires.map((r) => FEATURES.find((x) => x.id === r)?.name).join(", ")}</div>}
                </button>
              </li>
            );
          })}
        </ul>
        {restantes > 0 && (
          <p className="mt-2 text-center text-[11px] text-ink/50">
            Quedan {restantes} por descubrir. Se abren con lo que vas lanzando.
          </p>
        )}
      </Card>
    </div>
  );
}
