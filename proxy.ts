import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match everything except static, image-optimization, and Next 16's
    // auto-generated metadata routes (icon, apple-icon, manifest, opengraph
    // images). Browsers fetch the manifest + icons before any user is
    // signed in; routing them through the auth proxy would 307 them to
    // /login and PWA install would silently fail.
    "/((?!_next/static|_next/image|favicon\\.ico|icon|apple-icon|manifest\\.webmanifest|opengraph-image|twitter-image|robots\\.txt|sitemap\\.xml|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.webp$).*)",
  ],
};
