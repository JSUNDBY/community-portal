import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

type IssueRow = {
  id: string;
  category: string;
  description: string;
  status: "open" | "acknowledged" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
  resident_id: string | null;
  resident: { name: string; email: string } | null;
};

const STATUS_TABS: { key: IssueRow["status"] | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Working" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export default async function IssueQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusRaw } = await searchParams;
  const activeStatus = isStatusKey(statusRaw) ? statusRaw : "open";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  let query = supabase
    .from("issue_reports")
    .select(
      `id, category, description, status, created_at, resolved_at, resident_id,
       resident:residents(name, email)`
    )
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: rows } = await query;
  const issues = (rows as unknown as IssueRow[] | null) ?? [];

  return (
    <PageShell title="Issue queue">
      <nav className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === activeStatus;
          const cls = active
            ? "bg-(--accent) text-white border-(--accent)"
            : "bg-(--paper) text-(--ink-soft) border-(--line) hover:border-(--accent) hover:text-(--primary)";
          const href = tab.key === "all" ? "/board/issues" : `/board/issues?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`text-[13px] font-medium px-3.5 py-2 rounded-lg border transition ${cls}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {issues.length === 0 ? (
        <p className="text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-5">
          {activeStatus === "open"
            ? "No open issues. Everything's handled."
            : "No issues with that status."}
        </p>
      ) : (
        <ul className="space-y-3">
          {issues.map((i) => (
            <li
              key={i.id}
              className="bg-(--paper) border border-(--line) rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <CategoryBadge category={i.category} />
                  <StatusBadge status={i.status} />
                </div>
                <div className="text-[12px] text-(--ink-softer) shrink-0">
                  {new Date(i.created_at).toLocaleDateString()}
                </div>
              </div>
              <Link
                href={`/board/issues/${i.id}`}
                className="block text-[15px] text-(--primary) hover:text-(--accent) leading-[1.55] line-clamp-3 whitespace-pre-line"
              >
                {i.description}
              </Link>
              <div className="text-[12px] text-(--ink-softer) mt-2">
                {i.resident
                  ? `From ${i.resident.name} (${i.resident.email})`
                  : "Anonymous"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function isStatusKey(s: unknown): s is IssueRow["status"] | "all" {
  return (
    s === "open" ||
    s === "acknowledged" ||
    s === "resolved" ||
    s === "closed" ||
    s === "all"
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--ink-soft) bg-(--line) px-2 py-0.5 rounded">
      {category}
    </span>
  );
}

function StatusBadge({ status }: { status: IssueRow["status"] }) {
  const map = {
    open: "text-orange-700 bg-orange-50",
    acknowledged: "text-(--accent) bg-(--accent)/10",
    resolved: "text-green-700 bg-green-50",
    closed: "text-(--ink-soft) bg-(--line)",
  } as const;
  return (
    <span
      className={`text-[10px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded ${map[status]}`}
    >
      {status}
    </span>
  );
}
