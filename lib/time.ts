/**
 * Human-friendly relative time formatting. Returns short, calm strings:
 * "5m ago", "in 3 days", "yesterday", "Tuesday at 7pm".
 *
 * Doesn't try to be Intl.RelativeTimeFormat — too verbose for our UI.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function relativeTime(when: string | Date, now: number = Date.now()): string {
  const t = typeof when === "string" ? new Date(when).getTime() : when.getTime();
  const diff = t - now;
  const abs = Math.abs(diff);
  const past = diff < 0;

  if (abs < MIN) return past ? "just now" : "any moment";
  if (abs < HOUR) {
    const m = Math.round(abs / MIN);
    return past ? `${m}m ago` : `in ${m}m`;
  }
  if (abs < DAY) {
    const h = Math.round(abs / HOUR);
    return past ? `${h}h ago` : `in ${h}h`;
  }
  if (abs < 2 * DAY) return past ? "yesterday" : "tomorrow";
  if (abs < 7 * DAY) {
    const d = Math.round(abs / DAY);
    return past ? `${d} days ago` : `in ${d} days`;
  }
  // Beyond a week → date.
  const d = new Date(t);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  });
}

/** Compact day + time like "Fri, May 22 · 7:00 PM". */
export function eventTime(when: string | Date): string {
  const d = typeof when === "string" ? new Date(when) : when;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
