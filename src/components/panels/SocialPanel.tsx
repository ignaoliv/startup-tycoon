"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OfficeView } from "@/components/OfficeView";
import { Btn, Card, Pill } from "@/components/ui";
import { AI_LEVEL_NAMES, LEVEL_NAMES, OFFICES, ROLES, SECTORS, STAGES } from "@/lib/game/data";
import { investOut, poachCost } from "@/lib/game/engine";
import { money, num } from "@/lib/game/format";
import type { Employee, GameState } from "@/lib/game/types";
import { createPost, fetchLeaderboard, fetchPosts, fetchStartupState, hypedToday, sendAction, toggleLike, type LeaderRow, type Post } from "@/lib/storage";
import type { Game } from "@/hooks/useGame";

type Sub = "ranking" | "muro";

export function SocialPanel({ game }: { game: Game }) {
  const [sub, setSub] = useState<Sub>("ranking");
  const [visiting, setVisiting] = useState<string | null>(null);

  if (game.mode === "local" || !game.userId) {
    return (
      <Card title="Social">
        <p className="mb-3 text-sm">
          Estás jugando en <b>modo local</b>. Para ver el ranking, el muro y meterte en las startups de otros, entrá con Google.
        </p>
        <Link href="/" className="btn bg-indigo px-4 py-2 text-sm text-white border-ink">
          Entrar con Google
        </Link>
      </Card>
    );
  }

  if (visiting) return <VisitView game={game} userId={visiting} onBack={() => setVisiting(null)} />;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl bg-ink/5 p-1">
        {(["ranking", "muro"] as Sub[]).map((k) => (
          <button key={k} onClick={() => setSub(k)} className={`flex-1 rounded-lg py-1.5 text-sm font-black transition ${sub === k ? "bg-white shadow" : "text-ink/50"}`}>
            {k === "ranking" ? "🏆 Ranking" : "💬 Muro"}
          </button>
        ))}
      </div>
      {sub === "ranking" ? <Leaderboard game={game} onVisit={setVisiting} /> : <Feed game={game} onVisit={setVisiting} />}
    </div>
  );
}

function Leaderboard({ game, onVisit }: { game: Game; onVisit: (id: string) => void }) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setRows(await fetchLeaderboard(game.sb!));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [game.sb]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    const id = setInterval(load, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [load]);

  const myRank = rows ? rows.findIndex((r) => r.user_id === game.userId) + 1 : 0;

  return (
    <Card
      title="Ranking por valuación"
      right={
        <Btn size="sm" variant="ghost" onClick={() => { game.saveNow().then(load); }}>
          🔄
        </Btn>
      }
    >
      {err && <div className="mb-2 rounded-lg bg-red/10 p-2 text-xs text-red">Error: {err}. ¿Corriste el schema.sql en Supabase?</div>}
      {myRank > 0 && (
        <div className="mb-2 text-xs text-ink/60">
          Estás en el puesto <b>#{myRank}</b> de {rows!.length}. Se actualiza con cada guardado.
        </div>
      )}
      {!rows ? (
        <div className="text-sm text-ink/50">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-ink/50">Todavía no hay nadie. ¡Sos el primero!</div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => {
            const sec = SECTORS.find((x) => x.id === r.sector);
            const me = r.user_id === game.userId;
            return (
              <li key={r.user_id}>
                <button onClick={() => !me && onVisit(r.user_id)} className={`flex w-full items-center gap-2 rounded-xl border-2 p-2 text-left ${me ? "border-indigo bg-indigo/10" : "border-ink/10 bg-white hover:border-indigo"}`}>
                  <span className="w-7 text-center text-lg font-black">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`}</span>
                  <span className="text-xl">{sec?.icon ?? "🏢"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">
                      {r.name} {r.game_over === "ipo" && "🔔"} {r.game_over === "acquired" && "🏦"} {r.game_over === "bankrupt" && "💀"}
                    </div>
                    <div className="truncate text-[11px] text-ink/60">
                      {r.display_name} · {STAGES[r.stage]?.name} · {num(Number(r.users))} usuarios · día {r.day}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tabular-nums">{money(Number(r.valuation))}</div>
                    {!me && <div className="text-[10px] text-indigo">visitar ›</div>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Feed({ game, onVisit }: { game: Game; onVisit: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setPosts(await fetchPosts(game.sb!, game.userId!));
    } catch (e) {
      console.error(e);
      setPosts([]);
    }
  }, [game.sb, game.userId]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    const ch = game.sb!.channel("feed").on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => load()).subscribe();
    return () => {
      clearTimeout(t);
      game.sb!.removeChannel(ch);
    };
  }, [load, game.sb]);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await createPost(game.sb!, game.userId!, text.trim());
      setText("");
      await load();
    } catch (e) {
      game.notify((e as Error).message, "bad");
    } finally {
      setBusy(false);
    }
  };

  const brag = () => {
    const s = game.state!;
    const d = game.derived!;
    setText(`${s.startupName} va por el día ${s.day}: ${num(s.users)} usuarios, ${money(d.mrr)} MRR y valuación de ${money(d.valuation)}. ¿Quién me invierte? 🚀`);
  };

  return (
    <div className="space-y-3">
      <Card title="Muro de fundadores">
        <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 280))} rows={2} placeholder="Contá cómo va tu startup, pedí inversión, tirá un pitch…" className="w-full resize-none rounded-xl border-2 border-ink/20 bg-cream p-2 text-sm outline-none focus:border-indigo" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Btn size="sm" variant="ghost" onClick={brag}>
            📈 Presumir stats
          </Btn>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink/40">{text.length}/280</span>
            <Btn size="sm" onClick={submit} disabled={busy || !text.trim()}>
              Publicar
            </Btn>
          </div>
        </div>
      </Card>
      {!posts ? (
        <div className="text-sm text-ink/50">Cargando…</div>
      ) : posts.length === 0 ? (
        <Card>
          <div className="text-sm text-ink/50">Nadie publicó nada todavía. Rompé el hielo.</div>
        </Card>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className={`card !p-3 ${p.kind === "milestone" ? "border-amber bg-amber/10" : ""}`}>
              <div className="mb-1 flex items-center gap-2">
                <button onClick={() => p.user_id !== game.userId && onVisit(p.user_id)} className="truncate text-sm font-black hover:underline">
                  {p.startup?.name ?? p.author?.display_name ?? "Fundador/a"}
                </button>
                <span className="truncate text-[11px] text-ink/50">{p.author?.display_name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-ink/40">{timeAgo(p.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{p.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={async () => {
                    setPosts((ps) => ps!.map((x) => (x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)));
                    await toggleLike(game.sb!, p.id, game.userId!, p.liked);
                  }}
                  className={`rounded-full border-2 px-2 py-0.5 text-xs font-bold ${p.liked ? "border-red bg-red/10 text-red" : "border-ink/15 text-ink/60"}`}
                >
                  ❤️ {p.likes}
                </button>
                {p.user_id !== game.userId && (
                  <button onClick={() => onVisit(p.user_id)} className="text-xs font-bold text-indigo">
                    Visitar startup ›
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VisitView({ game, userId, onBack }: { game: Game; userId: string; onBack: () => void }) {
  const [data, setData] = useState<{ row: LeaderRow; state: GameState } | null | undefined>(undefined);
  const [amount, setAmount] = useState(5000);
  const [hyped, setHyped] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const me = game.state!;

  useEffect(() => {
    fetchStartupState(game.sb!, userId).then(setData).catch(() => setData(null));
    hypedToday(game.sb!, game.userId!, userId).then(setHyped);
  }, [game.sb, game.userId, userId]);

  if (data === undefined) return <div className="text-sm text-ink/50">Entrando a la oficina…</div>;
  if (data === null)
    return (
      <Card>
        <Btn size="sm" variant="ghost" onClick={onBack}>
          ‹ Volver
        </Btn>
        <p className="mt-2 text-sm">No encontré esa startup.</p>
      </Card>
    );
  const { row, state: t } = data;
  const sec = SECTORS.find((x) => x.id === t.sector);
  const alreadyInvested = me.portfolio.some((p) => p.targetId === userId);
  const poachable = t.employees.filter((e) => !e.founder);
  const myCap = OFFICES[me.office].capacity;

  const doHype = async () => {
    setBusy(true);
    try {
      await sendAction(game.sb!, game.userId!, userId, "hype", {});
      setHyped(true);
      game.notify(`🔥 Le diste hype a ${t.startupName}`, "social");
    } catch (e) {
      game.notify((e as Error).message, "bad");
    } finally {
      setBusy(false);
    }
  };
  const doInvest = async () => {
    const err = game.mutate((s) => investOut(s, amount, { id: userId, name: t.startupName, valuation: Number(row.valuation), mrr: Number(row.mrr) }));
    if (err) return;
    setBusy(true);
    try {
      await sendAction(game.sb!, game.userId!, userId, "invest", { amount });
      await game.saveNow();
      game.notify(`🤝 Invertiste ${money(amount)} en ${t.startupName}`, "social");
    } catch (e) {
      game.notify((e as Error).message, "bad");
    } finally {
      setBusy(false);
    }
  };
  const doPoach = async (e: Employee) => {
    const cost = poachCost(e);
    const err = game.mutate((s) => {
      if (s.employees.length >= myCap) return "Tu oficina está llena.";
      if (s.cash < cost) return "No te alcanza.";
      s.cash -= cost;
      s.employees.push({ ...e, id: `p${s.nextId++}`, salary: Math.round(e.salary * 1.3) });
      s.stats.hires += 1;
      s.log.unshift({ day: s.day, text: `😈 Le robaste a ${e.name} a ${t.startupName} por ${money(cost)}.`, kind: "social" });
    });
    if (err) return;
    setBusy(true);
    try {
      await sendAction(game.sb!, game.userId!, userId, "poach", { employeeId: e.id, employeeName: e.name, compensation: Math.round(cost * 0.6) });
      setData({ row, state: { ...t, employees: t.employees.filter((x) => x.id !== e.id) } });
      await game.saveNow();
      game.notify(`😈 ${e.name} ahora trabaja para vos`, "social");
    } catch (er) {
      game.notify((er as Error).message, "bad");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Btn size="sm" variant="ghost" onClick={onBack}>
          ‹ Volver
        </Btn>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black">
            {sec?.icon} {t.startupName}
          </div>
          <div className="truncate text-[11px] text-ink/60">
            de {row.display_name} · {STAGES[t.stage]?.name} · día {t.day}
          </div>
        </div>
      </div>
      <Card className="!p-2">
        <OfficeView state={t} compact />
      </Card>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini l="Valuación" v={money(Number(row.valuation))} />
        <Mini l="Usuarios" v={num(Number(row.users))} />
        <Mini l="MRR" v={money(Number(row.mrr))} />
      </div>

      <Card title="Interactuar">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs">
              <b>🔥 Dar hype</b>
              <div className="text-ink/60">Gratis. +5 hype para ellos, 1 vez por día.</div>
            </div>
            <Btn size="sm" variant="amber" disabled={busy || hyped !== false} onClick={doHype}>
              {hyped ? "Ya diste" : "Dar hype"}
            </Btn>
          </div>
          <div className="border-t border-ink/10 pt-3">
            <div className="text-xs">
              <b>🤝 Invertir</b>
              <div className="text-ink/60">Le mandás plata ahora y cobrás dividendos de su MRR según tu participación. Tenés {money(me.cash)}.</div>
            </div>
            {alreadyInvested ? (
              <Pill tone="indigo">Ya sos inversor de esta startup</Pill>
            ) : (
              <div className="mt-2 flex gap-2">
                <input type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="w-28 rounded-xl border-2 border-ink/20 bg-cream px-2 py-1.5 text-sm font-bold outline-none focus:border-indigo" />
                <Btn size="sm" className="flex-1" disabled={busy || amount <= 0 || amount > me.cash} onClick={doInvest}>
                  Invertir {money(amount)} ({((amount / (Number(row.valuation) + amount)) * 100).toFixed(1)}%)
                </Btn>
              </div>
            )}
          </div>
          <div className="border-t border-ink/10 pt-3">
            <div className="text-xs">
              <b>😈 Robar talento (o agentes)</b>
              <div className="text-ink/60">Pagás 4 sueldos + $2.000 y se viene a tu equipo (cobrando 30% más). Ellos reciben una indemnización.</div>
            </div>
            {poachable.length === 0 ? (
              <div className="mt-1 text-xs text-ink/40">No tienen empleados para robar.</div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {poachable.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 rounded-lg bg-sand/60 px-2 py-1.5">
                    <span className="text-lg">{e.avatar}</span>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="truncate font-bold">{e.name}</div>
                      <div className="text-ink/60">
                        {ROLES[e.role].icon} {ROLES[e.role].name} {(e.role === "ai" ? AI_LEVEL_NAMES : LEVEL_NAMES)[e.level]}
                      </div>
                    </div>
                    <Btn size="sm" variant="danger" disabled={busy || me.cash < poachCost(e) || me.employees.length >= myCap} onClick={() => doPoach(e)}>
                      {money(poachCost(e))}
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Mini({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-white px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase text-ink/50">{l}</div>
      <div className="text-sm font-black tabular-nums">{v}</div>
    </div>
  );
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}
