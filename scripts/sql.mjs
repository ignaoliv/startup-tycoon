/**
 * Corre una consulta contra la base del proyecto usando la Management API.
 * Necesita un Personal Access Token en ~/.supabase_token (nunca en el repo).
 *
 *   node scripts/sql.mjs "select * from feedback order by created_at desc"
 *   node scripts/sql.mjs -f supabase/leer-feedback.sql
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

const args = process.argv.slice(2);
const query = args[0] === "-f" ? await readFile(args[1], "utf8") : args.join(" ");
if (!query.trim()) {
  console.error('Uso: node scripts/sql.mjs "select ..."  |  node scripts/sql.mjs -f archivo.sql');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Error ${res.status}: ${body}`);
  process.exit(1);
}
console.log(body);
