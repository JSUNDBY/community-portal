import { notFound } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: e } = await supabase
    .from("calendar_events")
    .select("id, title, description, starts_at, ends_at, location, category")
    .eq("id", id)
    .maybeSingle();

  if (!e) notFound();

  return (
    <PageShell title={e.title}>
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-4">
        <div className="text-[14px] text-(--ink-soft) mb-3">
          <div>
            <span className="font-medium text-(--primary)">When:</span>{" "}
            {new Date(e.starts_at).toLocaleString()}
            {e.ends_at && <> – {new Date(e.ends_at).toLocaleString()}</>}
          </div>
          {e.location && (
            <div>
              <span className="font-medium text-(--primary)">Where:</span>{" "}
              {e.location}
            </div>
          )}
        </div>
        {e.description && (
          <p className="text-[15px] text-(--primary) leading-[1.6] whitespace-pre-line">
            {e.description}
          </p>
        )}
      </div>
      <ComingSoon note="RSVP buttons land here next." />
    </PageShell>
  );
}
