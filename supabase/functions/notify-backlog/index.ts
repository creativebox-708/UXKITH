import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/**
 * One catch-up email per person who has unanswered invites.
 *
 * Every invite before today was accepted by the database and then never
 * announced, because no transport was configured. The per-invite emails are
 * gone — they were skipped, not queued — so this clears the backlog once:
 * one message per person saying how many are waiting, not one per invite.
 *
 * Owner-only. The caller must present the service-role key, which is a
 * deliberately blunt gate: this sends mail to real people and no signed-in
 * attendee should be able to trigger it.
 *
 * Defaults to a dry run. Pass { "confirm": true } to actually send, or
 * { "sample_to": "you@example.com" } to post a single specimen to yourself
 * without touching anybody else.
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

function template(names: string[]) {
  const count = names.length;
  const who = names.map(escapeHtml);
  const list =
    who.length === 1
      ? who[0]
      : `${who.slice(0, -1).join(", ")} and ${who[who.length - 1]}`;
  const headline =
    count === 1 ? "Someone wants to meet you at Config" : `${count} people want to meet you at Config`;

  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f6f3ee;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${list} said they would like to meet you on Thursday.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;color:#8b8598;text-transform:uppercase;">UXKITH &middot; Config India 2026</p>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#15131a;font-weight:600;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:18px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#45414f;">
            ${list} tapped &ldquo;Interested to meet&rdquo; on your card. You should have heard when it happened and did not &mdash; the notification emails were not working. That is on us, not on them.
          </p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#45414f;">
            Config is on <strong>Thursday 15 October</strong>. If you would like to meet any of them, tap back and a chat opens between the two of you.
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          <a href="${APP_URL}/home" style="display:block;background:#ff5c38;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:600;">See who is waiting</a>
        </td></tr>
        <tr><td style="padding:22px 28px 28px;">
          <p style="margin:0;border-top:1px solid #eee9e1;padding-top:16px;font-size:12px;line-height:1.6;color:#9c96a6;">
            This is a signal, not an obligation &mdash; ignoring it is a perfectly good answer and nobody is told either way. You are getting this once, because you signed in to UXKITH with LinkedIn. No phone numbers are ever collected or shared, and you can delete your account and all of this data from Settings.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Owner-only, proved by capability rather than by string equality: the
  // caller's own key has to be able to list auth users, which nothing short of
  // an admin key can do. Comparing against SUPABASE_SERVICE_ROLE_KEY looked
  // simpler and was wrong — a project can hold more than one valid admin key,
  // and rotating one would silently lock this out.
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
    // No body means dry run, which is the safe default.
  }

  // A specimen of the real thing, with invented names, to one address.
  if (sampleTo) {
    if (!FROM || !SMTP_USER || !SMTP_PASSWORD) {
      return json({ error: "smtp_not_configured" }, 500);
    }
    const names = ["Ananya Krishnamurthy", "Kotresh Deshagati", "Nikunj Dudhat"];
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: { username: SMTP_USER, password: SMTP_PASSWORD },
      },
    });
    try {
      await client.send({
        from: FROM,
        to: sampleTo,
        subject: `[sample] ${names.length} people want to meet you at Config`,
        content: `${names.join(", ")} tapped "Interested to meet" on your card. Sample only.`,
        html: template(names),
      });
      return json({ sample_sent_to: sampleTo, example_names: names });
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

  const [interests, profiles, dismissals, blocks] = await Promise.all([
    admin.from("interests").select("from_user, to_user"),
    admin.from("profiles").select("id, full_name"),
    admin.from("dismissals").select("user_id, dismissed_user"),
    admin.from("blocks").select("blocker, blocked"),
  ]);

  if (interests.error || profiles.error) {
    return json({ error: "read_failed", detail: interests.error ?? profiles.error }, 500);
  }

  const nameOf = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name as string]));
  const mutual = new Set((interests.data ?? []).map((i) => `${i.from_user}>${i.to_user}`));
  const dismissed = new Set(
    (dismissals.data ?? []).map((d) => `${d.user_id}>${d.dismissed_user}`),
  );
  const blocked = new Set(
    (blocks.data ?? []).flatMap((b) => [`${b.blocker}>${b.blocked}`, `${b.blocked}>${b.blocker}`]),
  );

  // Who is owed a nudge, and by whom.
  const waiting = new Map<string, string[]>();
  for (const i of interests.data ?? []) {
    const reciprocated = mutual.has(`${i.to_user}>${i.from_user}`);
    if (reciprocated) continue;
    if (dismissed.has(`${i.to_user}>${i.from_user}`)) continue;
    if (blocked.has(`${i.to_user}>${i.from_user}`)) continue;
    const list = waiting.get(i.to_user) ?? [];
    list.push(nameOf.get(i.from_user) ?? "Someone at Config");
    waiting.set(i.to_user, list);
  }

  if (!confirm) {
    return json({
      dry_run: true,
      people: waiting.size,
      invites: [...waiting.values()].reduce((n, l) => n + l.length, 0),
      plan: [...waiting.entries()].map(([id, names]) => ({
        to: nameOf.get(id) ?? id,
        waiting: names.length,
        from: names,
      })),
      note: 'Nothing was sent. Pass {"confirm": true} to send one email per person.',
    });
  }

  if (!FROM || !SMTP_USER || !SMTP_PASSWORD) {
    return json({ error: "smtp_not_configured" }, 500);
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER, password: SMTP_PASSWORD },
    },
  });

  const results: { to: string; waiting: number; status: string }[] = [];
  let sent = 0;

  try {
    for (const [id, names] of waiting) {
      const who = nameOf.get(id) ?? id;
      const { data: account } = await admin.auth.admin.getUserById(id);
      const email = account?.user?.email;
      if (!email) {
        results.push({ to: who, waiting: names.length, status: "no_email" });
        continue;
      }

      const subject =
        names.length === 1
          ? "Someone wants to meet you at Config"
          : `${names.length} people want to meet you at Config`;

      try {
        await client.send({
          from: FROM,
          to: email,
          subject,
          content: `${names.join(", ")} tapped "Interested to meet" on your card at Config India 2026.\n\nYou should have heard when it happened and did not - the notification emails were not working. Config is on Thursday 15 October. If you would like to meet any of them, tap back and a chat opens between you: ${APP_URL}/home\n\nThis is a signal, not an obligation.`,
          html: template(names),
        });
        sent += 1;
        results.push({ to: who, waiting: names.length, status: "sent" });
      } catch (error) {
        results.push({ to: who, waiting: names.length, status: `failed: ${error}` });
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

  return json({ dry_run: false, people: waiting.size, sent, results });
});
