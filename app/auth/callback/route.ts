import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";

/**
 * Magic-link callback. Branded links from sendBrandedMagicLink arrive
 * with `?token_hash=...&type=magiclink`; standard OAuth flows arrive
 * with `?code=...`. We handle both.
 *
 * After a successful verifyOtp, we run ensureProfile so the residents
 * row exists (claiming any matching invite) before the user lands on
 * the destination page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tokenType = searchParams.get("type");
  const requestedNext = searchParams.get("next") ?? "/";

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Sign-in link is missing or expired. Please request a new one."
      )}`
    );
  }

  const supabase = await createClient();

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type:
          (tokenType as
            | "magiclink"
            | "signup"
            | "email"
            | "recovery"
            | "invite"
            | "email_change") ?? "magiclink",
      })
    : await supabase.auth.exchangeCodeForSession(code as string);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await ensureProfile(supabase, user);
    } catch (err) {
      console.error("[auth/callback] ensureProfile failed:", err);
    }
  }

  return NextResponse.redirect(`${origin}${requestedNext}`);
}
