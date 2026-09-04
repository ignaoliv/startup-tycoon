import type { Metadata } from "next";
import Link from "next/link";
import { CONTACTO, H2, LegalLayout, UL } from "../_legal";

export const metadata: Metadata = {
  title: "Términos del servicio",
  description: "Las reglas para usar Vibe Coding Game.",
};

export default function Terminos() {
  return (
    <LegalLayout titulo="Términos del servicio">
      <p>
        Estas son las reglas para usar Vibe Coding Game. Al jugar, las aceptás. Si algo no te cierra, escribinos a{" "}
        <a className="underline" href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
      </p>

      <H2>Qué es esto</H2>
      <p>
        Un juego gratuito de simulación donde fundás una startup imaginaria. Todo lo que pasa adentro es ficción: las empresas, los inversores, los eventos y el
        dinero del juego no existen fuera de la pantalla y no representan consejos de negocio ni de inversión.
      </p>

      <H2>Cuenta</H2>
      <UL>
        <li>Podés jugar sin cuenta. Entrar con Google es opcional y sirve para el ranking y la parte social.</li>
        <li>Sos responsable de lo que se haga desde tu cuenta.</li>
        <li>Tenés que tener al menos 13 años para usar el juego.</li>
      </UL>

      <H2>Cómo portarse en el muro</H2>
      <p>
        El muro y los nombres de startup son públicos. No se permite publicar insultos, discriminación, amenazas, spam, contenido sexual, datos personales de
        terceros ni suplantar a otra persona u organización. Se puede borrar contenido y suspender cuentas que no respeten esto, sin aviso previo.
      </p>

      <H2>Sin garantías</H2>
      <p>
        El juego se ofrece tal como está. Está en desarrollo activo: las reglas, el balance y las funciones pueden cambiar, y <b>tu partida puede perderse</b>
        por un error, una migración o un cambio de versión. No lo uses para nada que necesite ser permanente.
      </p>

      <H2>No hay plata real</H2>
      <p>
        Es gratis y no hay compras ni premios. El dinero, las valuaciones y las rondas son parte de la ficción y no tienen ningún valor fuera del juego.
      </p>

      <H2>Propiedad</H2>
      <p>
        El juego, su nombre, su logo y sus ilustraciones son de sus autores. Lo que vos escribís en el muro sigue siendo tuyo, pero nos das permiso para
        mostrarlo dentro del juego.
      </p>

      <H2>Baja</H2>
      <p>
        Podés dejar de jugar cuando quieras y pedir que se borre tu cuenta según lo que explica la{" "}
        <Link className="underline" href="/privacidad">política de privacidad</Link>.
      </p>

      <H2>Cambios</H2>
      <p>Si estas reglas cambian, se actualiza la fecha de arriba.</p>
    </LegalLayout>
  );
}
