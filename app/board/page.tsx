import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function BoardDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const resident = await ensureProfile(supabase, user);
  if (resident.role !== "board") redirect("/");

  const [
    { count: residentCount },
    { count: pendingInviteCount },
    { count: openIssues },
    { count: announcementCount },
  ] = await Promise.all([
    supabase.from("residents").select("id", { count: "exact", head: true }),
    supabase
      .from("resident_invites")
      .select("id", { count: "exact", head: true })
      .is("claimed_at", null),
    supabase
      .from("issue_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
  ]);

  return (
    <PageShell title="Board dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Residents" value={residentCount ?? 0} />
        <Stat label="Pending invites" value={pendingInviteCount ?? 0} />
        <Stat label="Open issues" value={openIssues ?? 0} />
        <Stat label="Announcements" value={announcementCount ?? 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Action href="/board/invite" label="Invite a resident" />
        <Action href="/board/issues" label="Issue queue" />
        <Action href="/announcements/new" label="New announcement" muted />
        <Action href="/calendar/new" label="New event" muted />
        <Action href="/board/messages" label="Outbound message log" muted />
        <Action href="/directory" label="Resident directory" muted />
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-(--paper) border border-(--line) rounded-xl px-5 py-4">
      <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
        {label}
      </div>
      <div className="text-[26px] font-semibold text-(--primary) tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );
}

function Action({
  href,
  label,
  muted,
}: {
  href: string;
  label: string;
  muted?: boolean;
}) {
  const cls = muted
    ? "block bg-(--paper) border border-(--line) rounded-xl px-5 py-4 text-[15px] font-medium text-(--ink-soft) hover:border-(--accent) hover:text-(--primary) transition"
    : "block bg-(--paper) border border-(--accent)/30 rounded-xl px-5 py-4 text-[15px] font-medium text-(--accent) hover:border-(--accent) transition";
  return (
    <Link href={href} className={cls}>
      {label} →
    </Link>
  );
}
