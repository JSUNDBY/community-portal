import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { recordRsvp } from "./actions";

type RsvpStatus = "yes" | "no" | "maybe";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  category: string;
  recurrence_rule: string | null;
};

type RsvpRow = {
  resident_id: string;
  status: RsvpStatus;
  resident: { name: string } | null;
};

export default async function EventDetailPage({
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

  const { data: e } = await supabase
    .from("calendar_events")
    .select(
      "id, title, description, starts_at, ends_at, location, category, recurrence_rule"
    )
    .eq("id", id)
    .maybeSingle();

  if (!e) notFound();
  const event = e as EventRow;

  const [{ data: rsvpsRaw }, { data: myRsvpRaw }] = await Promise.all([
    supabase
      .from("rsvps")
      .select(
        `resident_id, status,
         resident:residents(name)`
      )
      .eq("event_id", id),
    supabase
      .from("rsvps")
      .select("status")
      .eq("event_id", id)
      .eq("resident_id", me.id)
      .maybeSingle(),
  ]);

  const rsvps = (rsvpsRaw as unknown as RsvpRow[] | null) ?? [];
  const myStatus = (myRsvpRaw?.status ?? null) as RsvpStatus | null;

  const counts = countByStatus(rsvps);
  const yesList = rsvps.filter((r) => r.status === "yes");

  return (
    <PageShell title={event.title}>
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-5">
        <div className="text-[14px] text-(--ink-soft) space-y-1 mb-3">
          <div>
            <span className="font-medium text-(--primary)">When:</span>{" "}
            {formatRange(event.starts_at, event.ends_at)}
          </div>
          {event.location && (
            <div>
              <span className="font-medium text-(--primary)">Where:</span>{" "}
              {event.location}
            </div>
          )}
          {event.recurrence_rule && (
            <div>
              <span className="font-medium text-(--primary)">Recurs:</span>{" "}
              <code className="text-[13px] text-(--ink-soft)">
                {event.recurrence_rule}
              </code>
            </div>
          )}
        </div>
        {event.description && (
          <p className="text-[15px] text-(--primary) leading-[1.6] whitespace-pre-line mb-4">
            {event.description}
          </p>
        )}
        <a
          href={`/calendar/${event.id}/ics`}
          className="inline-block text-[13px] text-(--accent) hover:underline underline-offset-2"
        >
          Add to my calendar (.ics)
        </a>
      </div>

      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-5">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
          RSVP
        </div>
        <form action={recordRsvp} className="flex flex-wrap gap-2">
          <input type="hidden" name="event_id" value={event.id} />
          <RsvpButton value="yes" current={myStatus} />
          <RsvpButton value="maybe" current={myStatus} />
          <RsvpButton value="no" current={myStatus} />
        </form>
        <div className="text-[13px] text-(--ink-soft) mt-3">
          {counts.yes} yes · {counts.maybe} maybe · {counts.no} no
        </div>
      </div>

      {yesList.length > 0 && (
        <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
          <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
            Going ({yesList.length})
          </div>
          <ul className="text-[14px] text-(--primary) space-y-1">
            {yesList.map((r) => (
              <li key={r.resident_id}>{r.resident?.name ?? "Resident"}</li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}

function RsvpButton({
  value,
  current,
}: {
  value: RsvpStatus;
  current: RsvpStatus | null;
}) {
  const active = current === value;
  const label = value === "yes" ? "Going" : value === "maybe" ? "Maybe" : "Can't make it";
  const cls = active
    ? "bg-(--accent) text-white border-(--accent)"
    : "bg-(--paper) text-(--primary) border-(--line) hover:border-(--accent)";
  return (
    <button
      type="submit"
      name="status"
      value={value}
      className={`text-[14px] font-medium px-4 py-2 rounded-lg border transition ${cls}`}
    >
      {label}
    </button>
  );
}

function countByStatus(rsvps: { status: RsvpStatus }[]) {
  return rsvps.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { yes: 0, no: 0, maybe: 0 }
  );
}

function formatRange(start: string, end: string | null): string {
  const s = new Date(start);
  if (!end) return s.toLocaleString();
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  if (sameDay) {
    return `${s.toLocaleString()} – ${e.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  return `${s.toLocaleString()} – ${e.toLocaleString()}`;
}
