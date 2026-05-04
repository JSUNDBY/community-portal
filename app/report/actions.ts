"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { renderBrandedEmail } from "@/lib/email-template";
import { COMMUNITY } from "@/lib/config";

export async function submitReport(formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!category || !description) {
    redirect(
      "/report?error=" + encodeURIComponent("Please complete both fields.")
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
