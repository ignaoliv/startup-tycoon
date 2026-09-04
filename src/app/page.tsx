import Image from "next/image";
import Link from "next/link";

// sin Supabase configurado, el juego corre en modo local
const PLAY_HREF = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "/play" : "/play?local=1";

const STATS = [
  { icon: "💵", label: "Caja", value: "$32k", sub: "+$2.2k/mes", tone: "text-green" },
  { icon: "👥", label: "Usuarios", value: "502", sub: "+2/día", tone: "text-green" },
  { icon: "📈", label: "MRR", value: "$3.0k", sub: "$6 ARPU", tone: "text-ink/50" },
  { icon: "🏦", label: "Valuación", value: "$184k", sub: "100% tuyo", tone: "text-ink/50" },
  { icon: "🔥", label: "Hype", value: "0", sub: "-0.7/día", tone: "text-red" },
  { icon: "😊", label: "Moral", value: "55", sub: "2 personas", tone: "text-ink/50" },
];

const CARDS = [
  { icon: "🤖", title: "Agentes IA", desc: "Rápidos y baratos, pero dejan deuda técnica." },
  { icon: "🛠️", title: "Producto", desc: "Shippeá features y mejorá tu startup." },
  { icon: "💸", title: "Rondas", desc: "Pre-seed, seed y más para crecer." },
  { icon: "🌍", title: "Social", desc: "Competí, invertí o robá talento." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
      {/* barra superior */}
      <header className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} priority className="h-8 w-auto sm:h-11" />
        <Link href={PLAY_HREF} className="btn shrink-0 whitespace-nowrap border-ink bg-amber px-2.5 py-2 text-[13px] text-ink sm:px-5 sm:text-base">
          <span aria-hidden>⭐</span> Crear startup
        </Link>
      </header>

      {/* hero */}
      <section className="mt-6 grid items-center gap-6 lg:mt-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-10">
        <div className="text-center lg:text-left">
          <h1 className="text-[clamp(1.75rem,3.6vw,3rem)] font-black leading-[1.1] tracking-tight">
            Construí una startup.
            <br />
            Sobreviví al caos.
            <br />
            Llegá a unicornio. <span aria-hidden>🦄</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/60 sm:text-lg lg:mx-0">
            Fundá tu empresa, contratá agentes IA, conseguí usuarios y levantá inversión. Todo desde una interfaz simple y caótica, como una startup de verdad.
          </p>
          <Link href={PLAY_HREF} className="btn mt-6 w-full justify-center border-ink bg-amber px-6 py-4 text-lg text-ink sm:w-auto sm:text-xl">
            <span aria-hidden>🚀</span> Crear mi startup
          </Link>
        </div>

        {/* vista previa del juego */}
        <div className="rounded-3xl border border-ink/10 bg-sand/40 p-3 sm:p-4">
          <ul className="mb-3 hidden grid-cols-6 gap-2 lg:grid">
            {STATS.map((s) => (
              <li key={s.label} className="rounded-xl border border-ink/10 bg-white px-2 py-2 text-center">
                <div className="text-[9px] font-bold uppercase tracking-wider text-ink/45">{s.label}</div>
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <span className="text-sm leading-none">{s.icon}</span>
                  <span className="text-sm font-black tabular-nums">{s.value}</span>
                </div>
                <div className={`text-[9px] font-semibold tabular-nums ${s.tone}`}>{s.sub}</div>
              </li>
            ))}
          </ul>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
            <div className="py-2 text-center text-base font-black text-ink/70 sm:text-lg">
              <span aria-hidden>🏠</span> Garage · 2/3
            </div>
            <Image src="/hero-garage.png" alt="El garage del juego: dos personas y un agente de IA trabajando con sus laptops" width={840} height={374} priority className="h-auto w-full" />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-amber bg-amber/15 px-3 py-2.5 text-sm font-semibold">
            <span aria-hidden>💡</span>
            <span className="flex-1">Podés levantar la ronda Pre-seed.</span>
            <span className="text-ink/40" aria-hidden>›</span>
          </div>
        </div>
      </section>

      {/* qué hay adentro */}
      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:mt-10 lg:grid-cols-4">
        {CARDS.map((c) => (
          <li key={c.title} className="rounded-2xl border border-ink/10 bg-white p-3 text-center shadow-sm sm:p-5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl leading-none sm:text-3xl">{c.icon}</span>
              <span className="text-base font-black sm:text-lg">{c.title}</span>
            </div>
            <p className="mt-1.5 text-xs leading-snug text-ink/55 sm:text-sm">{c.desc}</p>
          </li>
        ))}
      </ul>

      {/* cierre */}
      <section className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-amber/60 bg-amber/15 px-4 py-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:mt-8">
        <p className="flex items-center gap-2.5 text-base font-black sm:text-xl">
          <span className="text-2xl leading-none sm:text-3xl" aria-hidden>🏆</span>
          Empezás en un garage. Terminás tocando la campana.
        </p>
        <Link href={PLAY_HREF} className="btn shrink-0 border-ink/25 bg-white px-4 py-2.5 text-sm">
          Jugar ahora
        </Link>
      </section>

      <p className="mt-5 pb-4 text-center text-[11px] text-ink/40">Funciona en el celular y en la compu. Podés agregarlo a la pantalla de inicio.</p>
    </main>
  );
}
