import { createServiceClient } from "@/lib/supabase/service";
import { COMMUNITY } from "@/lib/config";

/**
 * Outbound SMS wrapper. TCPA-defensible: refuses to send unless an
 * un-revoked sms_consents row exists for the recipient.
 *
 * As with email, every send is logged to outbound_messages first.
 */

/**
 * The exact opt-in language shown to residents on the SMS consent form.
 * Stored verbatim into `sms_consents.consent_text` so we can prove
 * what they agreed to. Keep this synchronized with what the form
 * actually displays — never paraphrase one without the other.
 */
export function getSmsConsentText(): string {
  return [
    `By providing your phone number and checking this box, you consent`,
    `to receive SMS messages from ${COMMUNITY.name} regarding board`,
    `announcements, meeting reminders, and community alerts. Message and`,
    `data rates may apply. Reply STOP to unsubscribe at any time. You`,
    `can also update this preference in Settings.`,
  ].join(" ");
}

export type SendSmsInput = {
  /** E.164 phone (e.g. "+15125551234"). */
  to: string;
  /** SMS body. Twilio segments at 160 chars; keep it terse. */
  body: string;
  /** For audit: "announcement:{id}", "consent_confirmation", etc. */
  relatedTo?: string;
};

export type SendSmsResult = {
  queued_id: string;
  status: "sent" | "queued" | "skipped" | "failed";
  provider_message_id?: string;
  error?: string;
};

export async function hasSmsConsent(phone: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sms_consents")
    .select("id, revoked_at")
    .eq("phone", phone)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const supabase = createServiceClient();

  // Log first, send second — audit row exists even if Twilio fails.
  const { data: queued, error: insertErr } = await supabase
    .from("outbound_messages")
    .insert({
      channel: "sms",
      recipient: input.to,
      body: input.body,
      related_to: input.relatedTo ?? null,
      provider: "twilio",
      status: "queued",
    })
    .select("id")
    .single();

  if (insertErr || !queued) {
    return {
      queued_id: "",
      status: "failed",
      error: insertErr?.message ?? "outbound_messages insert failed",
    };
  }

  // Refuse to send without consent. The consent confirmation message itself
  // is exempt — it's the response to the user explicitly checking the box —
  // so callers can pass `relatedTo: "consent_confirmation"` to bypass.
  if (input.relatedTo !== "consent_confirmation") {
    const consented = await hasSmsConsent(input.to);
    if (!consented) {
      await supabase
        .from("outbound_messages")
        .update({ status: "skipped", error: "no active sms_consents row" })
        .eq("id", queued.id);
      return {
        queued_id: queued.id,
        status: "skipped",
        error: "no active sms_consents row",
      };
    }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    await supabase
      .from("outbound_messages")
      .update({ status: "skipped", error: "Twilio not configured" })
      .eq("id", queued.id);
    return { queued_id: queued.id, status: "skipped" };
  }

  try {
    const params = new URLSearchParams();
    params.set("From", from);
    params.set("To", input.to);
    params.set("Body", input.body);

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        },
        body: params.toString(),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      const err = `twilio ${resp.status}: ${text.slice(0, 500)}`;
      await supabase
        .from("outbound_messages")
        .update({ status: "failed", error: err })
        .eq("id", queued.id);
      return { queued_id: queued.id, status: "failed", error: err };
    }

    const json = (await resp.json()) as { sid?: string };
    await supabase
      .from("outbound_messages")
      .update({
        status: "sent",
        provider_message_id: json.sid ?? null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", queued.id);

    return {
      queued_id: queued.id,
      status: "sent",
      provider_message_id: json.sid,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("outbound_messages")
      .update({ status: "failed", error: msg.slice(0, 500) })
      .eq("id", queued.id);
    return { queued_id: queued.id, status: "failed", error: msg };
  }
}
