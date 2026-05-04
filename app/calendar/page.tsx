import Link from "next/link";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resident = user ? await ensureProfile(supabase, user) : null;
  const isBoard = resident?.role === "board";

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, location, category")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  return (
    <PageShell title="Calendar">
      {isBoard && (
        <div className="mb-4">
          <Link
            href="/calendar/new"
            className="inline-block bg-(--accent) text-white text-[14px] font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition"
          >
            + New event
          </Link>
        </div>
      )}
      {!events || events.length === 0 ? (
        <ComingSoon note="No upcoming events." />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li
              key={e.id}
              className="bg-(--paper) border border-(--line) rounded-xl p-5"
            >
              <div className="text-[12px] text-(--ink-softer) tracking-[0.04em] uppercase mb-1">
                {new Date(e.starts_at).toLocaleString()}
              </div>
              <Link
                href={`/calendar/${e.id}`}
                className="text-[18px] font-semibold text-(--primary) hover:text-(--accent) transition"
              >
                {e.title}
              </Link>
              {e.location && (
                <div className="text-[14px] text-(--ink-soft) mt-1">
                  {e.location}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
