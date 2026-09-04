"use client";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { ACHIEVEMENT_DEFS, ipo, marketingPush, raiseRound, upgradeOffice } from "@/lib/game/engine";
import { IPO_VALUATION, OFFICES, STAGES } from "@/lib/game/data";
import { money, num } from "@/lib/game/format";
import type { Game } from "@/hooks/useGame";

export function MoneyPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const stage = STAGES[s.stage];
  const next = STAGES[s.stage + 1];
  const canRaise = next && next.raise > 0 && d.valuation >= next.minValuation;
  const nextOffice = OFFICES[s.office + 1];
  const runway = d.netDay < 0 ? Math.floor(s.cash / -d.netDay) : null;
  const mktCost = Math.round(2000 + s.users * 0.5);

  return (
    <div className="space-y-3">
      <Card title="Caja">
        <div className="mb-2 flex items-end justify-between">
          <div className={`text-2xl font-black tabular-nums ${s.cash < 0 ? "text-red" : ""}`}>{money(s.cash)}</div>
          {runway !== null && <Pill tone={runway < 30 ? "bad" : "amber"}>{runway} días de runway</Pill>}
        </div>
        <ul className="space-y-1 text-xs">
          <Li l="Ingresos (MRR)" v={money(d.mrr, { sign: true }) + "/mes"} tone="good" />
          <Li l="Sueldos" v={money(-d.salariesMonth) + "/mes"} tone="bad" />
          <Li l="Alquiler" v={money(-d.rentMonth) + "/mes"} tone="bad" />
          <Li l="Servidores" v={money(-d.serverMonth) + "/mes"} tone="bad" />
          <Li l="Neto" v={money(d.netDay * 30, { sign: d.netDay >= 0 }) + "/mes"} tone={d.netDay >= 0 ? "good" : "bad"} bold />
        </ul>
        <div className="mt-3 flex gap-2">
          <Btn variant="amber" size="sm" className="flex-1" disabled={s.cash < mktCost} onClick={() => game.mutate((st) => marketingPush(st))}>
            📣 Campaña +15 hype · {money(mktCost)}
          </Btn>
        </div>
      </Card>

      <Card title="Inversores">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-ink/50">Valuación</div>
            <div className="text-xl font-black tabular-nums">{money(d.valuation)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-ink/50">Tu equity</div>
            <div className="text-xl font-black tabular-nums">{s.equity}%</div>
          </div>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span>
            Etapa: <b>{stage.name}</b>
          </span>
          {next && next.raise > 0 && <span className="text-ink/50">Próxima: {next.name}</span>}
        </div>
        {next && next.raise > 0 && (
          <>
            <Bar value={d.valuation} max={next.minValuation} color="bg-indigo" />
            <div className="mt-1 text-[11px] text-ink/50">
              Necesitás valer {money(next.minValuation)} para levantar {money(next.raise)} cediendo {next.equity}%.
            </div>
            <Btn className="mt-2 w-full" disabled={!canRaise} onClick={() => game.mutate((st) => raiseRound(st))}>
              💸 Levantar ronda {next.name} · {money(next.raise)}
            </Btn>
          </>
        )}
        {s.stage >= STAGES.length - 2 && (
          <>
            <Bar value={d.valuation} max={IPO_VALUATION} color="bg-amber" className="mt-2" />
            <Btn className="mt-2 w-full" variant="amber" disabled={d.valuation < IPO_VALUATION} onClick={() => game.mutate((st) => ipo(st))}>
              🔔 Salir a bolsa (IPO)
            </Btn>
          </>
        )}
        {s.boardGoal && (
          <div className={`mt-2 rounded-lg border-2 px-2 py-1.5 text-[11px] ${s.boardFails > 0 ? "border-red bg-red/10" : "border-ink/15 bg-sand/60"}`}>
            <b>🪑 Meta del board:</b> llegar a {Math.round(s.boardGoal.users).toLocaleString("es-AR")} usuarios para el día {s.boardGoal.dueDay} (faltan {Math.max(0, s.boardGoal.dueDay - s.day)} días).
            {s.boardFails > 0 && <span className="font-bold text-red"> Ya fallaste una: si volvés a fallar, te reemplazan.</span>}
          </div>
        )}
        <div className="mt-2 text-[11px] text-ink/50">
          Levantado hasta ahora: <b>{money(s.stats.raised)}</b>. Tu parte vale <b>{money((d.valuation * s.equity) / 100)}</b>.
        </div>
      </Card>

      <Card title="Oficina">
        <div className="mb-2 text-sm">
          {OFFICES[s.office].icon} <b>{OFFICES[s.office].name}</b> · {s.employees.length}/{OFFICES[s.office].capacity} lugares · {money(OFFICES[s.office].rent)}/mes
        </div>
        {nextOffice ? (
          <>
            <div className="mb-2 text-xs text-ink/60">
              Siguiente: {nextOffice.icon} <b>{nextOffice.name}</b>, {nextOffice.capacity} lugares, {money(nextOffice.rent)}/mes de alquiler. Sube la moral.
            </div>
            <Btn className="w-full" variant="green" disabled={s.cash < nextOffice.cost} onClick={() => game.mutate((st) => upgradeOffice(st))}>
              🚚 Mudarse · {money(nextOffice.cost)}
            </Btn>
          </>
        ) : (
          <div className="text-xs text-ink/60">Ya tenés la torre más alta de la ciudad.</div>
        )}
      </Card>

      {s.portfolio.length > 0 && (
        <Card title="Tu portfolio">
          <ul className="space-y-1 text-xs">
            {s.portfolio.map((p) => (
              <li key={p.targetId} className="flex justify-between rounded-lg bg-indigo/10 px-2 py-1">
                <span>
                  🤝 <b>{p.targetName}</b> · {(p.stake * 100).toFixed(1)}%
                </span>
                <span className="tabular-nums text-green">+{money(((p.lastMrr / 30) * p.stake * 0.5) * 30)}/mes</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Logros">
        <ul className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-3">
          {ACHIEVEMENT_DEFS.map((a) => {
            const got = s.achievements.includes(a.id);
            return (
              <li key={a.id} className={`rounded-lg px-2 py-1.5 ${got ? "bg-amber/25 font-bold" : "bg-ink/5 text-ink/40"}`}>
                {got ? a.icon : "🔒"} {a.name}
              </li>
            );
          })}
        </ul>
        <div className="mt-2 text-[11px] text-ink/50">
          Pico de usuarios: {num(s.stats.peakUsers)} · Ingresos totales: {money(s.stats.totalRevenue)} · Contrataciones: {s.stats.hires}
        </div>
      </Card>
    </div>
  );
}

function Li({ l, v, tone, bold }: { l: string; v: string; tone?: "good" | "bad"; bold?: boolean }) {
  return (
    <li className={`flex justify-between ${bold ? "border-t border-ink/10 pt-1 font-black" : ""}`}>
      <span>{l}</span>
      <span className={`tabular-nums ${tone === "good" ? "text-green" : tone === "bad" ? "text-red" : ""}`}>{v}</span>
    </li>
  );
}
