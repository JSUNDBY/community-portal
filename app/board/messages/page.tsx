import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

const PAGE_SIZE = 50;

type MessageRow = {
  id: string;
  channel: "email" | "sms";
  recipient: string;
  subject: string | null;
  body: string;
  related_to: string | null;
  status: "queued" | "sent" | "failed" | "skipped";
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

const CHANNEL_TABS: { key: "all" | "email" | "sms"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

export default async function MessagesAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; page?: string }>;
}) {
  const { channel: channelRaw, page: pageRaw } = await searchParams;
  const channel: "all" | "email" | "sms" =
    channelRaw === "email" || channelRaw === "sms" ? channelRaw : "all";
  const page = Math.max(1, Number(pageRaw) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  let query = supabase
    .from("outbound_messages")
    .select(
      "id, channel, recipient, subject, body, related_to, status, error, sent_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (channel !== "all") query = query.eq("channel", channel);

  const { data: rows, count } = await query;
  const messages = (rows as MessageRow[] | null) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageShell title="Outbound messages">
      <p className="text-[13px] text-(--ink-soft) mb-5">
        Every email and SMS the portal has sent (or attempted). Useful for
        debugging delivery issues, confirming SMS opt-outs landed, or
        proving an announcement actually went out.
      </p>

      <nav className="flex flex-wrap gap-2 mb-5">
        {CHANNEL_TABS.map((t) => {
          const active = t.key === channel;
          const cls = active
            ? "bg-(--accent) text-white border-(--accent)"
            : "bg-(--paper) text-(--ink-soft) border-(--line) hover:border-(--accent)";
          const href =
            t.key === "all" ? "/board/messages" : `/board/messages?channel=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={`text-[13px] font-medium px-3.5 py-2 rounded-lg border transition ${cls}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {messages.length === 0 ? (
        <p className="text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-5">
          No messages yet.
        </p>
      ) : (
        <ul className="bg-(--paper) border border-(--line) rounded-xl divide-y divide-(--line)">
          {messages.map((m) => (
            <li key={m.id} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <ChannelBadge channel={m.channel} />
                  <StatusBadge status={m.status} />
                  <span className="text-[14px] text-(--primary) font-medium break-all">
                    {m.recipient}
                  </span>
                </div>
                <span className="text-[12px] text-(--ink-softer) shrink-0">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              {m.subject && (
                <div className="text-[13px] text-(--ink-soft) mt-1">
                  Subject: {m.subject}
                </div>
              )}
              <div className="text-[12px] text-(--ink-softer) mt-1 flex flex-wrap gap-x-3">
                {m.related_to && <span>Ref: {m.related_to}</span>}
                {m.sent_at && (
                  <span>Sent {new Date(m.sent_at).toLocaleString()}</span>
                )}
              </div>
              {m.error && (
                <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mt-2 break-all">
                  {m.error}
                </div>
              )}
              {m.channel === "sms" && (
                <div className="text-[13px] text-(--primary) mt-2 whitespace-pre-line break-words">
                  {m.body.length > 200 ? m.body.slice(0, 200) + "…" : m.body}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          channel={channel}
        />
      )}
    </PageShell>
  );
}

function ChannelBadge({ channel }: { channel: "email" | "sms" }) {
  const cls =
    channel === "email"
      ? "text-(--accent) bg-(--accent)/10"
      : "text-(--primary) bg-(--line)";
  return (
    <span
      className={`text-[10px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded ${cls}`}
    >
      {channel}
    </span>
  );
}

function StatusBadge({ status }: { status: MessageRow["status"] }) {
  const map = {
    sent: "text-green-700 bg-green-50",
    queued: "text-orange-700 bg-orange-50",
    failed: "text-red-700 bg-red-50",
    skipped: "text-(--ink-soft) bg-(--line)",
  } as const;
  return (
    <span
      className={`text-[10px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded ${map[status]}`}
    >
      {status}
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  channel,
}: {
  page: number;
  totalPages: number;
  channel: "all" | "email" | "sms";
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (channel !== "all") sp.set("channel", channel);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/board/messages?${qs}` : "/board/messages";
  };
  return (
    <div className="flex items-center justify-between mt-5 text-[13px]">
      <span className="text-(--ink-soft)">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="px-3 py-1.5 rounded-lg border border-(--line) hover:border-(--accent) hover:text-(--accent) transition"
          >
            ← Newer
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-(--line) hover:border-(--accent) hover:text-(--accent) transition"
          >
            Older →
          </Link>
        )}
      </div>
    </div>
  );
}
