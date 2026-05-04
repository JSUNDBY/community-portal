import { notFound } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("announcements")
    .select("id, title, body_md, published_at, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!a) notFound();

  const { data: author } = await supabase
    .from("residents")
    .select("name")
    .eq("id", a.author_id)
    .maybeSingle();

  return (
    <PageShell title={a.title}>
      <div className="text-[13px] text-(--ink-soft) mb-5">
        Posted {new Date(a.published_at).toLocaleDateString()}
        {author?.name && <> by {author.name}</>}
      </div>
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 text-[15px] text-(--primary) leading-[1.7] whitespace-pre-line">
        {a.body_md}
      </div>
    </PageShell>
  );
}
