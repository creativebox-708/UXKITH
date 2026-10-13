#!/usr/bin/env node
/**
 * Proves the live notify-interest function can actually deliver an email.
 *
 * Creates two throwaway auth users, makes a real invite between them, calls the
 * deployed function as the sender, prints what the transport reported, then
 * deletes both. The recipient address is deliberately the project owner's own
 * inbox, so the only message this sends goes to you.
 *
 *   node scripts/smtp-probe.mjs
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from .env.local and never prints it.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

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
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fromEnvFile("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fromEnvFile("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !service || !anon) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Where the one test email goes. Your own address, not an attendee's.
const INBOX = process.argv[2] ?? "deeprajk078@gmail.com";

const admin = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const created = [];

async function call(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...admin, ...init.headers } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function makeUser(email, password) {
  const r = await call("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`create ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  created.push(r.body.id);
  return r.body.id;
}

async function cleanup() {
  for (const id of created) {
    const r = await call(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
    console.log(`  deleted ${id}: ${r.ok ? "ok" : `FAILED ${r.status}`}`);
  }
}

try {
  const password = `Probe-${randomUUID()}`;
  const senderEmail = `uxkith-probe-${Date.now()}@example.invalid`;

  console.log("1. creating a throwaway sender and recipient");
  const sender = await makeUser(senderEmail, password);
  const recipient = await makeUser(INBOX, `Probe-${randomUUID()}`);
  console.log(`   sender ${sender}`);
  console.log(`   recipient ${recipient}  ->  ${INBOX}`);

  console.log("2. giving the sender a name, so the email is not blank");
  await call(`/rest/v1/profiles?id=eq.${sender}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ full_name: "UXKITH delivery probe", headline: "Ignore me" }),
  });

  console.log("3. inserting a real invite row");
  const ins = await call("/rest/v1/interests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ from_user: sender, to_user: recipient }),
  });
  if (!ins.ok) throw new Error(`interest: ${ins.status} ${JSON.stringify(ins.body)}`);

  console.log("4. signing in as the sender to get a real user token");
  const tok = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: senderEmail, password }),
  });
  const session = await tok.json();
  if (!session.access_token) {
    throw new Error(
      `could not get a token (${tok.status}): ${JSON.stringify(session)}\n` +
        "If email/password sign-in is disabled on the project, that is expected — " +
        "fire one invite from the app instead and read the function logs.",
    );
  }

  console.log("5. calling the deployed notify-interest as that user");
  const fn = await fetch(`${url}/functions/v1/notify-interest`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toUser: recipient }),
  });
  const out = await fn.text();
  console.log(`\n   HTTP ${fn.status}`);
  console.log(`   ${out}\n`);

  if (fn.ok && out.includes('"via":"smtp"')) {
    console.log(`SMTP WORKS. Check ${INBOX} — the email is on its way.`);
  } else if (out.includes('"via":"resend"')) {
    console.log("Sent, but via Resend — SMTP_USER/SMTP_PASSWORD were not picked up.");
  } else {
    console.log("DID NOT SEND. The function log will say why; the reason is in the body above.");
  }
} catch (error) {
  console.error("\nprobe failed:", error.message);
} finally {
  console.log("\n6. cleaning up");
  await cleanup();
}
