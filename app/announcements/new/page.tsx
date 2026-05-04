import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function NewAnnouncementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const resident = await ensureProfile(supabase, user);
  if (resident.role !== "board") redirect("/announcements");

  return (
    <PageShell title="New announcement">
      <ComingSoon note="The composer + email/SMS fan-out lives here. Wired up next." />
    </PageShell>
  );
}
