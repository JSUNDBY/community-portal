"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { sendBrandedMagicLink } from "@/lib/auth/send-magic-link";

const ROLES = new Set(["resident", "board"]);

export async function inviteResident(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const unitIdRaw = String(formData.get("unit_id") ?? "").trim();
  const unitId = unitIdRaw === "" ? null : unitIdRaw;
  const roleRaw = String(formData.get("role") ?? "resident").trim();
  const role = ROLES.has(roleRaw) ? (roleRaw as "resident" | "board") : "resident";
  const sendWelcome = formData.get("send_welcome") === "on";

  if (!email || !email.includes("@")) {
    redirect(
      "/board/invite?error=" + encodeURIComponent("A valid email is required.")
    );
  }

  // If they're already a resident, no point inviting.
  const { data: alreadyResident } = await supabase
    .from("residents")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (alreadyResident) {
    redirect(
      "/board/invite?error=" +
        encodeURIComponent(
          `${email} already has an account. Use the directory to manage them.`
        )
    );
  }

  // Upsert: if a row exists for this email, refresh it (handles the case
  // where the board updated the invite — new unit, new role).
  const { error: upsertErr } = await supabase
    .from("resident_invites")
    .upsert(
      {
        email,
        name,
        unit_id: unitId,
        role,
        invited_by: me.id,
      },
      { onConflict: "email" }
    );

  if (upsertErr) {
    redirect("/board/invite?error=" + encodeURIComponent(upsertErr.message));
  }

  if (sendWelcome) {
    const origin = (await headers()).get("origin") ?? "";
    const callback = new URL("/auth/callback", origin).toString();
    const result = await sendBrandedMagicLink({ email, redirectTo: callback });
    if (!result.ok) {
      // Invite is saved; just surface the email failure so the board
      // knows to retry sending or send manually.
      redirect(
        "/board/invite?error=" +
          encodeURIComponent(
            `Invite saved, but welcome email failed: ${result.error}`
          )
      );
    }
    revalidatePath("/board/invite");
    redirect(
      `/board/invite?ok=invited-and-emailed&email=${encodeURIComponent(email)}`
    );
  }

  revalidatePath("/board/invite");
  redirect(`/board/invite?ok=invited&email=${encodeURIComponent(email)}`);
}

export async function revokeInvite(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/board/invite?error=" + encodeURIComponent("Missing invite id."));
  }

  // Only revoke unclaimed invites; revoking a claimed invite would do
  // nothing useful and would break the "Claimed" history list.
  const { error } = await supabase
    .from("resident_invites")
    .delete()
    .eq("id", id)
    .is("claimed_at", null);

  if (error) {
    redirect("/board/invite?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/board/invite");
  redirect("/board/invite?ok=revoked");
}
