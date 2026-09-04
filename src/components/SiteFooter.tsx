import Link from "next/link";

export const X_URL = "https://x.com/nacho_olivieri";

export function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-5 pb-6 text-center text-[11px] text-ink/45">
      <p className="flex items-center justify-center gap-1.5">
        Made in Argentina with <span aria-label="amor">❤️</span> by
        <a href={X_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-ink/70 underline-offset-2 hover:underline">
          <XIcon className="h-3.5 w-3.5" />
          nacho_olivieri
        </a>
      </p>
      <p className="mt-1.5">
        <Link href="/privacidad" className="underline">
          Privacidad
        </Link>{" "}
        ·{" "}
        <Link href="/terminos" className="underline">
          Términos
        </Link>
      </p>
    </footer>
  );
}
