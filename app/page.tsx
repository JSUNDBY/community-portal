import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, type Resident } from "@/lib/profile";
import { COMMUNITY } from "@/lib/config";
import { relativeTime, eventTime } from "@/lib/time";
import { signInAsDemo } from "@/app/login/actions";

const getNowMs = cache(() => Date.now());

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicLanding />;
  }

  const resident = await ensureProfile(supabase, user);
  return <ResidentHome resident={resident} />;
}

function PublicLanding() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Heading is visually replaced by the hero image (which has the
          Sandstone Ridge wordmark baked in), but kept for screen readers
          and crawlers. */}
      <h1 className="sr-only">{COMMUNITY.name}</h1>

      <div className="relative w-full aspect-[3/2] sm:aspect-[2/1] max-h-[640px] overflow-hidden">
        <Image
          src="/hero.png"
          alt={`Entrance to ${COMMUNITY.name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] text-center">
          <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
            Resident portal
          </p>
          <p className="text-[16px] text-(--ink-soft) leading-[1.55] mb-8">
            Sign in below, or contact the board if you haven&rsquo;t been
            added yet.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="bg-(--accent) hover:opacity-90 text-white font-medium text-[15px] py-3.5 rounded-[10px] transition"
            >
              Sign in
            </Link>
            <a
              href={`mailto:${COMMUNITY.contactEmail}`}
              className="text-[14px] text-(--ink-soft) hover:text-(--accent) transition"
            >
              Contact the board →
            </a>
          </div>

          <div className="mt-10 pt-6 border-t border-(--line)">
            <p className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
              Just looking around?
            </p>
            <form action={signInAsDemo} className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="submit"
                name="role"
                value="board"
                className="text-[14px] font-medium text-(--primary) bg-(--paper) border border-(--line) hover:border-(--accent) hover:text-(--accent) px-4 py-2.5 rounded-lg transition"
              >
                Tour as a board member
              </button>
              <button
                type="submit"
                name="role"
                value="resident"
                className="text-[14px] font-medium text-(--primary) bg-(--paper) border border-(--line) hover:border-(--accent) hover:text-(--accent) px-4 py-2.5 rounded-lg transition"
              >
                Tour as a resident
              </button>
            </form>
            <p className="text-[12px] text-(--ink-softer) mt-3">
              Both demo accounts share the same data. Anything you change is fine to test.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

type AnnouncementCardData = {
  id: string;
  title: string;
  body_md: string;
  pinned: boolean;
  published_at: string;
  author: { name: string } | null;
};

type EventCardData = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

async function ResidentHome({ resident }: { resident: Resident }) {
  const supabase = await createClient();
  const isBoard = resident.role === "board";
  const now = getNowMs();
  const nowIso = new Date(now).toISOString();

  // Pull a small bundle of "what's happening" content. All in parallel.
  const [
    { data: announcementsRaw },
    { data: nextEventRaw },
    { data: myUpcomingRsvpsRaw },
    boardCounts,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select(
        `id, title, body_md, pinned, published_at,
         author:residents!announcements_author_id_fkey(name)`
      )
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(4),
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, location")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rsvps")
      .select(
        `status, event:calendar_events!inner(id, title, starts_at)`
      )
      .eq("resident_id", resident.id)
      .gte("event.starts_at", nowIso)
      .limit(3),
    isBoard
      ? Promise.all([
          supabase.from("residents").select("id", { count: "exact", head: true }),
          supabase
            .from("issue_reports")
            .select("id", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("resident_invites")
            .select("id", { count: "exact", head: true })
            .is("claimed_at", null),
        ])
      : Promise.resolve(null),
  ]);

  const announcements =
    (announcementsRaw as unknown as AnnouncementCardData[] | null) ?? [];
  const pinned = announcements.find((a) => a.pinned) ?? null;
  const recent = announcements.filter((a) => a.id !== pinned?.id).slice(0, 3);
  const nextEvent = nextEventRaw as EventCardData | null;
  const myRsvpCount = (myUpcomingRsvpsRaw ?? []).length;

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold">
            {COMMUNITY.name}
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] text-(--primary) mt-1 leading-tight">
            Hello, {resident.name.split(" ")[0]}.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {isBoard && <RolePill>Board</RolePill>}
          {resident.unit_id && <UnitPill>Your unit</UnitPill>}
        </div>
      </header>

      {!resident.unit_id && (
        <div className="mb-6 text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-4">
          Your account isn&rsquo;t linked to a unit yet.{" "}
          <a
            href={`mailto:${COMMUNITY.contactEmail}`}
            className="text-(--accent) underline underline-offset-2"
          >
            Contact the board
          </a>{" "}
          to get added.
        </div>
      )}

      {pinned && <PinnedAnnouncementCard a={pinned} now={now} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <NextEventCard e={nextEvent} myRsvpCount={myRsvpCount} now={now} />
        {isBoard && boardCounts ? (
          <BoardSnapshotCard
            residents={boardCounts[0].count ?? 0}
            openIssues={boardCounts[1].count ?? 0}
            pendingInvites={boardCounts[2].count ?? 0}
          />
        ) : (
          <DirectoryTeaserCard residentCount={null} />
        )}
      </div>

      {recent.length > 0 && (
        <section className="mb-8">
          <SectionLabel
            title="Recent announcements"
            href="/announcements"
            cta="See all"
          />
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recent.map((a) => (
              <li
                key={a.id}
                className="bg-(--paper) border border-(--line) rounded-xl p-4 hover:border-(--accent) transition"
              >
                <Link href={`/announcements/${a.id}`} className="block">
                  <div className="text-[11px] tracking-[0.04em] uppercase text-(--ink-softer) font-semibold mb-1">
                    {relativeTime(a.published_at, now)}
                  </div>
                  <div className="text-[15px] font-medium text-(--primary) leading-snug line-clamp-2">
                    {a.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav>
        <SectionLabel title="Everything else" />
        <div className="flex flex-wrap gap-2">
          <NavPill href="/calendar">Calendar</NavPill>
          <NavPill href="/directory">Directory</NavPill>
          <NavPill href="/documents">Documents</NavPill>
          <NavPill href="/report">Report an issue</NavPill>
          <NavPill href="/settings">Settings</NavPill>
          {isBoard && <NavPill href="/board" accent>Board dashboard</NavPill>}
        </div>
      </nav>

    </main>
  );
}

function PinnedAnnouncementCard({
  a,
  now,
}: {
  a: AnnouncementCardData;
  now: number;
}) {
  return (
    <Link
      href={`/announcements/${a.id}`}
      className="block bg-(--paper) border border-(--line) rounded-xl p-6 mb-4 hover:border-(--accent) transition relative overflow-hidden"
    >
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-(--accent)" aria-hidden />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--accent) bg-(--accent)/10 px-2 py-0.5 rounded">
            Pinned
          </span>
          <span className="text-[12px] text-(--ink-softer)">
            {relativeTime(a.published_at, now)}
            {a.author?.name && <> · {a.author.name}</>}
          </span>
        </div>
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-(--primary) mb-2 leading-snug">
          {a.title}
        </h2>
        <p className="text-[14px] text-(--ink-soft) leading-[1.55] line-clamp-3 whitespace-pre-line">
          {a.body_md}
        </p>
        <span className="inline-block text-[13px] text-(--accent) font-medium mt-3">
          Read →
        </span>
      </div>
    </Link>
  );
}

function NextEventCard({
  e,
  myRsvpCount,
  now,
}: {
  e: EventCardData | null;
  myRsvpCount: number;
  now: number;
}) {
  if (!e) {
    return (
      <Link
        href="/calendar"
        className="block bg-(--paper) border border-(--line) rounded-xl p-5 hover:border-(--accent) transition"
      >
        <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
          Calendar
        </div>
        <div className="text-[15px] text-(--primary) font-medium">
          No upcoming events.
        </div>
        <div className="text-[13px] text-(--ink-soft) mt-1">
          Check back soon →
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={`/calendar/${e.id}`}
      className="block bg-(--paper) border border-(--line) rounded-xl p-5 hover:border-(--accent) transition"
    >
      <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
        Up next · {relativeTime(e.starts_at, now)}
      </div>
      <div className="text-[16px] text-(--primary) font-semibold leading-snug">
        {e.title}
      </div>
      <div className="text-[13px] text-(--ink-soft) mt-1">
        {eventTime(e.starts_at)}
      </div>
      {e.location && (
        <div className="text-[13px] text-(--ink-soft)">{e.location}</div>
      )}
      {myRsvpCount > 0 && (
        <div className="text-[12px] text-(--accent) mt-2">
          You&rsquo;re on {myRsvpCount} RSVP{myRsvpCount === 1 ? "" : "s"} this month
        </div>
      )}
    </Link>
  );
}

function BoardSnapshotCard({
  residents,
  openIssues,
  pendingInvites,
}: {
  residents: number;
  openIssues: number;
  pendingInvites: number;
}) {
  return (
    <Link
      href="/board"
      className="block bg-(--paper) border border-(--line) rounded-xl p-5 hover:border-(--accent) transition"
    >
      <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
        Board snapshot
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Residents" value={residents} />
        <Stat label="Open issues" value={openIssues} accent={openIssues > 0} />
        <Stat label="Pending" value={pendingInvites} />
      </div>
      <div className="text-[12px] text-(--accent) mt-3">
        Open dashboard →
      </div>
    </Link>
  );
}

function DirectoryTeaserCard({ residentCount }: { residentCount: number | null }) {
  return (
    <Link
      href="/directory"
      className="block bg-(--paper) border border-(--line) rounded-xl p-5 hover:border-(--accent) transition"
    >
      <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
        Your neighbors
      </div>
      <div className="text-[16px] text-(--primary) font-semibold">
        {residentCount ? `${residentCount} residents` : "Find someone"}
      </div>
      <div className="text-[13px] text-(--ink-soft) mt-1">
        Names, units, opt-in contact info →
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-[22px] font-semibold tracking-[-0.02em] leading-none ${
          accent ? "text-(--accent)" : "text-(--primary)"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-(--ink-softer) tracking-[0.04em] uppercase mt-1">
        {label}
      </div>
    </div>
  );
}

function SectionLabel({
  title,
  href,
  cta,
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold">
        {title}
      </h2>
      {href && cta && (
        <Link
          href={href}
          className="text-[12px] text-(--ink-soft) hover:text-(--accent) transition"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}

function NavPill({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  const cls = accent
    ? "bg-(--paper) text-(--accent) border-(--accent)/30"
    : "bg-(--paper) text-(--primary) border-(--line)";
  return (
    <Link
      href={href}
      className={`text-[14px] font-medium px-3.5 py-2 rounded-lg border hover:border-(--accent) hover:text-(--accent) transition ${cls}`}
    >
      {children}
    </Link>
  );
}

function RolePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--accent) bg-(--accent)/10 px-2 py-1 rounded">
      {children}
    </span>
  );
}

function UnitPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--ink-soft) bg-(--line) px-2 py-1 rounded">
      {children}
    </span>
  );
}
