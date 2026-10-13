#!/usr/bin/env node
/**
 * Event-day verification, end to end, against production.
 *
 * 1. Is EVENT_DAY_ENABLED actually live? Signs in as a throwaway user and
 *    fetches the real /home, looking for the "I'm here" button. The flag is a
 *    module constant, so a Vercel env change without a redeploy leaves it off
 *    and this is the only way to be sure.
 * 2. Does the arrival email send? Gives the throwaway a mutual match, flips
 *    is_here, calls notify-here, and reports what the transport said.
 *
 * The one email this can produce goes to the address passed as argv[2],
 * which defaults to the project owner. No attendee is touched, and both
 * throwaway accounts are deleted at the end.
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
const APP = process.argv[3] ?? "https://uxkith.vercel.app";
const INBOX = process.argv[2] ?? "deeprajk078@gmail.com";
const ref = new URL(url).hostname.split(".")[0];

const admin = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const created = [];

async function api(path, init = {}) {
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
  const r = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`create ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  created.push(r.body.id);
  return r.body.id;
}

/** How @supabase/ssr stores a session: base64- prefix, chunked past ~3180 chars. */
function sessionCookies(session) {
  const value = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64");
  const name = `sb-${ref}-auth-token`;
  if (value.length <= 3180) return [`${name}=${value}`];
  const parts = [];
  for (let i = 0; i * 3180 < value.length; i += 1) {
    parts.push(`${name}.${i}=${value.slice(i * 3180, (i + 1) * 3180)}`);
  }
  return parts;
}

try {
  const password = `Check-${randomUUID()}`;
  const email = `uxkith-eventday-${Date.now()}@example.invalid`;

  console.log("setting up a throwaway attendee and a partner");
  const me = await makeUser(email, password);
  const partner = await makeUser(INBOX, `Check-${randomUUID()}`);
  await api(`/rest/v1/profiles?id=eq.${me}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ full_name: "Event day check", has_invite: true, onboarded_at: new Date().toISOString() }),
  });
  await api(`/rest/v1/profiles?id=eq.${partner}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ full_name: "Event day partner", has_invite: true, onboarded_at: new Date().toISOString() }),
  });

  const tok = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await tok.json();
  if (!session.access_token) throw new Error(`no token: ${JSON.stringify(session)}`);

  console.log("\n--- 1. is the event-day flag live on production? ---");
  const page = await fetch(`${APP}/home`, {
    headers: { Cookie: sessionCookies(session).join("; ") },
    redirect: "manual",
  });
  console.log(`   GET ${APP}/home -> ${page.status}`);

  if (page.status >= 300 && page.status < 400) {
    console.log(`   redirected to ${page.headers.get("location")} — the cookie was not accepted,`);
    console.log("   so this check is inconclusive. Look at /home in your own browser instead.");
  } else {
    const html = await page.text();
    const here = /I&rsquo;m here|I'm here|I’m here/.test(html);
    const own = html.includes("YOU") || html.includes("on the list");
    console.log(`   signed-in page rendered: ${own ? "yes" : "no"}`);
    console.log(`   "I'm here" button present: ${here ? "YES — flag is live" : "NO — flag not taking effect"}`);
  }

  console.log("\n--- 2. does the arrival email send? ---");
  await api("/rest/v1/interests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      { from_user: me, to_user: partner },
      { from_user: partner, to_user: me },
    ]),
  });
  const m = await api(`/rest/v1/matches?select=id,active&user_a=eq.${me < partner ? me : partner}`);
  console.log(`   match created: ${Array.isArray(m.body) && m.body.length ? "yes" : "no"}`);

  await api(`/rest/v1/profiles?id=eq.${me}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_here: true, here_at: new Date().toISOString() }),
  });

  const fn = await fetch(`${url}/functions/v1/notify-here`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const out = await fn.text();
  console.log(`   notify-here -> HTTP ${fn.status}  ${out}`);
  if (out.includes('"sent":1')) console.log(`   ARRIVAL EMAIL SENT. Check ${INBOX}.`);
  else console.log("   did not send — see the body above");
} catch (error) {
  console.error("\ncheck failed:", error.message);
} finally {
  console.log("\ncleaning up");
  for (const id of created) {
    const r = await api(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
    console.log(`   deleted ${id}: ${r.ok ? "ok" : `FAILED ${r.status}`}`);
  }
}
