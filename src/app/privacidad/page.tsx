import type { Metadata } from "next";
import Link from "next/link";
import { CONTACTO, H2, LegalLayout, UL } from "../_legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda Vibe Coding Game, para qué los usa y cómo pedir que se borren.",
};

export default function Privacidad() {
  return (
    <LegalLayout titulo="Política de privacidad">
      <p>
        Vibe Coding Game es un juego gratuito de navegador. Esta página explica, en criollo, qué datos se guardan, para qué y cómo pedir que se borren. El
        responsable es Ignacio Olivieri, y podés escribir a <a className="underline" href={`mailto:${CONTACTO}`}>{CONTACTO}</a> por cualquier tema de este texto.
      </p>

      <H2>Si jugás sin cuenta</H2>
      <p>
        No se guarda nada en ningún servidor. La partida vive en el almacenamiento local de tu navegador, en tu dispositivo. Si borrás los datos del navegador,
        se pierde. No hace falta dar ningún dato personal para jugar.
      </p>

      <H2>Si entrás con Google</H2>
      <p>Entrar es opcional y sirve para competir con otras personas. En ese caso se guarda:</p>
      <UL>
        <li>
          <b>De tu cuenta de Google:</b> tu dirección de correo, tu nombre y tu foto de perfil. Nada más: el juego no pide acceso a tus contactos, tu agenda ni
          tus archivos.
        </li>
        <li>
          <b>De tu partida:</b> el nombre de tu startup, el sector, tus métricas del juego (usuarios, facturación, valuación, día) y el estado completo de la
          partida, para que puedas seguir desde otro dispositivo.
        </li>
        <li>
          <b>De lo que hacés con otros:</b> lo que publicás en el muro, los &laquo;me gusta&raquo; y las acciones hacia otras startups, como invertir o dar hype.
        </li>
      </UL>

      <H2>Qué es público</H2>
      <p>
        Esto es importante: el juego tiene un ranking y un muro. <b>Tu nombre, tu foto, el nombre de tu startup y tus métricas los ve cualquier persona que
        entre</b>, igual que lo que publiques en el muro. Tu dirección de correo <b>no</b> se muestra a nadie. Si preferís no aparecer, jugá sin cuenta.
      </p>

      <H2>Para qué se usan</H2>
      <p>
        Únicamente para que el juego funcione: guardar tu partida, armar el ranking, mostrar el muro y permitir las interacciones entre jugadores. No se venden
        ni se ceden a terceros, y no se usan para publicidad.
      </p>

      <H2>Quién más interviene</H2>
      <UL>
        <li><b>Google</b> valida tu identidad cuando entrás con tu cuenta.</li>
        <li><b>Supabase</b> es donde viven la base de datos y las sesiones.</li>
        <li><b>Vercel</b> aloja el sitio y mide visitas de forma anónima y agregada, sin perfilarte ni seguirte por otros sitios.</li>
      </UL>

      <H2>Cookies</H2>
      <p>
        Solo se usan las necesarias para mantener tu sesión abierta si entraste con Google. No hay cookies de publicidad ni de seguimiento.
      </p>

      <H2>Cuánto tiempo se guarda</H2>
      <p>Mientras tengas la cuenta activa. Si pedís que se borre, se elimina todo lo asociado a tu usuario.</p>

      <H2>Cómo borrar tus datos</H2>
      <p>
        Escribinos a <a className="underline" href={`mailto:${CONTACTO}`}>{CONTACTO}</a> desde la misma dirección con la que entraste y se elimina tu perfil,
        tu partida y tus publicaciones. También podés revocar el acceso del juego desde la configuración de tu cuenta de Google.
      </p>

      <H2>Menores</H2>
      <p>El juego no está pensado para menores de 13 años y no se recopilan datos de forma consciente de esa franja.</p>

      <H2>Cambios</H2>
      <p>
        Si esto cambia, se actualiza la fecha de arriba. Podés ver también los <Link className="underline" href="/terminos">términos del servicio</Link>.
      </p>
    </LegalLayout>
  );
}
