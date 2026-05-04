"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

const STATUSES = new Set(["yes", "no", "maybe"]);

export async function recordRsvp(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!eventId || !STATUSES.has(status)) {
    redirect("/calendar");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);

  const { error } = await supabase.from("rsvps").upsert(
    {
      event_id: eventId,
      resident_id: me.id,
      status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "event_id,resident_id" }
  );

  if (error) {
    redirect(`/calendar/${eventId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/calendar/${eventId}`);
  revalidatePath("/calendar");
  redirect(`/calendar/${eventId}`);
}
