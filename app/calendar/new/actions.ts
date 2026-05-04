"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

const CATEGORIES = new Set(["board", "community", "maintenance"]);

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/calendar");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsRaw = String(formData.get("starts_at") ?? "").trim();
  const endsRaw = String(formData.get("ends_at") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const categoryRaw = String(formData.get("category") ?? "community").trim();
  const recurrenceRule =
    String(formData.get("recurrence_rule") ?? "").trim() || null;

  if (!title) {
    redirect(
      "/calendar/new?error=" + encodeURIComponent("Title is required.")
    );
  }
  if (!startsRaw) {
    redirect(
      "/calendar/new?error=" + encodeURIComponent("Start time is required.")
    );
  }

  // datetime-local arrives as "YYYY-MM-DDTHH:mm" in the browser's local
  // zone. new Date() interprets it as local — exactly what we want.
  const startsAt = new Date(startsRaw);
  if (Number.isNaN(startsAt.getTime())) {
    redirect(
      "/calendar/new?error=" + encodeURIComponent("Couldn't parse the start time.")
    );
  }
  const endsAt = endsRaw ? new Date(endsRaw) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    redirect(
      "/calendar/new?error=" + encodeURIComponent("Couldn't parse the end time.")
    );
  }
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    redirect(
      "/calendar/new?error=" +
        encodeURIComponent("End time must be after the start time.")
    );
  }

  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : "community";

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      created_by: me.id,
      title,
      description,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      location,
      category,
      recurrence_rule: recurrenceRule,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/calendar/new?error=" +
        encodeURIComponent(error?.message ?? "Could not save the event.")
    );
  }

  revalidatePath("/calendar");
  redirect(`/calendar/${data.id}`);
}
