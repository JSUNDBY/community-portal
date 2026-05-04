"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms } from "@/lib/sms";
import { COMMUNITY } from "@/lib/config";

/**
 * SMS opt-in flow. Stores the exact consent text + IP + UA + timestamp
 * in `sms_consents` for TCPA defense, then sends a confirmation SMS
 * (which bypasses the consent gate via relatedTo: "consent_confirmation").
 *
 * Wire up to the settings UI when the SMS preferences row is built.
 */
export async function recordSmsConsent(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const consented = formData.get("sms_consent") === "on";

  if (!phone || !consented) {
    redirect(
      "/settings?error=" +
        encodeURIComponent("Phone and consent checkbox both required.")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const consentText = consentTextFor();
  const headerBag = await headers();
  const ip =
    headerBag.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerBag.get("x-real-ip") ??
    null;
  const userAgent = headerBag.get("user-agent") ?? null;

  // Service client to insert: RLS would otherwise require resident_id =
  // auth.uid(); we have the auth uid, so it would also work via the
  // authenticated client, but service-role insert keeps the audit row
  // accurate even if the policy changes later.
  const service = createServiceClient();
  await service.from("sms_consents").insert({
    resident_id: user.id,
    phone,
    consent_text: consentText,
    ip_address: ip,
    user_agent: userAgent,
  });

  // Update the resident row's phone + opt-in flag.
  await service
    .from("residents")
    .update({ phone, notify_sms: true })
    .eq("id", user.id);

  // Send the confirmation SMS. Bypass the consent gate — this IS the
  // consent confirmation per Twilio / CTIA best practice.
  await sendSms({
    to: phone,
    body: `You're opted in to ${COMMUNITY.name} alerts. Reply STOP to unsubscribe.`,
    relatedTo: "consent_confirmation",
  });

  redirect("/settings?ok=sms");
}

export function consentTextFor(): string {
  return [
    `By providing your phone number and checking this box, you consent`,
    `to receive SMS messages from ${COMMUNITY.name} regarding board`,
    `announcements, meeting reminders, and community alerts. Message and`,
    `data rates may apply. Reply STOP to unsubscribe at any time. You`,
    `can also update this preference in Settings.`,
  ].join(" ");
}
