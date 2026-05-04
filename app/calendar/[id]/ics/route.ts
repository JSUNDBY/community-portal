import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY } from "@/lib/config";

export const runtime = "nodejs";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  recurrence_rule: string | null;
};

/**
 * Per-event iCalendar download. Residents drop this into Apple Calendar,
 * Google Calendar, Outlook, etc. and get a real calendar entry that
 * doesn't depend on the portal staying online.
 *
 * Auth: same RLS as the rest of /calendar — authenticated residents only.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const { data } = await supabase
    .from("calendar_events")
    .select(
      "id, title, description, starts_at, ends_at, location, recurrence_rule"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return new NextResponse("not found", { status: 404 });
  const event = data as EventRow;

  const ics = renderIcs(event);
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slugify(event.title)}.ics"`,
    },
  });
}

function renderIcs(e: EventRow): string {
  const start = new Date(e.starts_at);
  const end = new Date(e.ends_at ?? new Date(start.getTime() + 60 * 60 * 1000).toISOString());
  // VCALENDAR requires CRLF line endings.
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${COMMUNITY.name} Portal//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@${COMMUNITY.slug}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    e.description ? `DESCRIPTION:${escapeIcs(e.description)}` : null,
    e.location ? `LOCATION:${escapeIcs(e.location)}` : null,
    e.recurrence_rule ? `RRULE:${e.recurrence_rule}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  return lines.join("\r\n");
}

function formatIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  // Per RFC 5545 — backslash, semicolon, comma, newline are special.
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}
