import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/**
 * "Config is tomorrow." One reminder to every signed-up member, the evening
 * before the event, personalised with who is waiting for them.
 *
 * Owner-only, gated the same way as notify-backlog: the caller's key must be
 * able to list auth users, which only an admin (service-role) key can do.
 *
 * Defaults to a dry run. Body options:
 *   {}                               -> dry run: who would get what, nothing sent
 *   { "sample_to": "you@x.com" }     -> one specimen to that address only
 *   { "confirm": true }              -> send to every member, once
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://uxkith.vercel.app";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
const FROM = Deno.env.get("EMAIL_FROM") ?? (SMTP_USER ? `UXKITH <${SMTP_USER}>` : null);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Personal = { firstName: string; waiting: number; matches: number };

function subjectFor(p: Personal) {
  if (p.waiting > 0) {
    return p.waiting === 1
      ? "Config is tomorrow. Someone wants to meet you"
      : `Config is tomorrow. ${p.waiting} people want to meet you`;
  }
  if (p.matches > 0) return "Config is tomorrow. Your matches will be there";
  return "Config is tomorrow. Find your people before you arrive";
}

function statusLine(p: Personal) {
  const parts: string[] = [];
  if (p.waiting > 0) {
    parts.push(
      p.waiting === 1
        ? "<strong>1 person</strong> wants to meet you and is waiting for you to tap back"
        : `<strong>${p.waiting} people</strong> want to meet you and are waiting for you to tap back`,
    );
  }
  if (p.matches > 0) {
    parts.push(
      p.matches === 1
        ? "you have <strong>1 match</strong> with an open chat"
        : `you have <strong>${p.matches} matches</strong> with open chats`,
    );
  }
  if (!parts.length) {
    return "Nobody has tagged you yet, which usually means nobody has seen you yet. Tap &ldquo;Interested to meet&rdquo; on a few people tonight and they will hear about it.";
  }
  const joined = parts.join(", and ");
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
}

function statusText(p: Personal) {
  return statusLine(p).replace(/<\/?strong>/g, "").replace(/&ldquo;|&rdquo;/g, '"');
}

function template(p: Personal) {
  const name = escapeHtml(p.firstName);
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f6f3ee;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">India's first Config is tomorrow. Here is who is waiting for you.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;color:#8b8598;text-transform:uppercase;">UXKITH &middot; Config India 2026</p>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#15131a;font-weight:600;">${name}, Config is tomorrow</h1>
        </td></tr>
        <tr><td style="padding:16px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#45414f;">
            India's first Config is on <strong>Thursday 15 October</strong> at BIEC, Bengaluru. One day, thousands of designers.
          </p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#45414f;">${statusLine(p)}</p>
        </td></tr>
        <tr><td style="padding:20px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#faf8f5;border:1px solid #eee9e1;border-radius:12px;">
            <tr><td style="padding:14px 18px;font-size:14px;line-height:1.7;color:#45414f;">
              <strong style="color:#15131a;">Tonight:</strong> tag the people you want to find, and tap back on anyone waiting.<br>
              <strong style="color:#15131a;">Tomorrow:</strong> tap &ldquo;I&rsquo;m here &#128075;&rdquo; when you arrive, so your matches know to look for you.
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          <a href="${APP_URL}/home" style="display:block;background:#ff5c38;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:600;">Open UXKITH</a>
        </td></tr>
        <tr><td style="padding:22px 28px 28px;">
          <p style="margin:0;border-top:1px solid #eee9e1;padding-top:16px;font-size:12px;line-height:1.6;color:#9c96a6;">
            You are getting this one reminder because you signed in to UXKITH with LinkedIn for Config India 2026. No phone numbers are ever collected or shared, and you can delete your account and all of this data from Settings. UXKITH is independent and not affiliated with or endorsed by Figma.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function textFor(p: Personal) {
  return `${p.firstName}, Config is tomorrow.

India's first Config is on Thursday 15 October at BIEC, Bengaluru.

${statusText(p)}

Tonight: tag the people you want to find, and tap back on anyone waiting.
Tomorrow: tap "I'm here" when you arrive, so your matches know to look for you.

${APP_URL}/home

You are getting this one reminder because you signed in to UXKITH with LinkedIn. No phone numbers are ever collected or shared.`;
}

function smtp() {
  return new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER!, password: SMTP_PASSWORD! },
    },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "forbidden" }, 403);
  const caller = createClient(SUPABASE_URL, token, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const probe = await caller.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (probe.error) return json({ error: "forbidden", detail: "not an admin key" }, 403);

  let confirm = false;
  let sampleTo: string | undefined;
  try {
    ({ confirm = false, sample_to: sampleTo } = await req.json());
  } catch {
    // No body means dry run.
  }

  if ((confirm || sampleTo) && (!FROM || !SMTP_USER || !SMTP_PASSWORD)) {
    return json({ error: "smtp_not_configured" }, 500);
  }

  if (sampleTo) {
    const specimen: Personal = { firstName: "Ananya", waiting: 3, matches: 2 };
    const client = smtp();
    try {
      await client.send({
        from: FROM!,
        to: sampleTo,
        subject: `[sample] ${subjectFor(specimen)}`,
        content: textFor(specimen),
        html: template(specimen),
      });
      return json({ sample_sent_to: sampleTo });
    } catch (error) {
      return json({ error: "sample_failed", detail: String(error) }, 502);
    } finally {
      try {
        await client.close();
      } catch {
        // Already sent.
      }
    }
  }

  const [interests, profiles, dismissals, blocks, matches] = await Promise.all([
    admin.from("interests").select("from_user, to_user"),
    admin.from("profiles").select("id, full_name"),
    admin.from("dismissals").select("user_id, dismissed_user"),
    admin.from("blocks").select("blocker, blocked"),
    admin.from("matches").select("user_a, user_b").eq("active", true),
  ]);
  if (interests.error || profiles.error || matches.error) {
    return json({ error: "read_failed" }, 500);
  }

  const pairs = new Set((interests.data ?? []).map((i) => `${i.from_user}>${i.to_user}`));
  const dismissed = new Set((dismissals.data ?? []).map((d) => `${d.user_id}>${d.dismissed_user}`));
  const blocked = new Set(
    (blocks.data ?? []).flatMap((b) => [`${b.blocker}>${b.blocked}`, `${b.blocked}>${b.blocker}`]),
  );

  const waiting = new Map<string, number>();
  for (const i of interests.data ?? []) {
    if (pairs.has(`${i.to_user}>${i.from_user}`)) continue;
    if (dismissed.has(`${i.to_user}>${i.from_user}`)) continue;
    if (blocked.has(`${i.to_user}>${i.from_user}`)) continue;
    waiting.set(i.to_user, (waiting.get(i.to_user) ?? 0) + 1);
  }
  const matchCount = new Map<string, number>();
  for (const m of matches.data ?? []) {
    matchCount.set(m.user_a, (matchCount.get(m.user_a) ?? 0) + 1);
    matchCount.set(m.user_b, (matchCount.get(m.user_b) ?? 0) + 1);
  }

  const people = (profiles.data ?? []).map((p) => {
    const full = (p.full_name as string | null)?.trim() || "there";
    return {
      id: p.id as string,
      name: full,
      personal: {
        firstName: full.split(/\s+/)[0],
        waiting: waiting.get(p.id) ?? 0,
        matches: matchCount.get(p.id) ?? 0,
      } satisfies Personal,
    };
  });

  if (!confirm) {
    return json({
      dry_run: true,
      recipients: people.length,
      plan: people.map((p) => ({
        to: p.name,
        subject: subjectFor(p.personal),
        waiting: p.personal.waiting,
        matches: p.personal.matches,
      })),
      note: 'Nothing was sent. Pass {"confirm": true} to send one reminder to each member.',
    });
  }

  const client = smtp();
  const results: { to: string; status: string }[] = [];
  let sent = 0;
  try {
    for (const p of people) {
      const { data: account } = await admin.auth.admin.getUserById(p.id);
      const email = account?.user?.email;
      if (!email) {
        results.push({ to: p.name, status: "no_email" });
        continue;
      }
      try {
        await client.send({
          from: FROM!,
          to: email,
          subject: subjectFor(p.personal),
          content: textFor(p.personal),
          html: template(p.personal),
        });
        sent += 1;
        results.push({ to: p.name, status: "sent" });
      } catch (error) {
        results.push({ to: p.name, status: `failed: ${error}` });
      }
      // Gentle on Gmail, which throttles a tight loop.
      await new Promise((r) => setTimeout(r, 1200));
    }
  } finally {
    try {
      await client.close();
    } catch {
      // Everything is already sent by here.
    }
  }

  return json({ dry_run: false, recipients: people.length, sent, results });
});
