import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { createEvent } from "./actions";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/calendar");

  // Default the start time to "next hour, on the hour" in the user's
  // local zone. <input type="datetime-local"> wants the YYYY-MM-DDTHH:mm
  // shape with no zone — JS Date toISOString gives UTC, which is wrong
  // for the picker. Format manually from local components.
  const defaultStart = nextHourLocal();

  return (
    <PageShell title="New event">
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form
        action={createEvent}
        className="bg-(--paper) border border-(--line) rounded-xl p-6 space-y-4"
      >
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Annual board meeting"
            className={inputCls}
          />
        </Field>

        <Field label="Description" htmlFor="description" hint="Optional. Use blank lines for paragraphs.">
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Agenda, notes, anything residents should know."
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Starts" htmlFor="starts_at">
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={defaultStart}
              className={inputCls}
            />
          </Field>
          <Field label="Ends" htmlFor="ends_at" hint="Optional.">
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Location" htmlFor="location" hint="Optional. Address, room, or Zoom link.">
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Clubhouse, 123 Main St"
            className={inputCls}
          />
        </Field>

        <Field label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            defaultValue="community"
            className={inputCls}
          >
            <option value="community">Community</option>
            <option value="board">Board</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </Field>

        <Field
          label="Recurrence (advanced)"
          htmlFor="recurrence_rule"
          hint='Optional iCal RRULE — e.g. FREQ=MONTHLY;BYMONTHDAY=1. Leave blank for a one-off event.'
        >
          <input
            id="recurrence_rule"
            name="recurrence_rule"
            type="text"
            placeholder="FREQ=MONTHLY;BYMONTHDAY=1"
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
        >
          Publish event
        </button>
      </form>
    </PageShell>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-(--ink-softer) mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition";

function nextHourLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  // YYYY-MM-DDTHH:mm in local time, no zone suffix.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
