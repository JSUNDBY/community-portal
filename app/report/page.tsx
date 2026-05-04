import { cache } from "react";
import { PageShell } from "@/app/_components/PageShell";
import { COMMUNITY } from "@/lib/config";
import { submitReport } from "./actions";

// Anti-bot guard. Bots submit instantly; humans take >2s. We embed
// the render-time epoch in a hidden field and reject submissions where
// (now - rendered) is implausibly small. cache() keeps the value
// stable per request render so React doesn't flag the impure call.
const getRenderedAt = cache(() => Date.now());

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const renderedAt = getRenderedAt();

  return (
    <PageShell title="Report an issue">
      <p className="text-[15px] text-(--ink-soft) mb-6 leading-[1.55]">
        Maintenance, neighbor concerns, or suggestions for the board. Reports
        go to {COMMUNITY.contactEmail}. You can submit anonymously if you
        prefer.
      </p>

      {ok && (
        <div className="text-[14px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          Thanks — the board has been notified.
        </div>
      )}
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form
        action={submitReport}
        className="bg-(--paper) border border-(--line) rounded-xl p-6 space-y-4"
      >
        <input type="hidden" name="rendered_at" value={renderedAt} />
        {/* Honeypot: hidden from real users via aria + tab/visual rules. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
          <label htmlFor="website">Website (leave blank)</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue="maintenance"
            className="w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary)"
          >
            <option value="maintenance">Maintenance</option>
            <option value="dispute">Neighbor dispute</option>
            <option value="suggestion">Suggestion</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            rows={6}
            placeholder="Tell us what's going on…"
            className="w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer)"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-(--accent) hover:opacity-90 text-white font-medium text-[15px] py-3.5 rounded-[10px] transition"
        >
          Submit report
        </button>
      </form>
    </PageShell>
  );
}
