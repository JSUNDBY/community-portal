import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/auth", "/report", "/about"];
const SYSTEM_PATHS = ["/api/webhooks"]; // Twilio etc — never gated.
const STATIC_PREFIXES = ["/_next", "/favicon", "/logo", "/robots.txt", "/sitemap.xml"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
}

function isSystem(path: string) {
  return SYSTEM_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function isStatic(path: string) {
  return STATIC_PREFIXES.some((p) => path.startsWith(p)) || /\.(png|jpg|jpeg|svg|webp|ico)$/.test(path);
}

/**
 * Per-request session refresh + auth gate. Called from proxy.ts on
 * every match.
 *
 * Behavior:
 *   - Public paths (/, /login*, /auth/*, /report) pass through.
 *   - Anything else requires an authenticated session; otherwise the
 *     user is bounced to /login with `next` set to where they were going.
 *
 * Per Supabase docs, do NOT add code between createServerClient and
 * getUser — the call refreshes the session token if needed.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (isStatic(path) || isSystem(path) || isPublic(path)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
