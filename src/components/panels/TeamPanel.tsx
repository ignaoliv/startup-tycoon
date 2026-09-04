"use client";
import { useState } from "react";
import { Btn, Card, Pill } from "@/components/ui";
import { AI_LEVEL_NAMES, LEVEL_NAMES, OFFICES, ROLES } from "@/lib/game/data";
import { fire, hire, rerollCandidates, teamPerk } from "@/lib/game/engine";
import { money } from "@/lib/game/format";
import type { Role } from "@/lib/game/types";
import type { Game } from "@/hooks/useGame";

export function TeamPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const [confirmFire, setConfirmFire] = useState<string | null>(null);
  const office = OFFICES[s.office];
  const full = s.employees.length >= office.capacity;
  const rerollCost = 500 + s.employees.length * 100;
  // días de caja: lo que decide la mayoría de las partidas
  const runway = d.netDay < 0 ? Math.floor(s.cash / -d.netDay) : null;
  const runwayCon = (salario: number) => {
    const netoDespues = d.netDay - salario / 30;
    return netoDespues < 0 ? Math.floor(s.cash / -netoDespues) : null;
  };
  const counts = (Object.keys(ROLES) as Role[]).map((r) => ({ r, n: s.employees.filter((e) => e.role === r).length }));

  return (
    <div className="space-y-3">
      <Card
        title={`Candidatos`}
        right={
          <Btn size="sm" variant="ghost" onClick={() => game.mutate((st) => rerollCandidates(st))} disabled={s.cash < rerollCost}>
            🔄 Buscar más · {money(rerollCost)}
          </Btn>
        }
      >
        {full && <div className="mb-2 rounded-lg bg-red/10 px-2 py-1.5 text-xs font-bold text-red">Oficina llena ({office.capacity}). Mudate en la pestaña Plata.</div>}
        <div className={`mb-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${runway === null ? "bg-green/10" : runway < 45 ? "bg-red/10 text-red" : runway < 90 ? "bg-amber/20" : "bg-ink/5"}`}>
          <span>💵 Días de caja</span>
          <b className="tabular-nums">{runway === null ? "ganás plata" : `${runway} días`}</b>
        </div>
        <ul className="space-y-2">
          {s.candidates.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl border-2 border-ink/10 p-2">
              <span className="text-2xl">{c.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{c.name}</div>
                <div className="text-[11px] text-ink/60">
                  {ROLES[c.role].icon} {ROLES[c.role].name} · <b>{(c.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[c.level]}</b> · {money(c.salary)} {ROLES[c.role].payLabel}
                </div>
                {(() => {
                  const r = runwayCon(c.salary);
                  if (r === null) return <div className="text-[11px] font-semibold text-green">te sigue quedando plata todos los meses</div>;
                  return <div className={`text-[11px] font-semibold ${r < 45 ? "text-red" : r < 90 ? "text-ink/60" : "text-ink/50"}`}>te deja en {r} días de caja</div>;
                })()}
              </div>
              <Btn size="sm" variant="green" disabled={full || s.cash < c.fee} onClick={() => game.mutate((st) => hire(st, c.id))}>
                {c.role === "ai" ? "Activar" : "Contratar"} {money(c.fee)}
              </Btn>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-ink/50">🤖 Los agentes IA vibecodean 60% más rápido y cuestan un cuarto, pero dejan deuda técnica. Los devs humanos la contienen. El fee es medio sueldo; los candidatos se renuevan cada 7 días.</p>
      </Card>

      <Card
        title={`Equipo ${s.employees.length}/${office.capacity}`}
        right={
          <Btn size="sm" variant="amber" onClick={() => game.mutate((st) => teamPerk(st))} disabled={s.cash < 300 * s.employees.length}>
            🥩 Asado · {money(300 * s.employees.length)}
          </Btn>
        }
      >
        <div className="mb-2 flex flex-wrap gap-1">
          {counts.filter((c) => c.n > 0).map((c) => (
            <Pill key={c.r}>
              {ROLES[c.r].icon} {c.n} {ROLES[c.r].plural}
            </Pill>
          ))}
        </div>
        <div className="mb-2 text-xs text-ink/60">
          Sueldos: <b>{money(d.salariesMonth)}/mes</b> · Moral <b>{Math.round(s.morale)}</b> (multiplica la productividad)
        </div>
        <ul className="space-y-1.5">
          {s.employees.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded-xl bg-sand/60 px-2 py-1.5">
              <span className="text-xl">{e.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {e.name} {e.founder && "👑"}
                </div>
                <div className="text-[11px] text-ink/60">
                  {ROLES[e.role].icon} {e.founder ? "Vibecoder fundador" : `${ROLES[e.role].name} ${(e.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[e.level]}`} · {e.founder ? "sin sueldo" : `${money(e.salary)} ${ROLES[e.role].payLabel}`}
                </div>
              </div>
              {!e.founder &&
                (confirmFire === e.id ? (
                  <div className="flex gap-1">
                    <Btn size="sm" variant="danger" onClick={() => { game.mutate((st) => fire(st, e.id)); setConfirmFire(null); }}>
                      Sí
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => setConfirmFire(null)}>
                      No
                    </Btn>
                  </div>
                ) : (
                  <Btn size="sm" variant="ghost" onClick={() => setConfirmFire(e.id)}>
                    {e.role === "ai" ? "Cancelar" : "Echar"}
                  </Btn>
                ))}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Roles">
        <ul className="grid grid-cols-2 gap-1.5 text-[11px]">
          {(Object.keys(ROLES) as Role[]).map((r) => (
            <li key={r} className="rounded-lg bg-ink/5 px-2 py-1.5">
              <b>
                {ROLES[r].icon} {ROLES[r].name}
              </b>
              <div className="text-ink/60">{ROLES[r].desc}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
