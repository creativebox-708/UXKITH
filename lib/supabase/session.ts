import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_EXACT = new Set(["/", "/terms", "/robots.txt", "/sitemap.xml"]);

/**
 * The metadata image routes have to be in here. They are generated routes with
 * no file extension, so the matcher's extension rule does not spare them — and
 * a signed-out request that gets redirected is exactly what a social crawler
 * makes, which would leave every shared link without a preview card.
 */
const PUBLIC_PREFIXES = [
  "/auth",
  "/_next",
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  // local visual-check scaffolding; its layout 404s outside development too
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/preview-check")) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Keeps the auth cookies fresh on every request and sends signed-in people
 * away from the landing page. Every other gate (invite, match membership)
 * lives in the page itself, so the middleware never needs to hit the database.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /**
   * Supabase falls back to the project's Site URL whenever the redirect_to it
   * was given is not in the allow-list, which drops the auth code on "/" where
   * nothing exchanges it and the sign-in dies silently. Forward it to the
   * handler instead, query intact.
   */
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
