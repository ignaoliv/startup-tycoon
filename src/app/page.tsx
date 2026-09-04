import Image from "next/image";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { SiteFooter } from "@/components/SiteFooter";
import { DESCRIPCION, FAQ, NOMBRE, SITIO } from "@/lib/seo";

// Se puede jugar con o sin cuenta: la sesión solo decide dónde se guarda la partida.
const PLAY_HREF = "/play";

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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VideoGame",
      name: NOMBRE,
      url: SITIO,
      description: DESCRIPCION,
      inLanguage: "es-AR",
      genre: ["Simulación", "Tycoon", "Estrategia"],
      gamePlatform: ["Navegador web", "Android", "iOS"],
      playMode: "SinglePlayer",
      applicationCategory: "GameApplication",
      operatingSystem: "Cualquiera con navegador",
      author: { "@type": "Person", name: "Ignacio Olivieri", url: "https://x.com/nacho_olivieri" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* barra superior */}
      <header className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} priority className="h-8 w-auto sm:h-11" />
        <AuthButton />
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


      <SiteFooter />
    </main>
  );
}
