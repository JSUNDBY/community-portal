import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { renderMagicLinkEmail } from "@/lib/email-template";

/**
 * Generates a Supabase magic-link token via the admin API and emails
 * the click-through through our branded Resend wrapper. We construct
 * the URL ourselves (pointing at /auth/callback with `token_hash` +
 * `type` query params) so the callback can verify via verifyOtp —
 * which is what works with PKCE/SSR. Going through Supabase's own
 * /verify endpoint drops the `?code=` on redirect because there's no
 * client code_verifier to pair with an admin-generated link.
 */
export type SendMagicLinkArgs = {
  email: string;
  /** Absolute URL to /auth/callback, optionally with a `next` query param. */
  redirectTo: string;
};

export type SendMagicLinkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendBrandedMagicLink(
  args: SendMagicLinkArgs
): Promise<SendMagicLinkResult> {
  const service = createServiceClient();

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: args.email,
    options: { redirectTo: args.redirectTo },
  });

  const hashedToken = data?.properties?.hashed_token;
  // Supabase auto-promotes type=magiclink to type=signup for a brand-new
  // user. Use whatever verification_type came back so the callback's
  // verifyOtp receives the matching type.
  const verificationType =
    data?.properties?.verification_type ?? "magiclink";
  if (error || !hashedToken) {
    return {
      ok: false,
      error: error?.message ?? "Could not generate sign-in link.",
    };
  }

  const link = buildCallbackUrl(args.redirectTo, hashedToken, verificationType);
  const { subject, html, text } = renderMagicLinkEmail({ link });

  // Dev convenience: when Resend isn't configured, the email queues
  // as "skipped" and there's no way to click through. Log the link
  // to the dev server's console so the developer can grab it manually.
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[magic-link] ${args.email}\n  → ${link}\n  (no RESEND_API_KEY set; copy + paste this URL to sign in)\n`
    );
  }

  const send = await sendEmail({
    to: args.email,
    subject,
    html,
    text,
    relatedTo: "magiclink",
  });

  if (send.status === "failed") {
    return { ok: false, error: send.error ?? "Email send failed." };
  }
  return { ok: true };
}

function buildCallbackUrl(
  redirectTo: string,
  hashedToken: string,
  verificationType: string
): string {
  const url = new URL(redirectTo);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", verificationType);
  return url.toString();
}
