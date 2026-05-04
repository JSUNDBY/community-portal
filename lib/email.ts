import { createServiceClient } from "@/lib/supabase/service";
import { COMMUNITY } from "@/lib/config";

/**
 * Outbound email wrapper. Every send is logged to outbound_messages for
 * audit, then forwarded to Resend if RESEND_API_KEY is configured.
 * Without the key, the row stays as "skipped" with a clear error so
 * dev can verify the queue without spamming inboxes.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** For audit: e.g. "announcement:{id}", "magiclink", "issue:{id}". */
  relatedTo?: string;
};

export type SendEmailResult = {
  queued_id: string;
  status: "sent" | "queued" | "skipped" | "failed";
  provider_message_id?: string;
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const supabase = createServiceClient();

  const { data: queued, error: insertErr } = await supabase
    .from("outbound_messages")
    .insert({
      channel: "email",
      recipient: input.to,
      subject: input.subject,
      body: input.html,
      related_to: input.relatedTo ?? null,
      provider: "resend",
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await supabase
      .from("outbound_messages")
      .update({ status: "skipped", error: "RESEND_API_KEY not configured" })
      .eq("id", queued.id);
    return { queued_id: queued.id, status: "skipped" };
  }

  const body: Record<string, unknown> = {
    from: COMMUNITY.emailFrom,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  };
  if (input.text) body.text = input.text;
  if (input.replyTo) body.reply_to = input.replyTo;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      const err = `resend ${resp.status}: ${text.slice(0, 500)}`;
      await supabase
        .from("outbound_messages")
        .update({ status: "failed", error: err })
        .eq("id", queued.id);
      return { queued_id: queued.id, status: "failed", error: err };
    }

    const json = (await resp.json()) as { id?: string };
    await supabase
      .from("outbound_messages")
      .update({
        status: "sent",
        provider_message_id: json.id ?? null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", queued.id);

    return {
      queued_id: queued.id,
      status: "sent",
      provider_message_id: json.id,
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
