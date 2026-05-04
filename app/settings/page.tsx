import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const resident = await ensureProfile(supabase, user);

  return (
    <PageShell title="Settings">
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-4">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          Account
        </div>
        <div className="text-[15px] text-(--primary)">{resident.name}</div>
        <div className="text-[14px] text-(--ink-soft)">{resident.email}</div>
        {resident.role === "board" && (
          <div className="mt-2 inline-block text-[11px] tracking-[0.08em] uppercase text-(--accent) font-semibold">
            Board member
          </div>
        )}
      </div>

      <ComingSoon note="Profile editor + SMS opt-in flow + notification preferences ship here." />
    </PageShell>
  );
}
