import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
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

  const [{ count: residentCount }, { count: openIssues }, { count: announcementCount }] =
    await Promise.all([
      supabase.from("residents").select("id", { count: "exact", head: true }),
      supabase
        .from("issue_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      supabase.from("announcements").select("id", { count: "exact", head: true }),
    ]);

  return (
    <PageShell title="Board dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Residents" value={residentCount ?? 0} />
        <Stat label="Open issues" value={openIssues ?? 0} />
        <Stat label="Announcements" value={announcementCount ?? 0} />
      </div>
      <ComingSoon note="Resident invite flow + open issues queue + outbound message audit ship here." />
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
