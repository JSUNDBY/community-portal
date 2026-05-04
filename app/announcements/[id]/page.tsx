import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

type AnnouncementRow = {
  id: string;
  title: string;
  body_md: string;
  pinned: boolean;
  send_email: boolean;
  send_sms: boolean;
  published_at: string;
  author: { name: string } | null;
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);

  const { data: a } = await supabase
    .from("announcements")
    .select(
      `id, title, body_md, pinned, send_email, send_sms, published_at,
       author:residents!announcements_author_id_fkey(name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!a) notFound();
  const announcement = a as unknown as AnnouncementRow;

  // Record the read receipt — idempotent thanks to the (announcement_id,
  // resident_id) primary key. Board members reading their own posts
  // still get tracked; that's fine for accurate reach numbers.
  await supabase
    .from("announcement_reads")
    .upsert(
      {
        announcement_id: id,
        resident_id: me.id,
        read_at: new Date().toISOString(),
      },
      { onConflict: "announcement_id,resident_id" }
    );

  // Board sees reach: # residents who've opened it / total residents.
  let readCount: number | null = null;
  let residentTotal: number | null = null;
  if (me.role === "board") {
    const [{ count: reads }, { count: total }] = await Promise.all([
      supabase
        .from("announcement_reads")
        .select("resident_id", { count: "exact", head: true })
        .eq("announcement_id", id),
      supabase.from("residents").select("id", { count: "exact", head: true }),
    ]);
    readCount = reads ?? 0;
    residentTotal = total ?? 0;
  }

  return (
    <PageShell title={announcement.title}>
      <div className="text-[13px] text-(--ink-soft) mb-5 flex items-center gap-3 flex-wrap">
        <span>
          Posted {new Date(announcement.published_at).toLocaleDateString()}
        </span>
        {announcement.author?.name && <span>by {announcement.author.name}</span>}
        {announcement.pinned && (
          <span className="text-[11px] tracking-[0.08em] uppercase text-(--accent) font-semibold">
            Pinned
          </span>
        )}
      </div>

      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 text-[15px] text-(--primary) leading-[1.7] whitespace-pre-line">
        {announcement.body_md}
      </div>

      {me.role === "board" && residentTotal !== null && (
        <div className="mt-4 bg-(--paper) border border-(--line) rounded-xl px-5 py-4 text-[13px] text-(--ink-soft)">
          <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
            Reach
          </div>
          <div className="text-(--primary) font-medium">
            {readCount} of {residentTotal} residents opened this
            {announcement.send_email && <> · Emailed</>}
            {announcement.send_sms && <> · Texted</>}
          </div>
        </div>
      )}
    </PageShell>
  );
}
