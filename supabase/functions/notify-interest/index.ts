import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * "Someone at Config wants to meet you."
 *
 * Called right after an interest row is inserted. The caller's JWT is the proof
 * of who is tagging; the row itself is re-checked here so the function can never
 * be used to email a stranger. The undo path deliberately never calls this.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "EventBuddy <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://eventbuddy.vercel.app";

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

function template(tagger: { name: string; subtitle: string }) {
  const name = escapeHtml(tagger.name);
  const subtitle = escapeHtml(tagger.subtitle);

  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f6f3ee;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${name} tagged you on EventBuddy. Tag them back to open a chat.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;color:#8b8598;text-transform:uppercase;">EventBuddy &middot; Config India 2026</p>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#15131a;font-weight:600;">Someone at Config wants to meet you</h1>
        </td></tr>
        <tr><td style="padding:20px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#faf8f5;border:1px solid #eee9e1;border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0;font-size:17px;font-weight:600;color:#15131a;">${name}</p>
              ${subtitle ? `<p style="margin:4px 0 0;font-size:14px;color:#6f6a7a;">${subtitle}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#45414f;">
            They tapped &ldquo;Interested to meet&rdquo; on your card. If you want to meet them too, tap it back &mdash; that opens a chat between the two of you.
          </p>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#8b8598;">
            This is a signal, not an obligation. Ignoring it is a perfectly good answer, and they are not told either way.
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          <a href="${APP_URL}/home" style="display:block;background:#ff5c38;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-size:15px;font-weight:600;">See who it is</a>
        </td></tr>
        <tr><td style="padding:22px 28px 28px;">
          <p style="margin:0;border-top:1px solid #eee9e1;padding-top:16px;font-size:12px;line-height:1.6;color:#9c96a6;">
            You are getting this because you signed in to EventBuddy with LinkedIn for Config India 2026. No phone numbers are ever collected or shared. You can delete your account and all of this data from Settings.
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

  let toUser: string | undefined;
  try {
    ({ toUser } = await req.json());
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!toUser || toUser === user.id) return json({ error: "bad_request" }, 400);

  // The interest must really exist, or this is not a notification we owe anyone.
  const { data: interest } = await admin
    .from("interests")
    .select("from_user")
    .eq("from_user", user.id)
    .eq("to_user", toUser)
    .maybeSingle();
  if (!interest) return json({ skipped: "no_interest" });

  const { data: recipient } = await admin
    .from("profiles")
    .select("has_invite")
    .eq("id", toUser)
    .maybeSingle();
  if (!recipient?.has_invite) return json({ skipped: "not_listed" });

  const { data: tagger } = await admin
    .from("profiles")
    .select("full_name, headline, company")
    .eq("id", user.id)
    .maybeSingle();
  if (!tagger) return json({ skipped: "no_tagger" });

  const { data: account } = await admin.auth.admin.getUserById(toUser);
  const email = account?.user?.email;
  if (!email) return json({ skipped: "no_email" });

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set; skipping the email for", toUser);
    return json({ skipped: "no_resend_key" });
  }

  const subtitle = [tagger.headline, tagger.company].filter(Boolean).join(" · ");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: "Someone at Config wants to meet you",
      html: template({ name: tagger.full_name, subtitle }),
      text: `${tagger.full_name}${subtitle ? ` (${subtitle})` : ""} tapped "Interested to meet" on your card at Config India 2026.\n\nIf you want to meet them too, tap it back and a chat opens between you: ${APP_URL}/home\n\nThis is a signal, not an obligation.`,
    }),
  });

  if (!response.ok) {
    console.error("resend failed", response.status, await response.text());
    return json({ error: "send_failed" }, 502);
  }

  return json({ sent: true });
});
