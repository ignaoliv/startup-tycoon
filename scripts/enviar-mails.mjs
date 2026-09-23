/**
 * Envío por tandas con Resend.
 *
 * Corre desde tu máquina y no desde el servidor a propósito: así la clave de
 * servicio de Supabase nunca vive en producción, y vos ves y frenás cada tanda.
 *
 *   node scripts/enviar-mails.mjs --test tu@mail.com   # uno solo, a vos
 *   node scripts/enviar-mails.mjs --dry                # muestra a quién iría
 *   node scripts/enviar-mails.mjs                      # manda la tanda
 *
 * Necesita:
 *   RESEND_API_KEY en el entorno
 *   scripts/_destinatarios.json  (lo exportás del dashboard de Supabase)
 *   scripts/_enviados.json       (lo escribe este script, no lo borres)
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = new URL(".", import.meta.url).pathname;
const DESTINATARIOS = join(DIR, "_destinatarios.json");
const ENVIADOS = join(DIR, "_enviados.json");

const DE = "Nacho de Vibe Coding Game <hola@vibecodingame.com>";
const SITIO = "https://vibecodingame.com";
// el plan gratis de Resend son 100 por día; dejamos margen
const POR_TANDA = 90;

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const test = args.includes("--test") ? args[args.indexOf("--test") + 1] : null;

const clave = process.env.RESEND_API_KEY;
if (!clave && !dry) {
  console.error("Falta RESEND_API_KEY.\n  export RESEND_API_KEY=re_...");
  process.exit(1);
}

const leer = async (ruta, porDefecto) => {
  try {
    return JSON.parse(await readFile(ruta, "utf8"));
  } catch {
    return porDefecto;
  }
};

/** El mail. Texto y HTML dicen lo mismo: hay clientes que no muestran HTML. */
function armar({ display_name, baja_token }) {
  const nombre = (display_name ?? "").split(" ")[0] || "Hola";
  const baja = `${SITIO}/baja?t=${baja_token}`;
  const jugar = `${SITIO}/play?utm_source=mail&utm_medium=email&utm_campaign=nunca-ganaron`;

  const texto = `${nombre}, te escribo porque jugaste a Vibe Coding Game y no ganaste ninguna partida.

Puede que no haya sido culpa tuya.

Encontré tres cosas rotas y las arreglé:

- El board te pedía más usuarios de los que existían en el mercado. Pasando cierto punto la meta era matemáticamente inalcanzable, y te echaban al primer fallo. Uno de cada cuatro jugadores perdía por eso.
- Si dejabas el juego dos minutos, la partida seguía corriendo sola hasta 240 días. Mucha gente volvió a una empresa fundida sin haber tocado nada.
- Las ventanas del juego aparecían fuera de la pantalla si te tocaba el invierno de la industria, así que ni siquiera veías por qué habías perdido.

Tu partida sigue guardada donde la dejaste.

Jugar: ${jugar}

Y si querés, ahora podés sumar tu proyecto al perfil y aparecer en la lista de lo que está construyendo la gente que juega.

Nacho

Si no querés más mails: ${baja}`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#1f1b16;max-width:520px">
<p>${nombre}, te escribo porque jugaste a Vibe Coding Game y no ganaste ninguna partida.</p>
<p><b>Puede que no haya sido culpa tuya.</b></p>
<p>Encontré tres cosas rotas y las arreglé:</p>
<ul>
<li>El board te pedía <b>más usuarios de los que existían en el mercado</b>. Pasando cierto punto la meta era matemáticamente inalcanzable, y te echaban al primer fallo. Uno de cada cuatro jugadores perdía por eso.</li>
<li>Si dejabas el juego dos minutos, la partida <b>seguía corriendo sola hasta 240 días</b>. Mucha gente volvió a una empresa fundida sin haber tocado nada.</li>
<li>Las ventanas del juego aparecían fuera de la pantalla si te tocaba el invierno de la industria, así que ni siquiera veías por qué habías perdido.</li>
</ul>
<p>Tu partida sigue guardada donde la dejaste.</p>
<p><a href="${jugar}" style="display:inline-block;background:#f5b731;color:#1f1b16;font-weight:bold;text-decoration:none;padding:11px 20px;border-radius:10px;border:2px solid #1f1b16">Seguir jugando</a></p>
<p>Y si querés, ahora podés sumar tu proyecto al perfil y aparecer en la lista de lo que está construyendo la gente que juega.</p>
<p>Nacho</p>
<p style="font-size:12px;color:#8a837b;border-top:1px solid #e6e0d6;padding-top:12px;margin-top:24px">
Te llega esto porque entraste con Google a vibecodingame.com. <a href="${baja}" style="color:#8a837b">No quiero más mails</a>.
</p>
</div>`;

  return {
    subject: `${nombre}, puede que hayas perdido por un bug mío`,
    text: texto,
    html,
    // Gmail exige baja en un click para quien manda en volumen. Sin esto, la
    // gente que no quiere el mail marca spam en vez de darse de baja.
    headers: {
      "List-Unsubscribe": `<${baja}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

async function mandar(destino, cuerpo) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DE, to: [destino], ...cuerpo }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 160)}`);
  return json.id;
}

// --- prueba a una sola dirección -------------------------------------------
if (test) {
  const cuerpo = armar({ display_name: "Ignacio Olivieri", baja_token: "00000000-0000-0000-0000-000000000000" });
  console.log(`asunto: ${cuerpo.subject}\n`);
  if (dry) {
    console.log(cuerpo.text);
  } else {
    console.log("enviado:", await mandar(test, cuerpo));
  }
  process.exit(0);
}

// --- tanda -----------------------------------------------------------------
const destinatarios = await leer(DESTINATARIOS, null);
if (!Array.isArray(destinatarios)) {
  console.error(`Falta ${DESTINATARIOS}.\nExportá la consulta de supabase/mails.sql como JSON y guardala ahí.`);
  process.exit(1);
}

const enviados = await leer(ENVIADOS, {});
const pendientes = destinatarios.filter((d) => d.email && !enviados[d.email.toLowerCase()]);
const tanda = pendientes.slice(0, POR_TANDA);

console.log(`lista ${destinatarios.length} · ya enviados ${Object.keys(enviados).length} · pendientes ${pendientes.length}`);
console.log(`esta tanda: ${tanda.length}\n`);

if (dry) {
  for (const d of tanda.slice(0, 10)) console.log(`  ${d.email}  ${d.display_name ?? ""}`);
  if (tanda.length > 10) console.log(`  ... y ${tanda.length - 10} más`);
  console.log("\n(--dry: no se mandó nada)");
  process.exit(0);
}

let ok = 0;
for (const d of tanda) {
  const clave_ = d.email.toLowerCase();
  try {
    const id = await mandar(d.email, armar(d));
    enviados[clave_] = { id, at: new Date().toISOString() };
    ok++;
    process.stdout.write(`  ✓ ${d.email}\n`);
  } catch (e) {
    enviados[clave_] = { error: String(e.message).slice(0, 200), at: new Date().toISOString() };
    process.stdout.write(`  ✗ ${d.email}  ${e.message}\n`);
  }
  // el plan gratis limita por segundo además de por día
  await new Promise((r) => setTimeout(r, 600));
  await writeFile(ENVIADOS, JSON.stringify(enviados, null, 1));
}

console.log(`\nmandados ${ok} de ${tanda.length}. Quedan ${pendientes.length - tanda.length}.`);
