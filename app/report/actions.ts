"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { renderBrandedEmail } from "@/lib/email-template";
import { COMMUNITY } from "@/lib/config";

/** Minimum form age (ms) before we accept a submission. Bots fill +
 * submit instantly; humans take well over a second. */
const MIN_FORM_AGE_MS = 2000;
/** Minimum description length to discourage useless reports. */
const MIN_DESCRIPTION_CHARS = 10;

export async function submitReport(formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();
  const renderedAtRaw = String(formData.get("rendered_at") ?? "").trim();

  // Honeypot: real users can't see this field. Anything in it is a bot.
  // Silently redirect to the success page so the bot can't probe what
  // makes us reject — but don't actually persist anything.
  if (honeypot) {
    redirect("/report?ok=1");
  }

  // Form-age: reject implausibly fast submissions. A missing/garbled
  // timestamp also fails here, which catches scripts that don't load
  // the page first.
  const renderedAt = Number(renderedAtRaw);
  if (
    !Number.isFinite(renderedAt) ||
    Date.now() - renderedAt < MIN_FORM_AGE_MS
  ) {
    redirect("/report?ok=1");
  }

  if (!category || !description) {
    redirect(
      "/report?error=" + encodeURIComponent("Please complete both fields.")
    );
  }
  if (description.length < MIN_DESCRIPTION_CHARS) {
    redirect(
      "/report?error=" +
        encodeURIComponent(
          `Tell us a little more — at least ${MIN_DESCRIPTION_CHARS} characters.`
        )
    );
  }

  // Auth is optional for /report — anonymous submissions are allowed.
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  // Anonymous reports go through the service-role client (RLS allows
  // `anon` to insert, but a logged-out browser doesn't carry a session).
  const supabase = user ? supabaseAuth : createServiceClient();

  const { data: row, error } = await supabase
    .from("issue_reports")
    .insert({
      resident_id: user?.id ?? null,
      category,
      description,
    })
    .select("id")
    .single();

  if (error || !row) {
    redirect(
      "/report?error=" +
        encodeURIComponent(error?.message ?? "Could not save the report.")
    );
  }

  // Notify the board's contact inbox. Best-effort — failures here don't
  // block the resident's confirmation, but the row is already persisted.
  try {
    const html = renderBrandedEmail({
      heading: `New ${category} report`,
      bodyHtml: `
        <p style="margin:0 0 14px;white-space:pre-line;">${escapeHtml(description)}</p>
        <p style="margin:0;color:#475569;font-size:13px;">Submitted ${
          user ? `by ${escapeHtml(user.email ?? "a resident")}` : "anonymously"
        } · report id ${row.id}</p>
      `,
    });
    await sendEmail({
      to: COMMUNITY.contactEmail,
      subject: `[${COMMUNITY.name}] New ${category} report`,
      html,
      text: `New ${category} report:\n\n${description}\n\nReport id: ${row.id}`,
      relatedTo: `issue:${row.id}`,
    });
  } catch (err) {
    console.error("[/report] notify failed:", err);
  }

  redirect("/report?ok=1");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
