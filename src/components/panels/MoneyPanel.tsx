"use client";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { useState } from "react";
import { ACHIEVEMENT_DEFS, CAMPAIGNS, campaignAvailable, campaignCooldown, factorVentana, ipo, marketingPush, raiseRound, upgradeOffice } from "@/lib/game/engine";
import { OFFICES, STAGES } from "@/lib/game/data";
import { tuning } from "@/lib/game/tuning";
import { money, num } from "@/lib/game/format";
import type { Game } from "@/hooks/useGame";

export function MoneyPanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const stage = STAGES[s.stage];
  const next = STAGES[s.stage + 1];
  const canRaise = next && next.raise > 0 && d.valuation >= next.minValuation;
  const [confirmarRonda, setConfirmarRonda] = useState(false);
  const [confirmarIpo, setConfirmarIpo] = useState(false);
  const ventana = factorVentana(s);
  const puedeIpo = d.valuation >= tuning.ipoValuation;
  const porcentajeIpo = Math.floor((d.valuation / tuning.ipoValuation) * 100);
  const nextOffice = OFFICES[s.office + 1];
  const runway = d.netDay < 0 ? Math.floor(s.cash / -d.netDay) : null;

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
        {s.done.includes("mvp") && (
        <div className="mt-3 rounded-xl border-2 border-ink/15 bg-sand/50 px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Precio por usuario</div>
              <div className="text-lg font-black tabular-nums">
                {money(d.arpu)}<span className="text-xs font-bold text-ink/50">/mes</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Btn size="sm" variant="ghost" disabled={s.precio <= 0.6} onClick={() => game.mutate((st) => void (st.precio = Math.max(0.6, +(st.precio - 0.1).toFixed(2))))}>
                −
              </Btn>
              <span className="w-12 text-center text-xs font-black tabular-nums">{Math.round(s.precio * 100)}%</span>
              <Btn size="sm" variant="ghost" disabled={s.precio >= 2} onClick={() => game.mutate((st) => void (st.precio = Math.min(2, +(st.precio + 0.1).toFixed(2))))}>
                +
              </Btn>
            </div>
          </div>
          {s.precio !== 1 && (
            <div className={`mt-1 text-[11px] font-bold ${s.precio > 1 ? "text-amber" : "text-indigo"}`}>
              {s.precio > 1
                ? `Cobrás ${Math.round((s.precio - 1) * 100)}% más, pero cuesta más venderlo y se te van antes.`
                : `Cobrás ${Math.round((1 - s.precio) * 100)}% menos: entra más gente y se queda más.`}
            </div>
          )}
        </div>
        )}

        <div className="mt-3 space-y-1.5">
          {CAMPAIGNS.filter((c) => s.users >= c.minUsers).map((c) => {
            const costo = c.cost(s);
            const espera = campaignCooldown(s, c.id);
            return (
              <Btn
                key={c.id}
                variant="amber"
                size="sm"
                className="w-full justify-between"
                disabled={espera > 0 || s.cash < costo}
                onClick={() => game.mutate((st) => marketingPush(st, c.id))}
              >
                <span>
                  {c.icon} {c.name} · +{c.hype} hype
                  {c.usersPct > 0 && ` y +${Math.round(c.usersPct * 100)}% usuarios`}
                </span>
                <span className="tabular-nums">{espera > 0 ? `en ${espera} días` : money(costo)}</span>
              </Btn>
            );
          })}
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
            <Btn className="mt-2 w-full" disabled={!canRaise} onClick={() => setConfirmarRonda(true)}>
              💸 Levantar ronda {next.name} · {money(next.raise)}
            </Btn>
          </>
        )}
        {ventana < 0.995 && (
          <div className="mt-3 rounded-xl border-2 border-red/40 bg-red/10 px-3 py-2">
            <div className="text-[11px] font-black uppercase tracking-wide text-red">La ventana se cierra</div>
            <div className="text-sm font-bold">
              Tu empresa vale el <b>{Math.round(ventana * 100)}%</b> de lo que valdría antes.
            </div>
            <div className="text-[11px] text-ink/60">Cada día que pasa vale un poco menos. Salir a bolsa hoy te deja {money((d.valuation * s.equity) / 100)}.</div>
          </div>
        )}

        {/* el camino a la bolsa se ve desde el día 1: no hace falta haber
            levantado rondas, y el que no quiere diluirse necesita ver su meta */}
        <div className="mt-3 border-t-2 border-ink/10 pt-2">
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-bold">🔔 Salir a bolsa</span>
            <span className="tabular-nums text-ink/50">
              {money(d.valuation)} de {money(tuning.ipoValuation)}
            </span>
          </div>
          <Bar value={d.valuation} max={tuning.ipoValuation} color="bg-amber" />
          {puedeIpo ? (
            <Btn className="mt-2 w-full" variant="amber" onClick={() => setConfirmarIpo(true)}>
              🔔 Salir a bolsa (IPO)
            </Btn>
          ) : (
            <div className="mt-1 text-[11px] text-ink/50">
              {porcentajeIpo < 1
                ? "El final grande. No hace falta levantar rondas: se abre por valuación."
                : `Vas por el ${porcentajeIpo}% del camino. No hace falta levantar rondas.`}
            </div>
          )}
        </div>
        {s.boardGoal && (() => {
          const faltanDias = Math.max(0, s.boardGoal.dueDay - s.day);
          const faltanUsers = Math.max(0, Math.round(s.boardGoal.users - s.users));
          // avisa cuando todavía se puede hacer algo, no cuando ya es tarde:
          // o queda poco tiempo, o falta demasiado para lo que venís creciendo
          const apretado = faltanUsers > 0 && (faltanDias <= 25 || faltanUsers > s.users * 0.6);
          return (
            <div className={`mt-2 rounded-lg border-2 px-2 py-1.5 text-[11px] ${apretado ? "border-red bg-red/10" : "border-ink/15 bg-sand/60"}`}>
              <b>🪑 Meta del board:</b> llegar a {Math.round(s.boardGoal.users).toLocaleString("es-AR")} usuarios para el día {s.boardGoal.dueDay}.{" "}
              {faltanUsers > 0 ? (
                <>Faltan {faltanUsers.toLocaleString("es-AR")} usuarios y {faltanDias} días.</>
              ) : (
                <span className="font-bold text-green">Ya la cumpliste.</span>
              )}
              {faltanUsers > 0 && (
                <span className={apretado ? "font-bold text-red" : "text-ink/60"}> Si no llegás, ponen otro CEO en tu silla.</span>
              )}
            </div>
          );
        })()}
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

      {confirmarRonda && next && (
        <Confirmacion
          icono="💸"
          titulo={`Levantar la ronda ${next.name}`}
          onCancelar={() => setConfirmarRonda(false)}
          onConfirmar={() => {
            setConfirmarRonda(false);
            game.mutate((st) => raiseRound(st));
          }}
          confirmar={`Cerrar la ronda · ${money(next.raise)}`}
        >
          <p className="mb-2">
            Entran <b>{money(next.raise)}</b> a la caja y cedés el <b>{next.equity}%</b> de la empresa.
          </p>
          <p className="mb-2">
            Tu equity pasa de <b>{s.equity}%</b> a <b>{s.equity - next.equity}%</b>. Al valor de hoy, tu parte queda en{" "}
            <b>{money((d.valuation * (s.equity - next.equity)) / 100)}</b>.
          </p>
          <p className="text-ink/60">Además el board te va a poner una meta de crecimiento. No se puede deshacer.</p>
        </Confirmacion>
      )}

      {confirmarIpo && (
        <Confirmacion
          icono="🔔"
          titulo="Salir a bolsa"
          onCancelar={() => setConfirmarIpo(false)}
          onConfirmar={() => {
            setConfirmarIpo(false);
            game.mutate((st) => ipo(st));
          }}
          confirmar="🔔 Tocar la campana"
          destacado
        >
          <p className="mb-2">
            Es el final: <b>{s.startupName}</b> sale a bolsa y la partida termina acá.
          </p>
          <p className="mb-2">
            Tu <b>{s.equity}%</b> se convierte en <b>{money((d.valuation * s.equity) / 100)}</b>.
          </p>
          <p className="text-ink/60">Si querés estirarla y valer más, podés seguir jugando y volver cuando quieras.</p>
        </Confirmacion>
      )}
    </div>
  );
}

/** Confirmación para las decisiones que no se pueden deshacer. */
function Confirmacion({
  icono,
  titulo,
  children,
  confirmar,
  destacado,
  onConfirmar,
  onCancelar,
}: {
  icono: string;
  titulo: string;
  children: React.ReactNode;
  confirmar: string;
  destacado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-3 sm:items-center">
      <div className="pop card w-full max-w-md">
        <div className="mb-1 text-4xl">{icono}</div>
        <h2 className="mb-2 text-xl font-black">{titulo}</h2>
        <div className="mb-4 text-sm text-ink/80">{children}</div>
        <div className="flex gap-2">
          <Btn variant={destacado ? "amber" : "primary"} className="flex-1" onClick={onConfirmar}>
            {confirmar}
          </Btn>
          <Btn variant="ghost" onClick={onCancelar}>
            Cancelar
          </Btn>
        </div>
      </div>
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
