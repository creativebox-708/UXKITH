import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
  const isPublic =
    pathname === "/" ||
    pathname === "/terms" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next");

  if (!user && !isPublic) {
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
