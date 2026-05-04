import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

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

const RESIDENT_COLUMNS =
  "id, unit_id, name, email, phone, role, is_owner, notify_email, notify_sms, share_phone, share_email";

/**
 * Idempotent: ensures a row in `residents` exists for the given auth user.
 *
 *   1. If a residents row already exists → return it.
 *   2. Else if a resident_invites row matches the email → claim it
 *      (copy unit_id / name / role into a fresh residents row, mark
 *      the invite claimed).
 *   3. Else create a default resident row with no unit. The UI shows
 *      "your account isn't linked to a unit yet" so the resident knows
 *      to contact the board.
 *
 * Why service-role: the invite-lookup + invite-claim path can't run
 * through the user's session because (a) `resident_invites` SELECT is
 * gated by `is_board()` — and a fresh user isn't board yet, and (b)
 * `residents` has no INSERT policy by design (board does the
 * onboarding via this function or invites). Auth has already
 * verified who the user is, so it's safe to do the bookkeeping with
 * service-role here.
 *
 * The user-scoped `supabase` parameter is still accepted for the
 * "existing row?" read so cookie-based session refreshes stay warm,
 * but writes are always service-role.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<Resident> {
  const email = (user.email ?? "").toLowerCase();
  const service = createServiceClient();

  // 1. Existing residents row?
  const { data: existing } = await supabase
    .from("residents")
    .select(RESIDENT_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Resident;

  // 2. Pre-registered invite? Use service-role: a fresh user can't
  // SELECT resident_invites under the is_board() RLS policy.
  const { data: invite } = await service
    .from("resident_invites")
    .select("id, unit_id, name, role")
    .eq("email", email)
    .is("claimed_at", null)
    .maybeSingle();

  if (invite) {
    const niceName = invite.name?.trim() || nameFromEmail(email);
    const { data: created, error } = await service
      .from("residents")
      .insert({
        id: user.id,
        unit_id: invite.unit_id,
        name: niceName,
        email,
        role: invite.role,
      })
      .select(RESIDENT_COLUMNS)
      .single();

    if (!error && created) {
      await service
        .from("resident_invites")
        .update({ claimed_at: new Date().toISOString() })
        .eq("id", invite.id);
      return created as Resident;
    }
    // Fall through to the default-row path on insert failure — the
    // resident still needs *some* row so the rest of the app works.
    console.error("[ensureProfile] invite-claim insert failed:", error);
  }

  // 3. Default resident with no unit.
  const niceName = nameFromEmail(email);
  const { data: created, error } = await service
    .from("residents")
    .insert({
      id: user.id,
      unit_id: null,
      name: niceName,
      email,
      role: "resident",
    })
    .select(RESIDENT_COLUMNS)
    .single();

  if (error || !created) {
    // We're hosed — no row, can't insert. Throw so the caller sees
    // the auth callback bail out instead of silently 200-ing with a
    // synthetic profile that doesn't exist in the database.
    throw new Error(
      `ensureProfile: could not create residents row for ${email}: ${
        error?.message ?? "unknown"
      }`
    );
  }

  return created as Resident;
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
