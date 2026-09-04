/**
 * Corre supabase/schema.sql en el proyecto usando la Management API.
 * Necesita un Personal Access Token guardado en ~/.supabase_token
 * (se saca en https://supabase.com/dashboard/account/tokens).
 *
 *   node scripts/run-schema.mjs [archivo]   (por defecto supabase/schema.sql)
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const REF = "vfaleyqjssdcvskwscxj";

const token = (await readFile(join(homedir(), ".supabase_token"), "utf8").catch(() => "")).trim();
if (!token) {
  console.error("Falta el token. Guardalo así:\n  echo 'sbp_...' > ~/.supabase_token && chmod 600 ~/.supabase_token");
  process.exit(1);
}

const archivo = process.argv[2] ?? "supabase/schema.sql";
const sql = await readFile(new URL(`../${archivo}`, import.meta.url), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Error ${res.status}: ${body}`);
  process.exit(1);
}
console.log(`${archivo} aplicado.`);
console.log(body.slice(0, 400));
