import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Resident = {
  id: string;
  unit_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: "resident" | "board";
  is_owner: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  share_phone: boolean;
  share_email: boolean;
};

/**
 * Idempotent: ensures a row in `residents` exists for the given auth user.
 *
 *   1. If a residents row already exists → return it.
 *   2. Else if a resident_invites row matches the email → claim it
 *      (copy unit_id / name / role into a fresh residents row, mark
 *      the invite claimed).
 *   3. Else create a default resident row with no unit. The UI should
 *      then show a "your account isn't linked to a unit yet — contact
 *      the board" message.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<Resident> {
  const email = (user.email ?? "").toLowerCase();

  // 1. Existing residents row?
  const { data: existing } = await supabase
    .from("residents")
    .select(
      "id, unit_id, name, email, phone, role, is_owner, notify_email, notify_sms, share_phone, share_email"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Resident;

  // 2. Pre-registered invite?
  const { data: invite } = await supabase
    .from("resident_invites")
    .select("id, unit_id, name, role")
    .eq("email", email)
    .is("claimed_at", null)
    .maybeSingle();

  if (invite) {
    const niceName = invite.name?.trim() || nameFromEmail(email);
    const { data: created, error } = await supabase
      .from("residents")
      .insert({
        id: user.id,
        unit_id: invite.unit_id,
        name: niceName,
        email,
        role: invite.role,
      })
      .select(
        "id, unit_id, name, email, phone, role, is_owner, notify_email, notify_sms, share_phone, share_email"
      )
      .single();

    if (!error && created) {
      await supabase
        .from("resident_invites")
        .update({ claimed_at: new Date().toISOString() })
        .eq("id", invite.id);
      return created as Resident;
    }
  }

  // 3. Default resident with no unit.
  const niceName = nameFromEmail(email);
  const { data: created } = await supabase
    .from("residents")
    .insert({
      id: user.id,
      unit_id: null,
      name: niceName,
      email,
      role: "resident",
    })
    .select(
      "id, unit_id, name, email, phone, role, is_owner, notify_email, notify_sms, share_phone, share_email"
    )
    .single();

  return (
    (created as Resident | null) ?? {
      id: user.id,
      unit_id: null,
      name: niceName,
      email,
      phone: null,
      role: "resident",
      is_owner: true,
      notify_email: true,
      notify_sms: false,
      share_phone: false,
      share_email: true,
    }
  );
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ") || "Resident"
  );
}
