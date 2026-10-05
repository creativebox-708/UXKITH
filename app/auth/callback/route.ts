import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function baseUrl(request: Request, origin: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const base = baseUrl(request, origin);

  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(`${base}/?error=${encodeURIComponent(providerError)}`);
  }

  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${base}/`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${base}/?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/`);

  // The LinkedIn button is unreachable without ticking the consent box, so
  // arriving here with that marker is the record of the agreement. The cookie
  // is the fallback: the query param rides on redirect_to, which Supabase drops
  // whenever it falls back to the Site URL.
  const jar = await cookies();
  const agreedToTerms = searchParams.get("terms") === "1" || jar.get("uxkith_terms")?.value === "1";

  if (agreedToTerms) {
    await supabase
      .from("profiles")
      .update({ agreed_terms_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("agreed_terms_at", null);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, has_invite")
    .eq("id", user.id)
    .maybeSingle();

  // Safety net in case the handle_new_user trigger did not run.
  if (!profile) {
    const claims = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    await supabase.from("profiles").insert({
      id: user.id,
      linkedin_sub: claims.sub ?? null,
      full_name:
        claims.name ??
        [claims.given_name, claims.family_name].filter(Boolean).join(" ") ??
        "Config attendee",
      avatar_url: claims.picture ?? claims.avatar_url ?? null,
      agreed_terms_at: agreedToTerms ? new Date().toISOString() : null,
    });
    return NextResponse.redirect(`${base}/welcome`);
  }

  const destination = profile.onboarded_at && profile.has_invite ? "/home" : "/welcome";
  const response = NextResponse.redirect(`${base}${destination}`);
  response.cookies.delete("uxkith_terms");
  return response;
}
