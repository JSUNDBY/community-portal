import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function DocumentUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const resident = await ensureProfile(supabase, user);
  if (resident.role !== "board") redirect("/documents");

  return (
    <PageShell title="Upload document">
      <ComingSoon note="Upload + categorize form lives here." />
    </PageShell>
  );
}
