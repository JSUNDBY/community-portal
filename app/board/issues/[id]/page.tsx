import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { updateIssueStatus } from "./actions";

type IssueDetail = {
  id: string;
  category: string;
  description: string;
  status: "open" | "acknowledged" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
  resident_id: string | null;
  resident: { name: string; email: string; phone: string | null } | null;
};

const NEXT_STATUSES: Record<IssueDetail["status"], IssueDetail["status"][]> = {
  open: ["acknowledged", "resolved", "closed"],
  acknowledged: ["resolved", "closed", "open"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

const STATUS_LABEL: Record<IssueDetail["status"], string> = {
  open: "Open",
  acknowledged: "Working on it",
  resolved: "Resolved",
  closed: "Closed",
};

export default async function IssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  const { data } = await supabase
    .from("issue_reports")
    .select(
      `id, category, description, status, created_at, resolved_at, resident_id,
       resident:residents(name, email, phone)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const issue = data as unknown as IssueDetail;

  return (
    <PageShell title={`${cap(issue.category)} report`}>
      {ok && (
        <div className="text-[14px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          Status updated.
        </div>
      )}
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-4">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--ink-soft) bg-(--line) px-2 py-0.5 rounded">
            {issue.category}
          </span>
          <span className="text-[12px] text-(--ink-softer)">
            {new Date(issue.created_at).toLocaleString()}
          </span>
        </div>
        <p className="text-[15px] text-(--primary) leading-[1.7] whitespace-pre-line">
          {issue.description}
        </p>
      </div>

      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-4">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          Submitted by
        </div>
        {issue.resident ? (
          <div className="text-[14px] text-(--primary) space-y-1">
            <div className="font-medium">{issue.resident.name}</div>
            <a
              href={`mailto:${issue.resident.email}`}
              className="block text-(--accent) hover:underline"
            >
              {issue.resident.email}
            </a>
            {issue.resident.phone && (
              <a
                href={`tel:${issue.resident.phone}`}
                className="block text-(--ink-soft) hover:text-(--accent)"
              >
                {issue.resident.phone}
              </a>
            )}
          </div>
        ) : (
          <p className="text-[14px] text-(--ink-soft)">Anonymous report.</p>
        )}
      </div>

      <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
          Status — {STATUS_LABEL[issue.status]}
        </div>
        <form action={updateIssueStatus} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={issue.id} />
          {NEXT_STATUSES[issue.status].map((next) => (
            <button
              key={next}
              type="submit"
              name="status"
              value={next}
              className="text-[14px] font-medium px-4 py-2 rounded-lg border border-(--line) bg-(--paper) hover:border-(--accent) hover:text-(--accent) transition"
            >
              Mark {STATUS_LABEL[next].toLowerCase()}
            </button>
          ))}
        </form>
      </div>

      <div className="mt-6">
        <Link
          href="/board/issues"
          className="text-[13px] text-(--ink-soft) hover:text-(--accent) transition"
        >
          ← Back to queue
        </Link>
      </div>
    </PageShell>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
