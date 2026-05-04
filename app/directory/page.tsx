import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: residents } = await supabase
    .from("residents")
    .select("id, name, email, phone, share_email, share_phone, unit_id")
    .order("name");

  if (!residents || residents.length === 0) {
    return (
      <PageShell title="Directory">
        <ComingSoon note="No residents in the directory yet. Once the board adds residents and they sign in, they'll appear here." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Directory">
      <ul className="bg-(--paper) border border-(--line) rounded-xl divide-y divide-(--line)">
        {residents.map((r) => (
          <li key={r.id} className="px-5 py-4">
            <div className="font-medium text-(--primary)">{r.name}</div>
            {r.share_email && r.email && (
              <a
                href={`mailto:${r.email}`}
                className="text-[14px] text-(--accent) hover:underline"
              >
                {r.email}
              </a>
            )}
            {r.share_phone && r.phone && (
              <div className="text-[14px] text-(--ink-soft)">{r.phone}</div>
            )}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
