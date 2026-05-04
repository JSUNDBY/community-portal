import { cache } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

// Request-scoped wall-clock read. Server components must be pure;
// `cache()` is React 19's blessed escape hatch for impure reads.
const getNowMs = cache(() => Date.now());

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  category: string;
  recurrence_rule: string | null;
};

type RsvpStatus = "yes" | "no" | "maybe";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  const isBoard = me.role === "board";

  const { data: eventsRaw } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, ends_at, location, category, recurrence_rule")
    .order("starts_at", { ascending: true });

  const events = (eventsRaw as EventRow[] | null) ?? [];
  const now = getNowMs();
  const upcoming = events.filter((e) => endTime(e) >= now);
  const past = events.filter((e) => endTime(e) < now).reverse();

  // Fetch the user's RSVPs in one query so each row can render its
  // own status without N round-trips.
  const ids = events.map((e) => e.id);
  const myRsvps = new Map<string, RsvpStatus>();
  if (ids.length > 0) {
    const { data: mine } = await supabase
      .from("rsvps")
      .select("event_id, status")
      .eq("resident_id", me.id)
      .in("event_id", ids);
    (mine ?? []).forEach((r) => {
      myRsvps.set(r.event_id as string, r.status as RsvpStatus);
    });
  }

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

      {upcoming.length === 0 && past.length === 0 ? (
        <ComingSoon note="No events on the calendar yet." />
      ) : (
        <>
          <Section title="Upcoming" empty="No upcoming events.">
            {upcoming.map((e) => (
              <EventListItem
                key={e.id}
                event={e}
                myStatus={myRsvps.get(e.id) ?? null}
              />
            ))}
          </Section>

          {past.length > 0 && (
            <details className="mt-8 bg-(--paper) border border-(--line) rounded-xl">
              <summary className="px-5 py-4 text-[14px] font-medium text-(--primary) cursor-pointer">
                Past events ({past.length})
              </summary>
              <ul className="divide-y divide-(--line) border-t border-(--line)">
                {past.map((e) => (
                  <EventListItem
                    key={e.id}
                    event={e}
                    myStatus={myRsvps.get(e.id) ?? null}
                    muted
                  />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </PageShell>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = (Array.isArray(children) ? children : [children]).filter(
    Boolean
  );
  return (
    <section>
      <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-5">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  );
}

function EventListItem({
  event,
  myStatus,
  muted,
}: {
  event: EventRow;
  myStatus: RsvpStatus | null;
  muted?: boolean;
}) {
  const start = new Date(event.starts_at);
  const cls = muted
    ? "px-5 py-4 opacity-80"
    : "bg-(--paper) border border-(--line) rounded-xl p-5";
  return (
    <li className={cls}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-(--ink-softer) tracking-[0.04em] uppercase mb-1">
            {start.toLocaleString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {event.recurrence_rule && <span> · recurring</span>}
          </div>
          <Link
            href={`/calendar/${event.id}`}
            className="text-[18px] font-semibold text-(--primary) hover:text-(--accent) transition"
          >
            {event.title}
          </Link>
          {event.location && (
            <div className="text-[14px] text-(--ink-soft) mt-1">
              {event.location}
            </div>
          )}
        </div>
        {myStatus && (
          <RsvpPill status={myStatus} />
        )}
      </div>
    </li>
  );
}

function RsvpPill({ status }: { status: RsvpStatus }) {
  const styles = {
    yes: "text-(--accent) bg-(--accent)/10",
    maybe: "text-(--ink-soft) bg-(--line)",
    no: "text-(--ink-soft) bg-(--line)",
  } as const;
  const label = status === "yes" ? "Going" : status === "maybe" ? "Maybe" : "Not going";
  return (
    <span
      className={`shrink-0 inline-block text-[11px] tracking-[0.06em] uppercase font-semibold px-2 py-1 rounded ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function endTime(e: EventRow): number {
  return new Date(e.ends_at ?? e.starts_at).getTime();
}
