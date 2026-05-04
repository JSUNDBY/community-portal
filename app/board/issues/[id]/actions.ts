"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

const STATUSES = new Set(["open", "acknowledged", "resolved", "closed"]);

export async function updateIssueStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !STATUSES.has(status)) {
    redirect("/board/issues");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  const updates: Record<string, unknown> = { status };
  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  } else if (status === "open" || status === "acknowledged") {
    // Reopening — clear the resolved timestamp.
    updates.resolved_at = null;
  }

  const { error } = await supabase
    .from("issue_reports")
    .update(updates)
    .eq("id", id);

  if (error) {
    redirect(
      `/board/issues/${id}?error=` + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/board/issues");
  revalidatePath(`/board/issues/${id}`);
  redirect(`/board/issues/${id}?ok=1`);
}
