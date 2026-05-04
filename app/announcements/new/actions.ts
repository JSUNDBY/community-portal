"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { notifyResidents } from "@/lib/notify";
import { renderAnnouncementEmail } from "@/lib/email-template";
import { COMMUNITY } from "@/lib/config";

export async function publishAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/announcements");

  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const sendEmail = formData.get("send_email") === "on";
  const sendSms = formData.get("send_sms") === "on";

  if (!title || !bodyMd) {
    redirect(
      "/announcements/new?error=" +
        encodeURIComponent("Title and body are both required.")
    );
  }

  const { data: row, error } = await supabase
    .from("announcements")
    .insert({
      author_id: me.id,
      title,
      body_md: bodyMd,
      pinned,
      send_email: sendEmail,
      send_sms: sendSms,
    })
    .select("id")
    .single();

  if (error || !row) {
    redirect(
      "/announcements/new?error=" +
        encodeURIComponent(error?.message ?? "Could not save the announcement.")
    );
  }

  if (sendEmail || sendSms) {
    const origin = (await headers()).get("origin") ?? `https://${COMMUNITY.domain}`;
    const link = `${origin}/announcements/${row.id}`;

    const { html } = renderAnnouncementEmail({
      title,
      bodyMd,
      authorName: me.name,
      link,
    });

    const channels: ("email" | "sms")[] = [];
    if (sendEmail) channels.push("email");
    if (sendSms) channels.push("sms");

    // SMS body: terse — title + read-more link. Branded shell would be
    // wasted bytes here.
    const smsBody = `[${COMMUNITY.name}] ${title}\nRead more: ${link}`;

    try {
      // Email + SMS share the same fan-out helper. Email gets the
      // pre-rendered branded HTML; SMS gets the terse smsBody as the
      // text fallback (lib/notify.ts uses `body` for SMS).
      await notifyResidents({
        residentIds: "all",
        subject: `[${COMMUNITY.name}] ${title}`,
        body: smsBody,
        html,
        channels,
        relatedTo: `announcement:${row.id}`,
      });
    } catch (err) {
      console.error("[announcements/new] notify failed:", err);
      // Don't fail the redirect — the announcement is saved and the
      // outbound rows that were attempted are logged. Board can re-fan
      // from the audit table if it comes to that.
    }
  }

  revalidatePath("/announcements");
  redirect(`/announcements/${row.id}`);
}
