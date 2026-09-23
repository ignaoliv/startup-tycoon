import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { SITIO } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Qué son las vibecoins",
  description:
    "Las vibecoins se ganan jugando y se gastan votando los proyectos de otros vibecoders. Cómo se ganan, cuánto vale cada voto y por qué funciona así.",
  alternates: { canonical: "/vibecoins" },
  openGraph: {
    title: "Qué son las vibecoins",
    description: "Se ganan jugando y se gastan votando proyectos. Por qué votar cuesta jugar.",
    url: `${SITIO}/vibecoins`,
  },
};

const COMO_SE_GANAN = [
  { q: "Terminás una partida", a: "1 vibecoin", d: "No importa cómo termine: quiebra, te echan, se acaba el tiempo." },
  { q: "Ganás la partida", a: "2 vibecoins", d: "Salir a bolsa o que te compren." },
  { q: "Invitás a alguien", a: "5 vibecoins", d: "Se acreditan cuando esa persona termina su primera partida." },
];

export default function Vibecoins() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt="Vibe Coding Game" width={596} height={160} className="h-8 w-auto sm:h-10" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/proyectos" className="btn border-ink/25 bg-white px-3 py-2 text-sm">
            🛠️ <span className="hidden sm:inline">Proyectos</span>
          </Link>
          <Link href="/play" className="btn border-ink bg-amber px-3 py-2 text-sm text-ink">
            🚀 Jugar
          </Link>
        </div>
      </header>

      <article className="prose-sm">
        <h1 className="text-3xl font-black leading-tight">Qué son las vibecoins</h1>
        <p className="mt-2 text-base text-ink/70">
          Se ganan jugando y se gastan votando los proyectos de otros. Nada más: no se compran, no se transfieren y no
          valen plata.
        </p>

        <h2 className="mt-8 text-xl font-black">Cómo se ganan</h2>
        <ul className="mt-3 space-y-2">
          {COMO_SE_GANAN.map((x) => (
            <li key={x.q} className="flex items-start gap-3 rounded-xl border-2 border-ink/10 bg-white p-3">
              <span className="mt-0.5 text-xl leading-none">🪙</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black">
                  {x.q} <span className="text-amber">· {x.a}</span>
                </div>
                <div className="text-[13px] text-ink/60">{x.d}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-ink/55">
          Las partidas abandonadas no cuentan, y las anteriores al 22 de septiembre de 2026 tampoco: las monedas
          arrancaron ese día y todos empezamos en cero.
        </p>

        <h2 className="mt-8 text-xl font-black">En qué se gastan</h2>
        <p className="mt-2 text-[15px] text-ink/75">
          En votar proyectos. Cada voto cuesta una moneda, y podés darle{" "}
          <b>hasta tres a un mismo proyecto</b>. Las que ganás invitando gente no tienen ese tope: esas van donde
          quieras, incluso a uno que ya votaste.
        </p>

        <h2 className="mt-8 text-xl font-black">Por qué funciona así</h2>
        <p className="mt-2 text-[15px] text-ink/75">
          Porque en cualquier ranking votado, el que gana termina siendo el que tiene más amigos, no el que hizo algo
          mejor. Y cuando eso pasa una vez, el resto deja de participar.
        </p>
        <p className="mt-3 text-[15px] text-ink/75">
          Acá votar cuesta jugar. Si querés que tu proyecto suba, la gente que traés tiene que terminar una partida para
          poder votarte. Eso convierte el pedido de votos en algo que aporta, en vez de clicks que entran y se van.
        </p>
        <p className="mt-3 text-[15px] text-ink/75">
          El tope de tres es por lo mismo: obliga a repartir, así el podio no lo decide una sola persona con muchas
          monedas.
        </p>

        <h2 className="mt-8 text-xl font-black">Dónde las veo</h2>
        <p className="mt-2 text-[15px] text-ink/75">
          En tu perfil, entrando con Google. Ahí también está tu link para invitar y el formulario para sumar tu
          proyecto.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/home" className="btn border-ink bg-indigo px-4 py-2.5 text-sm text-white">
            Ver mis vibecoins
          </Link>
          <Link href="/proyectos" className="btn border-ink/25 bg-white px-4 py-2.5 text-sm">
            Ver los proyectos
          </Link>
        </div>

        <h2 className="mt-9 text-xl font-black">Preguntas sueltas</h2>
        <dl className="mt-3 space-y-3">
          {[
            ["¿Puedo votar mi propio proyecto?", "No."],
            ["¿Se pueden comprar?", "No. La única forma de conseguirlas es jugando o invitando."],
            [
              "¿Me sirve inventar cuentas para autoinvitarme?",
              "No rinde: las cinco monedas se acreditan recién cuando esa cuenta termina una partida entera, y eso lleva entre doce y treinta minutos reales.",
            ],
            ["¿Puedo recuperar una moneda que gasté?", "No, el voto no se deshace."],
            ["¿Valen plata?", "No, y no está previsto que valgan."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border-2 border-ink/10 bg-white p-3">
              <dt className="text-sm font-black">{q}</dt>
              <dd className="mt-0.5 text-[13px] text-ink/65">{a}</dd>
            </div>
          ))}
        </dl>
      </article>

      <div className="mt-8">
        <SiteFooter />
      </div>
    </main>
  );
}
