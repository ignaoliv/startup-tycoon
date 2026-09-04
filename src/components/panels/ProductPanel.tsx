"use client";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { FEATURES } from "@/lib/game/data";
import { featureAvailable, hirePM, setFeature, tienePM } from "@/lib/game/engine";
import { PM_SALARY } from "@/lib/game/data";
import { money } from "@/lib/game/format";
import type { Game } from "@/hooks/useGame";

export function ProductPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const cur = s.currentFeature ? FEATURES.find((f) => f.id === s.currentFeature) : null;
  // solo tres opciones a la vez: las más baratas de las que ya podés construir
  const disponibles = FEATURES.filter((f) => featureAvailable(s, f.id)).sort((a, b) => a.cost - b.cost);
  const opciones = disponibles.slice(0, 3);
  const hechas = s.done.length;
  const porDescubrir = FEATURES.length - hechas - opciones.length;

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

      <Card
        title="Qué construir"
        right={
          <Pill tone={tienePM(s) ? "good" : "ink"}>
            {hechas}/{FEATURES.length} lanzadas
          </Pill>
        }
      >
        {opciones.length === 0 ? (
          <p className="text-sm text-ink/60">Ya lanzaste todo lo que había. Tu producto está completo.</p>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-ink/55">
              {tienePM(s)
                ? "Tu Project Manager elige solo cuando termina una. Podés cambiar la decisión acá."
                : "Estas son tus opciones ahora. Lanzá una y se te abren nuevas."}
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {opciones.map((f) => {
                const active = s.currentFeature === f.id;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => game.mutate((st) => setFeature(st, f.id))}
                      className={`h-full w-full rounded-xl border-2 p-2.5 text-left transition ${active ? "border-indigo bg-indigo/10" : "border-ink/20 bg-white hover:border-indigo"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black">
                          {f.icon} {f.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-ink/50">{active ? "🔨" : `${f.cost} pts`}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] leading-snug text-ink/60">{f.desc}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {f.effects.growth && <Pill tone="good">+{Math.round(f.effects.growth * 100)}% crecimiento</Pill>}
                        {f.effects.arpu && <Pill tone="amber">+${f.effects.arpu} ARPU</Pill>}
                        {f.effects.churn && <Pill tone="indigo">-churn</Pill>}
                        {f.effects.quality && <Pill>+{f.effects.quality} calidad</Pill>}
                        {f.effects.hype && <Pill tone="bad">+{f.effects.hype} hype</Pill>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {porDescubrir > 0 && (
              <p className="mt-2 text-center text-[11px] text-ink/45">
                Quedan {porDescubrir} features por descubrir. Se van abriendo con lo que lanzás.
              </p>
            )}
          </>
        )}
      </Card>

      {!tienePM(s) && (
        <Card title="¿Cansado de elegir?">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              <b>📋 Contratar un Project Manager</b>
              <div className="text-ink/60">Elige solo la próxima feature cuando el equipo termina una, así nunca queda parado. Ocupa un lugar del equipo y cobra {money(PM_SALARY)}/mes.</div>
            </div>
            <Btn size="sm" variant="green" onClick={() => game.mutate((st) => hirePM(st))} disabled={s.cash < PM_SALARY}>
              Contratar
            </Btn>
          </div>
        </Card>
      )}

      {hechas > 0 && (
        <Card title="Ya lanzaste">
          <ul className="flex flex-wrap gap-1.5">
            {FEATURES.filter((f) => s.done.includes(f.id)).map((f) => (
              <li key={f.id} className="rounded-lg bg-green/10 px-2 py-1 text-[11px] font-bold">
                {f.icon} {f.name}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
