import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Twilio webhook signature.
 *
 *   sig = base64( HMAC-SHA1( authToken, fullUrl + sortedKeyValues ) )
 *
 * Twilio sends X-Twilio-Signature on every webhook POST. Reject any
 * request whose signature doesn't match — without this check, anyone
 * could POST fake STOP messages and unsubscribe other residents.
 *
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function verifyTwilioSignature(args: {
  signature: string | null;
  url: string;
  params: Record<string, string>;
  authToken: string;
}): boolean {
  if (!args.signature || !args.authToken) return false;

  const sortedKeys = Object.keys(args.params).sort();
  const signedPayload =
    args.url + sortedKeys.map((k) => k + args.params[k]).join("");

  const expected = createHmac("sha1", args.authToken)
    .update(signedPayload, "utf8")
    .digest("base64");

  // Constant-time compare to defeat signature-timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(args.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Detect TCPA opt-out keywords. Twilio auto-handles these on its
 * side, but we still need to sync our local consent state. */
const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);

export function isStopKeyword(body: string): boolean {
  return STOP_KEYWORDS.has(body.trim().toUpperCase());
}

/** Detect opt-back-in. Twilio also auto-handles this. */
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP"]);

export function isStartKeyword(body: string): boolean {
  return START_KEYWORDS.has(body.trim().toUpperCase());
}
