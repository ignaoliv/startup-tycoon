"use client";
import { OfficeView } from "@/components/OfficeView";
import { Bar, Card, Pill } from "@/components/ui";
import { FEATURES, OFFICES } from "@/lib/game/data";
import { money, num } from "@/lib/game/format";
import type { Game } from "@/hooks/useGame";

export function Dashboard({ game, onGoTo }: { game: Game; onGoTo: (tab: string) => void }) {
  const s = game.state!;
  const d = game.derived!;
  const feat = s.currentFeature ? FEATURES.find((f) => f.id === s.currentFeature) : null;
  // único aviso: la oficina llena frena las contrataciones
  const tips: { text: string; tab: string }[] = [];
  if (s.employees.length >= OFFICES[s.office].capacity && OFFICES[s.office + 1]) tips.push({ text: "La oficina está llena. Mudate para poder contratar.", tab: "money" });

  return (
    <div className="space-y-3">
      <Card className="!p-2">
        <OfficeView state={s} />
      </Card>

      {tips.length > 0 && (
        <div className="space-y-1.5">
          {tips.slice(0, 2).map((t) => (
            <button key={t.text} onClick={() => onGoTo(t.tab)} className="pop flex w-full items-center gap-2 rounded-xl border-2 border-amber bg-amber/20 px-3 py-2 text-left text-sm font-semibold">
              <span>⚠️</span>
              <span className="flex-1">{t.text}</span>
              <span className="text-ink/50">›</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Card title="Producto">
          {feat ? (
            <>
              <div className="mb-1 flex items-center justify-between text-sm font-bold">
                <span>
                  {feat.icon} {feat.name}
                </span>
                <span className="text-xs text-ink/50">{d.featureDaysLeft !== null ? `${d.featureDaysLeft} días` : "sin devs"}</span>
              </div>
              <Bar value={s.featureProgress} max={feat.cost} color="bg-green" />
            </>
          ) : (
            <button onClick={() => onGoTo("product")} className="text-sm font-bold text-indigo underline">
              Elegir feature →
            </button>
          )}
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span>Calidad</span>
              <Pill tone={d.quality > 60 ? "good" : d.quality > 30 ? "amber" : "bad"}>{Math.round(d.quality)}</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span>Deuda técnica</span>
              <Pill tone={s.bugs < 3 ? "good" : s.bugs < 8 ? "amber" : "bad"}>{Math.round(s.bugs)}</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span>Features</span>
              <Pill>
                {s.done.length}/{FEATURES.length}
              </Pill>
            </div>
          </div>
        </Card>
        <Card title="Hoy">
          <div className="space-y-1.5 text-xs">
            <Row l="Usuarios nuevos" v={`+${num(d.newUsersDay)}`} tone="good" />
            <Row l="Churn" v={`-${num(d.churnDay)}`} tone="bad" />
            <Row l="Ingresos" v={money(d.revenueDay, { sign: true })} tone="good" />
            <Row l="Gastos" v={money(-d.costDay)} tone="bad" />
            <Row l="Neto" v={money(d.netDay, { sign: d.netDay >= 0 })} tone={d.netDay >= 0 ? "good" : "bad"} bold />
            <Row l="ARPU" v={`${money(d.arpu)}/mes`} />
          </div>
        </Card>
      </div>

      <Card title="Estado">
        <div className="space-y-2 text-xs">
          <div>
            <div className="mb-1 flex justify-between">
              <span>🔥 Hype</span>
              <span className="font-bold">{Math.round(s.hype)}</span>
            </div>
            <Bar value={s.hype} color="bg-amber" />
          </div>
          <div>
            <div className="mb-1 flex justify-between">
              <span>😊 Moral</span>
              <span className="font-bold">{Math.round(s.morale)}</span>
            </div>
            <Bar value={s.morale} color="bg-green" />
          </div>
        </div>
      </Card>

      <Card title="Novedades">
        <ul className="max-h-64 space-y-1.5 overflow-y-auto text-xs">
          {s.log.map((l, i) => (
            <li key={i} className={`flex gap-2 rounded-lg px-2 py-1 ${l.kind === "good" ? "bg-green/10" : l.kind === "bad" ? "bg-red/10" : l.kind === "social" ? "bg-indigo/10" : "bg-ink/5"}`}>
              <span className="shrink-0 font-mono text-[10px] text-ink/40">d{l.day}</span>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Row({ l, v, tone, bold }: { l: string; v: string; tone?: "good" | "bad"; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-black" : ""}`}>
      <span>{l}</span>
      <span className={`tabular-nums ${tone === "good" ? "text-green" : tone === "bad" ? "text-red" : ""}`}>{v}</span>
    </div>
  );
}
