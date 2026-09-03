"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn } from "@/components/ui";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";

export function LoginButtons() {
  const enabled = supabaseEnabled();
  const params = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(params.get("error") ? "No pudimos completar el login. Probá de nuevo." : null);
  const [logged, setLogged] = useState<{ name: string; anon: boolean } | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setLogged({ name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? "Invitado", anon: Boolean(data.user.is_anonymous) });
    });
  }, []);

  const google = async () => {
    const sb = getSupabase()!;
    setBusy("google");
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/play` } });
    if (error) {
      setErr(error.message);
      setBusy(null);
    }
  };
  const guest = async () => {
    const sb = getSupabase()!;
    setBusy("guest");
    const { error } = await sb.auth.signInAnonymously();
    if (error) {
      setErr(`${error.message}. (¿Está habilitado "Anonymous sign-ins" en Supabase?)`);
      setBusy(null);
      return;
    }
    router.push("/play");
  };

  if (!enabled)
    return (
      <div className="space-y-2">
        <Link href="/play?local=1" className="btn w-full bg-indigo border-ink px-5 py-3 text-base text-white">
          🚀 Jugar (guardado local)
        </Link>
        <p className="text-center text-[11px] text-ink/50">Login con Google y modo social se activan al configurar Supabase (ver README).</p>
      </div>
    );

  return (
    <div className="space-y-2">
      {logged && (
        <Link href="/play" className="btn w-full bg-green border-ink px-5 py-3 text-base text-white">
          ▶ Seguir jugando como {logged.name}
        </Link>
      )}
      <Btn size="lg" className="w-full" onClick={google} disabled={busy !== null}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Continuar con Google
      </Btn>
      <Btn size="lg" variant="ghost" className="w-full" onClick={guest} disabled={busy !== null}>
        👤 Jugar como invitado
      </Btn>
      <Link href="/play?local=1" className="block text-center text-[11px] font-semibold text-ink/50 underline">
        o jugar sin cuenta (solo en este dispositivo)
      </Link>
      {err && <p className="rounded-lg bg-red/10 p-2 text-xs text-red">{err}</p>}
    </div>
  );
}
