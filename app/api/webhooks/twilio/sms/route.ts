import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  verifyTwilioSignature,
  isStopKeyword,
  isStartKeyword,
} from "@/lib/twilio";

export const runtime = "nodejs";

/**
 * Inbound SMS webhook from Twilio.
 *
 * Primary purpose: keep our `sms_consents` table in sync with TCPA
 * opt-outs. When a resident texts STOP / UNSUBSCRIBE / etc, Twilio
 * auto-replies with the cancellation confirmation and stops further
 * sends to that number — but we also need to revoke the consent on our
 * side so the audit trail is honest and `lib/sms.ts`'s gate refuses
 * to send.
 *
 * Twilio sends application/x-www-form-urlencoded payloads. The
 * X-Twilio-Signature header must match the payload + URL — we reject
 * unsigned or bad-signature requests.
 *
 * Configure this URL in the Twilio console under the messaging service
 * → Inbound Settings → "Send a webhook" pointing at
 * https://{domain}/api/webhooks/twilio/sms
 */
export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    // Refuse to accept anything if Twilio isn't configured. Otherwise
    // an attacker could POST fake STOPs in dev / staging where the env
    // happens to be empty.
    return new NextResponse("not configured", { status: 503 });
  }

  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") params[k] = v;
  }

  // Twilio signs with the *exact* URL it called — including the path
  // it knows about (the public URL behind any proxy). Use the request
  // URL but force https since Vercel terminates TLS upstream.
  const url = new URL(request.url);
  url.protocol = "https:";
  const signature = request.headers.get("x-twilio-signature");

  const valid = verifyTwilioSignature({
    signature,
    url: url.toString(),
    params,
    authToken,
  });
  if (!valid) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";

  if (!from) {
    return new NextResponse("missing From", { status: 400 });
  }

  const supabase = createServiceClient();

  if (isStopKeyword(body)) {
    await supabase
      .from("sms_consents")
      .update({ revoked_at: new Date().toISOString() })
      .eq("phone", from)
      .is("revoked_at", null);

    await supabase
      .from("residents")
      .update({ notify_sms: false })
      .eq("phone", from);

    // Log the inbound for audit. Twilio handles the confirmation reply;
    // we don't send anything back here.
    await supabase.from("outbound_messages").insert({
      channel: "sms",
      recipient: from,
      body: `[INBOUND] ${body}`,
      related_to: "stop_keyword",
      provider: "twilio",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } else if (isStartKeyword(body)) {
    // Resident texted START to opt back in. Twilio's auto-confirm
    // handles the user-visible side; we just unrevoke the latest
    // consent row. We do NOT auto-resurrect a never-given consent.
    const { data: latest } = await supabase
      .from("sms_consents")
      .select("id")
      .eq("phone", from)
      .order("given_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      await supabase
        .from("sms_consents")
        .update({ revoked_at: null })
        .eq("id", latest.id);
      await supabase
        .from("residents")
        .update({ notify_sms: true })
        .eq("phone", from);
    }

    await supabase.from("outbound_messages").insert({
      channel: "sms",
      recipient: from,
      body: `[INBOUND] ${body}`,
      related_to: "start_keyword",
      provider: "twilio",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } else {
    // Generic inbound. Log it so the board can see residents replying
    // (today there's no inbox UI, but the audit row exists).
    await supabase.from("outbound_messages").insert({
      channel: "sms",
      recipient: from,
      body: `[INBOUND] ${body.slice(0, 1000)}`,
      related_to: "inbound",
      provider: "twilio",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  // Twilio expects an empty TwiML body to skip auto-replying with our
  // own message — Twilio's messaging service handles the canonical
  // STOP/START confirmation language.
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    {
      status: 200,
      headers: { "content-type": "application/xml" },
    }
  );
}
