#!/usr/bin/env node
/**
 * Runs the notify-backlog function: one catch-up email per person holding
 * unanswered invites.
 *
 *   node scripts/send-backlog.mjs                      # dry run, sends nothing
 *   node scripts/send-backlog.mjs --sample you@mail    # one specimen, to you
 *   node scripts/send-backlog.mjs --confirm            # the real thing, once
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from .env.local and never prints it. That
 * key is the function's only gate, so this script is the only way to fire it.
 */

import { readFileSync, existsSync } from "node:fs";
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
      return line.slice(at + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fromEnvFile("NEXT_PUBLIC_SUPABASE_URL");
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fromEnvFile("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !service) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const sampleAt = args.indexOf("--sample");
const body =
  sampleAt !== -1
    ? { sample_to: args[sampleAt + 1] }
    : args.includes("--confirm")
      ? { confirm: true }
      : {};

if (!body.sample_to && !body.confirm) {
  console.log("DRY RUN — nothing will be sent. Add --confirm to send for real.\n");
}

const res = await fetch(`${url}/functions/v1/notify-backlog`, {
  method: "POST",
  headers: {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

console.log(`HTTP ${res.status}\n`);
console.log(await res.text());

if (!res.ok) process.exit(1);
