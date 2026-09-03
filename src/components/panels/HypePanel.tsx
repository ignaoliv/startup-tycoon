"use client";
import { Bar, Btn, Card, Pill } from "@/components/ui";
import { ADS_LEVELS, AUTO_CAMPAIGNS, BUILD_IN_PUBLIC, CAMPAIGNS, STAGES } from "@/lib/game/data";
import { campaignStatus, runCampaign, setAdsLevel, toggleBuildInPublic } from "@/lib/game/engine";
import { money, num } from "@/lib/game/format";
import type { Game } from "@/hooks/useGame";

export function HypePanel({ game }: { game: Game }) {
  const s = game.state!;
  const d = game.derived!;
  const decay = -d.hypeDecayDay;

  return (
    <div className="space-y-3">
      <Card title="Hype y redes">
        <div className="mb-1 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-ink/50">🔥 Hype</div>
            <div className="text-2xl font-black tabular-nums">{Math.round(s.hype)}</div>
          </div>
          <Pill tone={decay >= 0 ? "good" : "bad"}>{decay >= 0 ? "+" : ""}{decay.toFixed(2)}/día</Pill>
        </div>
        <Bar value={s.hype} color="bg-amber" />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-sand/60 p-2">
            <div className="text-[10px] font-bold uppercase text-ink/50">📱 Seguidores</div>
            <div className="text-lg font-black tabular-nums">{num(s.followers)}</div>
            <div className="text-[10px] text-ink/60">{d.followersDay >= 0 ? "+" : ""}{num(d.followersDay)}/día</div>
          </div>
          <div className="rounded-xl bg-sand/60 p-2">
            <div className="text-[10px] font-bold uppercase text-ink/50">👥 Usuarios por redes</div>
            <div className="text-lg font-black tabular-nums">+{num(d.organicUsersDay)}</div>
            <div className="text-[10px] text-ink/60">por día, orgánico</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink/50">
          El hype baja solo todos los días. Los seguidores lo frenan, traen usuarios gratis y crecen con hype, growth y ads. Growth: {d.mktPts.toFixed(1)} pts.
        </p>
      </Card>

      <Card title="#buildinpublic en el perfil" right={<Pill tone={s.buildInPublic ? "good" : "ink"}>{s.buildInPublic ? "Activo" : "Apagado"}</Pill>}>
        <p className="mb-2 text-[11px] text-ink/60">
          Contás todos los días qué construiste, cuánto facturaste y qué se rompió. Gratis, sin cooldown: suma fijo <b>+{BUILD_IN_PUBLIC.hypeDay} hype/día</b> y <b>+{BUILD_IN_PUBLIC.followersDay} seguidores/día</b> mientras esté activo.
        </p>
        <Btn size="sm" variant={s.buildInPublic ? "ghost" : "amber"} className="w-full" onClick={() => game.mutate((st) => toggleBuildInPublic(st))}>
          🧵 {s.buildInPublic ? "Sacar del perfil" : "Poner #buildinpublic en el perfil"}
        </Btn>
      </Card>

      <Card title="Community (automático)">
        <p className="mb-2 text-[11px] text-ink/60">
          Tenés <b>{d.socialPts.toFixed(1)} pts</b> de Community 📱 (suma de niveles, ajustada por moral). Cada punto suma seguidores y frena la caída del hype. Cuanta más gente de redes, más campañas salen solas sin que las toques:
        </p>
        <ul className="flex flex-wrap gap-1">
          {AUTO_CAMPAIGNS.map((a) => {
            const c = CAMPAIGNS.find((x) => x.id === a.id)!;
            const on = d.socialPts >= a.minPts;
            return (
              <li key={a.id}>
                <Pill tone={on ? "good" : "ink"}>
                  {on ? "✅" : "🔒"} {c.icon} {c.name} · {a.minPts} pts
                </Pill>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Publicidad paga" right={<Pill tone={s.adsLevel > 0 ? "amber" : "ink"}>{ADS_LEVELS[s.adsLevel].icon} {ADS_LEVELS[s.adsLevel].name}</Pill>}>
        <div className="mb-2 grid grid-cols-4 gap-1.5">
          {ADS_LEVELS.map((l, i) => (
            <button key={i} onClick={() => game.mutate((st) => setAdsLevel(st, i))} className={`rounded-xl border-2 p-2 text-center transition ${s.adsLevel === i ? "border-indigo bg-indigo/10" : "border-ink/15 bg-white hover:border-indigo"}`}>
              <div className="text-xl">{l.icon}</div>
              <div className="text-[11px] font-black">{l.name}</div>
              <div className="text-[10px] text-ink/50">{l.spendDay ? `${money(l.spendDay * 30)}/mes` : "gratis"}</div>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-ink/60">
          {ADS_LEVELS[s.adsLevel].desc}
          {s.adsLevel > 0 && (
            <>
              {" "}Trae <b>+{num(d.adsUsersDay)} usuarios/día</b> y +{(s.adsLevel * 0.15).toFixed(2)} hype/día. Cada usuario pago sale más caro a medida que crecés.
            </>
          )}
        </div>
      </Card>

      {(["campaign", "sponsor"] as const).map((group) => (
      <Card key={group} title={group === "campaign" ? "Campañas" : "Sponsoreos grandes"}>
        {group === "sponsor" && <p className="mb-2 text-[11px] text-ink/60">Se desbloquean a medida que levantás rondas. Cuestan una fortuna y pueden salir mal: si salen mal, es puro gasto.</p>}
        <ul className="space-y-2">
          {CAMPAIGNS.filter((c) => Boolean(c.sponsor) === (group === "sponsor")).map((c) => {
            const st = campaignStatus(s, c.id);
            const once = c.cooldown >= 100000;
            const done = once && (s.campaignCooldowns[c.id] ?? 0) > s.day;
            return (
              <li key={c.id} className={`rounded-xl border-2 p-2.5 ${done ? "border-green/40 bg-green/10" : st.ok ? "border-ink/15 bg-white" : "border-ink/10 bg-ink/5"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm font-black">{c.name}</span>
                      {once && <Pill tone="indigo">1 sola vez</Pill>}
                      {c.risk && <Pill tone="bad">{Math.round(c.risk.chance * 100)}% de salir mal</Pill>}
                      {c.minStage !== undefined && s.stage < c.minStage && <Pill tone="indigo">🔒 {STAGES[c.minStage].name}</Pill>}
                    </div>
                    <div className="text-[11px] text-ink/60">{c.desc}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Pill tone="amber">+{c.hype} hype</Pill>
                      <Pill>+{num(c.followers(s))} seguidores</Pill>
                      {c.users && <Pill tone="good">+{num(c.users(s))} usuarios</Pill>}
                      {c.morale && <Pill tone="good">+{c.morale} moral</Pill>}
                      {!once && <Pill>cada {c.cooldown} días</Pill>}
                    </div>
                    {!st.ok && !done && <div className="mt-1 text-[11px] font-semibold text-red/80">{st.reason}</div>}
                  </div>
                  <Btn size="sm" variant={st.ok ? "amber" : "ghost"} disabled={!st.ok} onClick={() => game.mutate((g) => runCampaign(g, c.id))}>
                    {done ? "Hecho ✅" : st.daysLeft > 0 && !once ? `${st.daysLeft}d` : st.cost > 0 ? money(st.cost) : "Gratis"}
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      ))}
    </div>
  );
}
