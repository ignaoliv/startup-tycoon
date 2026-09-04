"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getSupabase, signInWithGoogle, signOut, supabaseEnabled } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** Botón de sesión de la landing. Entrar es opcional: sirve para el ranking. */
export function AuthButton({ compact = false }: { compact?: boolean } = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [yendo, setYendo] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      const t = setTimeout(() => setListo(true), 0);
      return () => clearTimeout(t);
    }
    let vivo = true;
    sb.auth.getUser().then(({ data }) => {
      if (!vivo) return;
      setUser(data.user ?? null);
      setListo(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!supabaseEnabled() || !listo) return null;

  const meta = user?.user_metadata ?? {};
  const nombre: string = meta.full_name ?? meta.name ?? "Fundador/a";
  const avatar: string | undefined = meta.avatar_url ?? meta.picture;

  if (!user) {
    return (
      <button
        onClick={async () => {
          setYendo(true);
          const err = await signInWithGoogle("/play");
          if (err) setYendo(false);
        }}
        disabled={yendo}
        className={`btn shrink-0 border-ink/25 bg-white text-ink disabled:opacity-60 ${compact ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-2 text-[13px] sm:px-4 sm:text-sm"}`}
        title="Entrar con Google"
      >
        <GoogleIcon />
        {compact ? <span className="hidden sm:inline">Entrar</span> : <><span className="hidden sm:inline">{yendo ? "Abriendo…" : "Entrar con Google"}</span><span className="sm:hidden">Entrar</span></>}
      </button>
    );
  }

  return (
    <div className="relative shrink-0">
      <button onClick={() => setAbierto((v) => !v)} className={`btn border-ink/25 bg-white text-[13px] ${compact ? "px-1.5 py-1" : "px-2 py-1.5 sm:px-3 sm:text-sm"}`} title={nombre}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" width={22} height={22} className="rounded-full" />
        ) : (
          <span aria-hidden>👤</span>
        )}
        {!compact && <span className="hidden max-w-28 truncate sm:inline">{nombre.split(" ")[0]}</span>}
      </button>
      {abierto && (
        <div className="pop absolute right-0 top-11 z-30 w-52 rounded-xl border-2 border-ink/15 bg-white p-1 text-sm shadow-lg">
          <div className="truncate px-3 py-1.5 text-[11px] text-ink/50">{user.email ?? nombre}</div>
          <Link href="/home" onClick={() => setAbierto(false)} className="block rounded-lg px-3 py-2 hover:bg-ink/5">
            🏆 Mi carrera y el ranking
          </Link>
          <button
            onClick={async () => {
              await signOut();
              setAbierto(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left hover:bg-ink/5"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
