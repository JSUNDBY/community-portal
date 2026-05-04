"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms, getSmsConsentText } from "@/lib/sms";
import { COMMUNITY } from "@/lib/config";

/**
 * Save profile basics (name) plus directory visibility + email
 * notification preferences. Phone + SMS are handled separately because
 * they require a TCPA consent record.
 */
export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(
      "/settings?error=" + encodeURIComponent("Your name can't be blank.")
    );
  }

  const notifyEmail = formData.get("notify_email") === "on";
  const shareEmail = formData.get("share_email") === "on";
  const sharePhone = formData.get("share_phone") === "on";

  const { error } = await supabase
    .from("residents")
    .update({
      name,
      notify_email: notifyEmail,
      share_email: shareEmail,
      share_phone: sharePhone,
    })
    .eq("id", user.id);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?ok=profile");
}

/**
 * SMS opt-in flow. Stores the exact consent text + IP + UA + timestamp
 * in `sms_consents` for TCPA defense, then sends a confirmation SMS
 * (which bypasses the consent gate via relatedTo: "consent_confirmation").
 */
export async function recordSmsConsent(formData: FormData) {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = normalizePhone(phoneRaw);
  const consented = formData.get("sms_consent") === "on";

  if (!phone) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          "Enter a valid US phone number, e.g. (555) 123-4567."
        )
    );
  }
  if (!consented) {
    redirect(
      "/settings?error=" +
        encodeURIComponent("Please confirm consent by checking the box.")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const consentText = getSmsConsentText();
  const headerBag = await headers();
  const ip =
    headerBag.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerBag.get("x-real-ip") ??
    null;
  const userAgent = headerBag.get("user-agent") ?? null;

  // Service client to insert: keeps the audit trail working even if
  // RLS for sms_consents shifts in a later migration.
  const service = createServiceClient();
  const { error: consentErr } = await service.from("sms_consents").insert({
    resident_id: user.id,
    phone,
    consent_text: consentText,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (consentErr) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(`Could not save consent: ${consentErr.message}`)
    );
  }

  await service
    .from("residents")
    .update({ phone, notify_sms: true })
    .eq("id", user.id);

  // Confirmation SMS — Twilio/CTIA best practice. The bypass keyword
  // here is what lib/sms.ts checks to skip the consent gate.
  await sendSms({
    to: phone,
    body: `You're opted in to ${COMMUNITY.name} alerts. Reply STOP to unsubscribe.`,
    relatedTo: "consent_confirmation",
  });

  revalidatePath("/settings");
  redirect("/settings?ok=sms");
}

/**
 * Revoke SMS consent: marks the active consent row revoked, flips
 * notify_sms off. Doesn't clear the phone number — the resident might
 * still want it visible in the directory.
 */
export async function revokeSmsConsent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  await service
    .from("sms_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("resident_id", user.id)
    .is("revoked_at", null);

  await service
    .from("residents")
    .update({ notify_sms: false })
    .eq("id", user.id);

  revalidatePath("/settings");
  redirect("/settings?ok=sms-revoked");
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
