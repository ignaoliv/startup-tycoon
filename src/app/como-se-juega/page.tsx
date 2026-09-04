import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { DESCRIPCION, FAQ, NOMBRE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cómo se juega",
  description: "Guía para arrancar en Vibe Coding Game: agentes de IA, features, usuarios, rondas de inversión y cómo llegar a unicornio sin fundirte.",
  alternates: { canonical: "/como-se-juega" },
};

const PASOS = [
  {
    n: 1,
    t: "Fundá la startup",
    d: "Elegís nombre, idea y sector. Arrancás con $30.000, un garage, una laptop y un agente de inteligencia artificial. El sector cambia cuánto crecés y cuánto te paga cada usuario.",
  },
  {
    n: 2,
    t: "Construí el producto",
    d: "En la pestaña Producto elegís qué se construye. Empezá por el MVP: sin producto no entra un solo usuario. Después vienen la landing, los pagos, la app móvil y el resto del roadmap.",
  },
  {
    n: 3,
    t: "Armá el equipo",
    d: "Los agentes de IA son rápidos y baratos, pero dejan deuda técnica. Los devs humanos la contienen. También sumás diseño, growth, ventas, QA y DevOps. Cuidá la moral: multiplica todo lo que produce el equipo.",
  },
  {
    n: 4,
    t: "Vigilá la caja",
    d: "Es lo que mata a la mayoría. Si gastás más de lo que entra durante doce días seguidos, cerrás. Antes de contratar, mirá cuántos días de caja te quedan.",
  },
  {
    n: 5,
    t: "Levantá rondas",
    d: "Cuando tu valuación llega al mínimo, podés levantar Pre-seed, Seed, Serie A, B y C. Entra plata y cedés equity. Desde el Seed, el directorio te pone metas de crecimiento: si fallás dos seguidas, te reemplazan.",
  },
  {
    n: 6,
    t: "Llegá a unicornio",
    d: "A los mil millones de valuación podés salir a bolsa y tocar la campana. También podés vender la empresa antes, si la oferta te convence.",
  },
];

export default function ComoSeJuega() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        name: `Cómo jugar a ${NOMBRE}`,
        description: DESCRIPCION,
        totalTime: "PT12M",
        step: PASOS.map((p) => ({ "@type": "HowToStep", position: p.n, name: p.t, text: p.d })),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt={NOMBRE} width={596} height={160} className="h-8 w-auto sm:h-10" />
        </Link>
        <Link href="/play" className="btn shrink-0 border-ink bg-amber px-3 py-2 text-sm text-ink">
          🚀 Jugar
        </Link>
      </header>

      <article className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-7">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Cómo se juega a Vibe Coding Game</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
          Vibe Coding Game es un juego de simulación gratuito, en español, donde fundás una startup de tecnología hecha con inteligencia artificial y la
          llevás desde un garage hasta valer mil millones de dólares. Se juega en el navegador, en el celular o en la computadora, y una partida entera lleva
          entre diez y quince minutos.
        </p>

        <h2 className="mt-7 text-xl font-black">Los seis pasos</h2>
        <ol className="mt-3 space-y-4">
          {PASOS.map((p) => (
            <li key={p.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber text-sm font-black text-ink">{p.n}</span>
              <div>
                <h3 className="font-black">{p.t}</h3>
                <p className="text-[15px] leading-relaxed text-ink/70">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-8 text-xl font-black">Los errores que más matan</h2>
        <ul className="mt-3 ml-4 list-disc space-y-2 text-[15px] leading-relaxed text-ink/75">
          <li>
            <b>Contratar antes de facturar.</b> Es la causa número uno de quiebra: siete personas cobrando sueldo contra ingresos de dos mil pesos por mes.
          </li>
          <li>
            <b>Mudarte de oficina porque hay plata en la caja.</b> Esa plata dura tres meses y el alquiler es para siempre.
          </li>
          <li>
            <b>Dejar al equipo sin nada que construir.</b> Si no elegís la próxima feature, los agentes cobran igual y no producen.
          </li>
          <li>
            <b>Ignorar la deuda técnica.</b> Cuanto más código escriben los agentes sin supervisión, más se cae la aplicación en producción.
          </li>
          <li>
            <b>No levantar la ronda cuando ya podés.</b> Es lo que salva a la mayoría de las partidas que terminan en quiebra.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-black">Preguntas frecuentes</h2>
        <div className="mt-3 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q}>
              <h3 className="font-black">{f.q}</h3>
              <p className="text-[15px] leading-relaxed text-ink/70">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border-2 border-amber bg-amber/15 p-4 text-center">
          <p className="font-black">¿Listo para fundar la tuya?</p>
          <Link href="/play" className="btn mt-3 border-ink bg-amber px-5 py-3 text-base text-ink">
            🚀 Crear mi startup
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
