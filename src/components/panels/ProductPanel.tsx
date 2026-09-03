"use client";
import { Bar, Card, Pill } from "@/components/ui";
import { FEATURES, NEW_FEATURE_ID, REBRAND_ID } from "@/lib/game/data";
import { featureAvailable, getFeature, setFeature } from "@/lib/game/engine";
import type { Game } from "@/hooks/useGame";

export function ProductPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const cur = s.currentFeature ? getFeature(s, s.currentFeature) : null;
  const repeatables = [NEW_FEATURE_ID, REBRAND_ID].map((id) => getFeature(s, id));

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
          <div className="rounded-xl border-2 border-dashed border-amber bg-amber/10 p-3 text-sm">
            <b>El equipo está esperando.</b> Elegí algo abajo. Cuando termina una feature, el equipo sigue solo con la siguiente más barata (o con features nuevas si ya no queda nada).
          </div>
        )}
      </Card>

      <Card title="Siempre disponibles">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {repeatables.map((f) => {
            const active = s.currentFeature === f.id;
            const avail = featureAvailable(s, f.id);
            return (
              <li key={f.id}>
                <button disabled={!avail} onClick={() => game.mutate((st) => setFeature(st, f.id))} className={`w-full rounded-xl border-2 p-2.5 text-left transition ${active ? "border-indigo bg-indigo/10" : !avail ? "border-ink/10 bg-ink/5 opacity-50" : "border-amber bg-amber/10 hover:border-indigo"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black">
                      {f.icon} {f.name}
                    </span>
                    <span className="text-[10px] font-bold text-ink/50">{active ? "🔨" : !avail ? "🔒" : `${f.cost} pts`}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink/60">{f.desc}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.id === NEW_FEATURE_ID && (
                      <>
                        <Pill tone="good">+8% crecimiento</Pill>
                        <Pill tone="amber">+$0.15 ARPU</Pill>
                        <Pill>+1 calidad</Pill>
                        <Pill tone="bad">+8 hype</Pill>
                        <Pill tone="indigo">♾️ infinito · {s.customFeatures} hechas</Pill>
                      </>
                    )}
                    {f.id === REBRAND_ID && (
                      <>
                        <Pill tone="bad">+35 hype</Pill>
                        <Pill>+5 calidad</Pill>
                        <Pill tone="indigo">nombre nuevo</Pill>
                        <Pill>-3% usuarios</Pill>
                      </>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Roadmap">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => {
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
      </Card>
    </div>
  );
}
