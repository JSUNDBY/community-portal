import Link from "next/link";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resident = user ? await ensureProfile(supabase, user) : null;
  const isBoard = resident?.role === "board";

  const { data: items } = await supabase
    .from("announcements")
    .select("id, title, body_md, pinned, published_at, author_id")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <PageShell title="Announcements">
      {isBoard && (
        <div className="mb-4">
          <Link
            href="/announcements/new"
            className="inline-block bg-(--accent) text-white text-[14px] font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition"
          >
            + New announcement
          </Link>
        </div>
      )}
      {!items || items.length === 0 ? (
        <ComingSoon note="No announcements yet." />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="bg-(--paper) border border-(--line) rounded-xl p-5"
            >
              <div className="flex items-baseline gap-2 mb-2">
                {a.pinned && (
                  <span className="text-[11px] tracking-[0.08em] uppercase text-(--accent) font-semibold">
                    Pinned
                  </span>
                )}
                <span className="text-[12px] text-(--ink-softer)">
                  {new Date(a.published_at).toLocaleDateString()}
                </span>
              </div>
              <Link
                href={`/announcements/${a.id}`}
                className="text-[18px] font-semibold text-(--primary) hover:text-(--accent) transition"
              >
                {a.title}
              </Link>
              <p className="text-[14px] text-(--ink-soft) mt-2 line-clamp-3 whitespace-pre-line">
                {a.body_md}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
