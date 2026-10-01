import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * "[Name] is at Config now."
 *
 * Called on event day when someone taps "I'm here". Only their active mutual
 * matches hear about it, and only if the profile really is flagged as here.
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

function template(name: string, matchId: string) {
  const safe = escapeHtml(name);
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f6f3ee;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safe} just checked in at Config. Your chat is open.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;color:#8b8598;text-transform:uppercase;">EventBuddy &middot; Config India 2026</p>
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
    .select("full_name, is_here, has_invite")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_here || !me.has_invite) return json({ skipped: "not_here" });

  const { data: matches } = await admin
    .from("matches")
    .select("id, user_a, user_b")
    .eq("active", true)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (!matches?.length) return json({ sent: 0 });

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set; skipping", matches.length, "here-notifications");
    return json({ skipped: "no_resend_key" });
  }

  let sent = 0;
  for (const match of matches) {
    const partnerId = match.user_a === user.id ? match.user_b : match.user_a;

    const { data: account } = await admin.auth.admin.getUserById(partnerId);
    const email = account?.user?.email;
    if (!email) continue;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: `${me.full_name} is at Config now`,
        html: template(me.full_name, match.id),
        text: `${me.full_name} has just arrived at Config India 2026. Your chat is open: ${APP_URL}/chat/${match.id}`,
      }),
    });

    if (response.ok) sent += 1;
    else console.error("resend failed", response.status, await response.text());
  }

  return json({ sent });
});
