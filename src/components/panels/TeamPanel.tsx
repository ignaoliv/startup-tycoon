"use client";
import { useState } from "react";
import { Btn, Card, Pill } from "@/components/ui";
import { AI_LEVEL_NAMES, EXECS, LEVEL_NAMES, OFFICES, ROLES } from "@/lib/game/data";
import { asado, asadoCost, fire, hire, hireExec, isExec, marketSalary, pizza, pizzaCost, rerollCandidates, toggleCrunch, unlocks } from "@/lib/game/engine";
import { ONBOARDING_DAYS } from "@/lib/game/data";
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
  const counts = (Object.keys(ROLES) as Role[]).map((r) => ({ r, n: s.employees.filter((e) => e.role === r).length }));
  const missingNeeded = d.execs.filter((e) => !e.hired && e.neededWhy);
  const u = unlocks(s, d);

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
        <ul className="space-y-2">
          {s.candidates.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl border-2 border-ink/10 p-2">
              <span className="text-2xl">{c.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{c.name}</div>
                <div className="text-[11px] text-ink/60">
                  {ROLES[c.role].icon} {ROLES[c.role].name} · <b>{(c.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[c.level]}</b> · {money(c.salary)} {ROLES[c.role].payLabel}
                </div>
              </div>
              <Btn size="sm" variant="green" disabled={full || s.cash < c.fee} onClick={() => game.mutate((st) => hire(st, c.id))}>
                {c.role === "ai" ? "Activar" : "Contratar"} {money(c.fee)}
              </Btn>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-ink/50">🤖 Los agentes IA vibecodean 60% más rápido y cuestan un cuarto, pero dejan deuda técnica. Los devs humanos la contienen. El fee es medio sueldo; los candidatos se renuevan cada 7 días.</p>
      </Card>

      {u.execs && (
      <Card title="C-level" className={missingNeeded.length ? "!border-red" : ""}>
        {missingNeeded.length > 0 && (
          <div className="mb-2 rounded-lg bg-red/10 px-2 py-1.5 text-xs font-bold text-red">
            Te falta {missingNeeded.map((e) => EXECS.find((x) => x.role === e.role)!.name).join(" y ")}. Estás pagando la penalización todos los días.
          </div>
        )}
        <p className="mb-2 text-[11px] text-ink/50">
          Cuando la empresa crece, los ejecutivos dejan de ser un lujo. Cobran según la valuación (sube solo), piden equity y el headhunter cobra dos sueldos. No trabajan en un garage.
        </p>
        <ul className="space-y-2">
          {d.execs.map((ex) => {
            const def = EXECS.find((x) => x.role === ex.role)!;
            const needed = Boolean(ex.neededWhy);
            return (
              <li key={ex.role} className={`rounded-xl border-2 p-2.5 ${ex.hired ? "border-green/40 bg-green/10" : needed ? "border-red bg-red/5" : "border-ink/10 bg-white"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none">{def.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm font-black">{def.name}</span>
                      {ex.hired ? <Pill tone="good">Contratado</Pill> : needed ? <Pill tone="bad">Hace falta</Pill> : <Pill>Todavía no hace falta</Pill>}
                    </div>
                    <div className="text-[11px] text-ink/60">{def.desc}</div>
                    {needed && <div className="mt-0.5 text-[11px] font-semibold text-red">{ex.neededWhy} {def.penalty}.</div>}
                    {ex.hired && <div className="mt-0.5 text-[11px] font-semibold text-green">{def.bonus}.</div>}
                    {!ex.hired && !needed && <div className="mt-0.5 text-[11px] text-ink/50">{def.bonus}.</div>}
                    <div className="mt-1 text-[11px] text-ink/60">
                      {money(ex.salary)}/mes · {def.equity}% equity · fee {money(ex.fee)}
                    </div>
                  </div>
                  {!ex.hired && (
                    <Btn size="sm" variant={needed ? "danger" : "ghost"} disabled={s.cash < ex.fee || full || s.office < 1} onClick={() => game.mutate((st) => hireExec(st, ex.role))}>
                      Contratar
                    </Btn>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      )}

      <Card
        title={`Equipo ${s.employees.length}/${office.capacity}`}
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
          {d.overhead < 1 && <> · Burocracia <b className="text-red">-{Math.round((1 - d.overhead) * 100)}%</b> por tamaño de equipo</>}. Los sueldos humanos suben 4% cada 60 días.
        </div>
        {u.crunch && (
        <div className={`mb-3 rounded-xl border-2 p-2.5 ${s.crunch ? "border-red bg-red/5" : "border-ink/10 bg-white"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs">
              <b>🔥 Modo crunch</b> {s.crunch ? <Pill tone="bad">activo</Pill> : null}
              <div className="text-ink/60">+30% productividad. La moral cae, tu burnout sube {1.6}/día y la gente empieza a mirar ofertas.</div>
            </div>
            <Btn size="sm" variant={s.crunch ? "ghost" : "danger"} onClick={() => game.mutate((st) => toggleCrunch(st))}>
              {s.crunch ? "Parar" : "Activar"}
            </Btn>
          </div>
        </div>
        )}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Btn variant="ghost" className="flex-col !gap-0 py-2" onClick={() => game.mutate((st) => pizza(st))} disabled={s.cash < pizzaCost(s)}>
            <span>🍕 Pizza para el equipo</span>
            <span className="text-[11px] font-semibold text-ink/60">+5 moral · {money(pizzaCost(s))}</span>
          </Btn>
          <Btn variant="amber" className="flex-col !gap-0 py-2" onClick={() => game.mutate((st) => asado(st))} disabled={s.cash < asadoCost(s)}>
            <span>🥩 Asado para el equipo</span>
            <span className="text-[11px] font-semibold text-ink/70">+12 moral · {money(asadoCost(s))}</span>
          </Btn>
        </div>
        <ul className="space-y-1.5">
          {s.employees.map((e) => {
            const onboarding = !e.founder && e.role !== "ai" && s.day - (e.hiredDay ?? -999) < ONBOARDING_DAYS;
            const underpaid = !e.founder && e.role !== "ai" && !isExec(e.role) && e.salary < marketSalary(s, e) * 0.85;
            return (
            <li key={e.id} className="flex items-center gap-2 rounded-xl bg-sand/60 px-2 py-1.5">
              <span className="text-xl">{e.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                  <span className="truncate">{e.name} {e.founder && "👑"}</span>
                  {e.founder && s.founderOffUntil > s.day && <Pill tone="indigo">de licencia</Pill>}
                  {onboarding && <Pill tone="amber">🆕 onboarding {ONBOARDING_DAYS - (s.day - (e.hiredDay ?? 0))}d</Pill>}
                  {underpaid && <Pill tone="bad">cobra bajo mercado</Pill>}
                </div>
                <div className="text-[11px] text-ink/60">
                  {ROLES[e.role].icon} {e.founder ? "Vibecoder fundador" : isExec(e.role) ? ROLES[e.role].name : `${ROLES[e.role].name} ${(e.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[e.level]}`} · {e.founder ? "sin sueldo" : `${money(isExec(e.role) ? (d.execs.find((x) => x.role === e.role)?.salary ?? e.salary) : e.salary)} ${ROLES[e.role].payLabel}`}
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
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-ink/50">Los nuevos rinden la mitad durante {ONBOARDING_DAYS} días. Con moral baja, sueldo bajo mercado o crunch, la gente recibe ofertas y te toca contraofertar.</p>
      </Card>

      <Card title="Roles">
        <ul className="grid grid-cols-2 gap-1.5 text-[11px]">
          {(Object.keys(ROLES) as Role[]).filter((r) => !isExec(r)).map((r) => (
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
