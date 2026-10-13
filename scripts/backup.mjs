#!/usr/bin/env node
/**
 * Writes every row in the project to backups/uxkith-<timestamp>.json.
 *
 * The Supabase free plan has no automated backups and no point-in-time
 * recovery, so this file is the only copy of the data that exists anywhere
 * outside the live database. Run it before any migration, and daily in the
 * run-up to the event.
 *
 *   node scripts/backup.mjs
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY, read from .env.local or the environment.
 * It is a service-role key: it bypasses row-level security, which is the
 * point here and the reason it must never be committed or pasted anywhere.
 * .env.local and backups/ are both gitignored.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fromEnvFile(name) {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return undefined;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const at = line.indexOf("=");
    if (at === -1 || line.trimStart().startsWith("#")) continue;
    if (line.slice(0, at).trim() === name) {
      return line
        .slice(at + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fromEnvFile("NEXT_PUBLIC_SUPABASE_URL");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fromEnvFile("SUPABASE_SERVICE_ROLE_KEY");

if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not set (.env.local or environment).");
  process.exit(1);
}
if (!key) {
  console.error(
    [
      "SUPABASE_SERVICE_ROLE_KEY is not set.",
      "",
      "Supabase dashboard -> Project Settings -> API -> service_role key.",
      "Add it to .env.local (already gitignored) as:",
      "",
      "  SUPABASE_SERVICE_ROLE_KEY=...",
      "",
      "Never commit it and never paste it into a chat.",
    ].join("\n"),
  );
  process.exit(1);
}

// Ordered so a restore can run top to bottom without breaking foreign keys.
const TABLES = [
  "profiles",
  "interests",
  "matches",
  "messages",
  "dismissals",
  "blocks",
  "reports",
  "quiz_scores",
];

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function table(name) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${url}/rest/v1/${name}?select=*`, {
      headers: { ...headers, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/** Emails live in auth, not in a public table, and a restore needs the mapping. */
async function authUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    if (!res.ok) throw new Error(`auth users: ${res.status} ${await res.text()}`);
    const body = await res.json();
    const batch = body.users ?? [];
    users.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        provider: u.app_metadata?.provider,
      })),
    );
    if (batch.length < 200) return users;
  }
}

const snapshot = { taken_at: new Date().toISOString(), source: url, auth_users: await authUsers() };
for (const name of TABLES) snapshot[name] = await table(name);

mkdirSync(join(root, "backups"), { recursive: true });
const stamp = snapshot.taken_at.replace(/[:.]/g, "-");
const out = join(root, "backups", `uxkith-${stamp}.json`);
writeFileSync(out, JSON.stringify(snapshot, null, 2), "utf8");

const counts = Object.fromEntries(
  ["auth_users", ...TABLES].map((k) => [k, snapshot[k].length]),
);
console.log("wrote", out);
console.table(counts);

if (counts.profiles === 0) {
  console.error("\nprofiles came back empty — treat this file as suspect, not a backup.");
  process.exit(1);
}
