import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/**
 * "[Name] is at Config now."
 *
 * Called on event day when someone taps "I'm here". Only their active mutual
 * matches hear about it, and only if the profile really is flagged as here.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://uxkith.vercel.app";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

/** Gmail insists the sender is the account that authenticated. */
const FROM = Deno.env.get("EMAIL_FROM") ?? (SMTP_USER ? `UXKITH <${SMTP_USER}>` : null);

type Outcome = { ok: boolean; via: string; error?: string };

/**
 * SMTP first, Resend second.
 *
 * SMTP needs nothing but a mailbox that already exists and an app password,
 * which is why it leads: Resend refuses to deliver to anyone but the account
 * owner until a domain is verified, and there is no domain. Both are optional,
 * and with neither configured this logs and skips rather than failing the tap
 * that triggered it.
 */
async function sendEmail(mail: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<Outcome> {
  if (!FROM) return { ok: false, via: "none", error: "no sender configured" };

  if (SMTP_USER && SMTP_PASSWORD) {
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
        to: mail.to,
        subject: mail.subject,
        content: mail.text,
        html: mail.html,
      });
      return { ok: true, via: "smtp" };
    } catch (error) {
      return { ok: false, via: "smtp", error: String(error) };
    } finally {
      try {
        await client.close();
      } catch {
        // Already sent by this point; a noisy close is not a failure.
      }
    }
  }

  if (RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (response.ok) return { ok: true, via: "resend" };
    return { ok: false, via: "resend", error: `${response.status} ${await response.text()}` };
  }

  return { ok: false, via: "none", error: "no transport configured" };
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function template(name: string, matchId: string) {
  const safe = escapeHtml(name);
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f6f3ee;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safe} just checked in at Config. Your chat is open.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;color:#8b8598;text-transform:uppercase;">UXKITH &middot; Config India 2026</p>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#15131a;font-weight:600;">${safe} is at Config now</h1>
        </td></tr>
        <tr><td style="padding:16px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#45414f;">
            You two said you wanted to meet, and they have just arrived. Your chat is already open &mdash; work out where to find each other.
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          <a href="${APP_URL}/chat/${matchId}" style="display:block;background:#ff5c38;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:600;">Open the chat</a>
        </td></tr>
        <tr><td style="padding:22px 28px 28px;">
          <p style="margin:0;border-top:1px solid #eee9e1;padding-top:16px;font-size:12px;line-height:1.6;color:#9c96a6;">
            Meet in the public areas of the venue. You are getting this because you and ${safe} both tapped &ldquo;Interested to meet&rdquo;. No phone numbers are ever collected or shared.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user) return json({ error: "unauthorized" }, 401);

  const { data: me } = await admin
    .from("profiles")
    .select("full_name, is_here")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_here) return json({ skipped: "not_here" });

  const { data: matches } = await admin
    .from("matches")
    .select("id, user_a, user_b")
    .eq("active", true)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (!matches?.length) return json({ sent: 0 });

  let sent = 0;
  for (const match of matches) {
    const partnerId = match.user_a === user.id ? match.user_b : match.user_a;

    const { data: account } = await admin.auth.admin.getUserById(partnerId);
    const email = account?.user?.email;
    if (!email) continue;

    const result = await sendEmail({
      to: email,
      subject: `${me.full_name} is at Config now`,
      html: template(me.full_name, match.id),
      text: `${me.full_name} has just arrived at Config India 2026. Your chat is open: ${APP_URL}/chat/${match.id}`,
    });

    if (result.ok) sent += 1;
    else console.error("send failed via", result.via, result.error);
  }

  return json({ sent });
});
