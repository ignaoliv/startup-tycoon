"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { dayMs } from "@/lib/game/data";
import { applyIncoming, applyOffline, derive, newGame, tick } from "@/lib/game/engine";
import type { Derived, GameState, Speed } from "@/lib/game/types";
import { getSupabase } from "@/lib/supabase/client";
import { clearLocal, ensureProfile, fetchIncoming, fetchPortfolioTargets, loadCloud, loadLocal, markProcessed, saveCloud, saveLocal, type IncomingAction } from "@/lib/storage";
import { closeStaleRuns, trackRun, trackValuation } from "@/lib/analytics";
import { loadTuning } from "@/lib/game/tuning";

export type Mode = "local" | "cloud";

export interface Toast {
  id: number;
  text: string;
  kind: "info" | "good" | "bad" | "social";
}

export function useGame(forceLocal: boolean) {
  const sb = useMemo<SupabaseClient | null>(() => (forceLocal ? null : getSupabase()), [forceLocal]);
  const mode: Mode = sb ? "cloud" : "local";
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(!sb);
  const [state, setStateRaw] = useState<GameState | null>(null);
  const [loadedState, setLoaded] = useState(false);
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offlineDays, setOfflineDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const [paused, setPaused] = useState(false); // pausa externa (tutorial)
  const ref = useRef<GameState | null>(null);
  const lastTrack = useRef(0);
  const dirty = useRef(false);
  const toastId = useRef(1);
  const userId = user?.id ?? null;

  const notify = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const commit = useCallback((s: GameState) => {
    ref.current = s;
    dirty.current = true;
    setStateRaw(s);
  }, []);

  /** Muta una copia del estado. Devuelve el error que devuelva `fn` (string) o null. */
  const mutate = useCallback(
    (fn: (s: GameState) => string | null | void): string | null => {
      const cur = ref.current;
      if (!cur) return null;
      const copy = structuredClone(cur);
      const err = fn(copy) ?? null;
      if (err) {
        notify(err, "bad");
        return err;
      }
      commit(copy);
      return null;
    },
    [commit, notify],
  );

  // ajustes de /admin y limpieza de partidas viejas
  useEffect(() => {
    loadTuning();
    closeStaleRuns();
  }, []);

  // auth
  useEffect(() => {
    if (!sb) return;
    let active = true;
    sb.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  // carga inicial
  useEffect(() => {
    if (!authChecked) return;
    if (sb && !userId) return; // sin sesión: `loaded` se deriva abajo
    let active = true;
    (async () => {
      let s: GameState | null = null;
      if (sb && userId) {
        try {
          s = await loadCloud(sb, userId);
        } catch (e) {
          console.error(e);
          notify("No pude leer tu partida de la nube. Uso la copia local.", "bad");
        }
        const local = loadLocal(userId);
        if (!s || (local && local.day > s.day)) s = local;
        if (user) {
          const meta = user.user_metadata ?? {};
          await ensureProfile(sb, userId, meta.full_name ?? meta.name ?? (user.is_anonymous ? "Invitado" : "Fundador/a"));
        }
      } else {
        s = loadLocal(null);
      }
      if (!active) return;
      if (s) {
        // acciones sociales pendientes + dividendos
        if (sb && userId) {
          try {
            const incoming = await fetchIncoming(sb, userId);
            for (const a of incoming) applyIncoming(s, a);
            if (incoming.length) {
              await markProcessed(sb, incoming.map((a) => a.id));
              notify(`Tenés ${incoming.length} novedad${incoming.length > 1 ? "es" : ""} de otros jugadores.`, "social");
            }
            const targets = await fetchPortfolioTargets(sb, s.portfolio.map((p) => p.targetId));
            for (const p of s.portfolio) if (targets[p.targetId]) p.lastMrr = targets[p.targetId].mrr;
          } catch (e) {
            console.error(e);
          }
        }
        const days = applyOffline(s);
        setOfflineDays(days);
        s.speed = s.speed === 0 ? 0 : 1;
      }
      ref.current = s;
      setStateRaw(s);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, userId, sb]);

  // loop
  useEffect(() => {
    if (!state || state.gameOver) return;
    const speed = state.speed;
    if (speed === 0 || paused || state.pendingEvent) return;
    const id = setInterval(() => {
      const cur = ref.current;
      if (!cur) return;
      const copy = structuredClone(cur);
      tick(copy);
      copy.lastTickAt = Date.now();
      commit(copy);
    }, dayMs(state.day) / speed);
    return () => clearInterval(id);
  }, [state?.speed, state?.pendingEvent, state?.gameOver, commit, state, paused]);

  // guardado local (siempre) + nube (cada 12s)
  useEffect(() => {
    const local = setInterval(() => {
      const s = ref.current;
      if (!s) return;
      if (dirty.current) saveLocal(s, userId);
      const now = Date.now();
      // si el intervalo tardó mucho, la pestaña estaba en segundo plano: no cuenta como tiempo jugado
      const raw = lastTrack.current ? now - lastTrack.current : 0;
      const delta = raw > 0 && raw < 5000 ? raw : 0;
      lastTrack.current = now;
      trackRun(s, delta);
      trackValuation(s, derive(s).valuation);
    }, 2000);
    const cloud = setInterval(async () => {
      const s = ref.current;
      if (!sb || !userId || !s || !dirty.current) return;
      dirty.current = false;
      setSaving(true);
      try {
        await saveCloud(sb, userId, s, derive(s));
      } catch (e) {
        console.error(e);
        dirty.current = true;
      } finally {
        setSaving(false);
      }
    }, 12000);
    const onHide = () => {
      const s = ref.current;
      if (s) saveLocal(s, userId);
      if (s && sb && userId) saveCloud(sb, userId, s, derive(s)).catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(local);
      clearInterval(cloud);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [sb, userId]);

  // realtime: acciones sociales que me llegan mientras juego
  useEffect(() => {
    if (!sb || !userId) return;
    const ch = sb
      .channel(`actions:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_actions", filter: `to_user=eq.${userId}` }, async () => {
        try {
          const incoming = await fetchIncoming(sb, userId);
          if (!incoming.length) return;
          mutate((s) => {
            for (const a of incoming as IncomingAction[]) applyIncoming(s, a);
          });
          await markProcessed(sb, incoming.map((a) => a.id));
          for (const a of incoming) notify(a.kind === "invest" ? `💰 ${a.from_name} invirtió en tu startup` : a.kind === "hype" ? `🔥 ${a.from_name} te dio hype` : `😤 ${a.from_name} te robó talento`, "social");
        } catch (e) {
          console.error(e);
        }
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, userId, mutate, notify]);

  const saveNow = useCallback(async () => {
    const s = ref.current;
    if (!s) return;
    saveLocal(s, userId);
    if (sb && userId) {
      setSaving(true);
      try {
        await saveCloud(sb, userId, s, derive(s));
        dirty.current = false;
      } finally {
        setSaving(false);
      }
    }
  }, [sb, userId]);

  const startNew = useCallback(
    (opts: { startupName: string; founderName: string; sector: string }) => {
      const prev = ref.current;
      const s = newGame({ ...opts, restarts: prev ? prev.restarts + (prev.gameOver ? 1 : 0) : 0 });
      setOfflineDays(0); // la partida nueva no arrastra el aviso de la anterior
      commit(s);
      saveLocal(s, userId);
      if (sb && userId) saveCloud(sb, userId, s, derive(s)).catch(console.error);
    },
    [commit, sb, userId],
  );

  const reset = useCallback(() => {
    clearLocal(userId);
    setOfflineDays(0);
    ref.current = null;
    setStateRaw(null);
  }, [userId]);

  const setSpeed = useCallback((sp: Speed) => mutate((s) => void (s.speed = sp)), [mutate]);

  const derived: Derived | null = useMemo(() => (state ? derive(state) : null), [state]);
  const loaded = loadedState || (authChecked && Boolean(sb) && !userId);

  const signOut = useCallback(async () => {
    if (sb) await sb.auth.signOut();
    router.push("/");
  }, [sb, router]);

  return { sb, mode, user, userId, state, derived, loaded, mutate, notify, toasts, startNew, reset, setSpeed, saveNow, saving, offlineDays, signOut, setPaused };
}

export type Game = ReturnType<typeof useGame>;
