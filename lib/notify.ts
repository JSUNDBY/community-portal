import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { renderBrandedEmail } from "@/lib/email-template";

/**
 * High-level fan-out. Resolves resident IDs to the residents table,
 * filters by per-resident notify_email/notify_sms preferences, and
 * delegates to email.ts + sms.ts (both of which log to
 * outbound_messages and check consent for SMS).
 */

export type NotifyChannel = "email" | "sms";

export type NotifyInput = {
  /** "all" → every resident; otherwise a list of resident UUIDs. */
  residentIds: string[] | "all";
  subject: string;
  /** Plain-text body. Email gets a branded HTML wrap; SMS sends as-is. */
  body: string;
  /** Optional pre-rendered HTML override for email. */
  html?: string;
  channels: NotifyChannel[];
  /** Audit tag, e.g. "announcement:{id}". */
  relatedTo?: string;
};

export type NotifyResult = {
  email: { sent: number; skipped: number; failed: number };
  sms: { sent: number; skipped: number; failed: number };
};

export async function notifyResidents(input: NotifyInput): Promise<NotifyResult> {
  const supabase = createServiceClient();

  const query = supabase
    .from("residents")
    .select("id, email, phone, notify_email, notify_sms");

  const { data: residents, error } =
    input.residentIds === "all"
      ? await query
      : await query.in("id", input.residentIds);

  if (error || !residents) {
    return zeros();
  }

  const results: NotifyResult = zeros();
  const html =
    input.html ??
    renderBrandedEmail({
      heading: input.subject,
      bodyHtml: input.body
        .split(/\n{2,}/)
        .map(
          (p) =>
            `<p style="margin:0 0 14px;">${escapeHtml(p).replace(
              /\n/g,
              "<br/>"
            )}</p>`
        )
        .join(""),
    });

  for (const r of residents) {
    if (input.channels.includes("email") && r.notify_email && r.email) {
      const res = await sendEmail({
        to: r.email,
        subject: input.subject,
        html,
        text: input.body,
        relatedTo: input.relatedTo,
      });
      bump(results.email, res.status);
    }

    if (input.channels.includes("sms") && r.notify_sms && r.phone) {
      const res = await sendSms({
        to: r.phone,
        body: input.body,
        relatedTo: input.relatedTo,
      });
      bump(results.sms, res.status);
    }
  }

  return results;
}

function zeros(): NotifyResult {
  return {
    email: { sent: 0, skipped: 0, failed: 0 },
    sms: { sent: 0, skipped: 0, failed: 0 },
  };
}

function bump(
  counts: { sent: number; skipped: number; failed: number },
  status: "sent" | "queued" | "skipped" | "failed"
) {
  if (status === "sent") counts.sent++;
  else if (status === "failed") counts.failed++;
  else counts.skipped++;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
