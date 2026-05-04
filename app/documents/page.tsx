import Link from "next/link";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resident = user ? await ensureProfile(supabase, user) : null;
  const isBoard = resident?.role === "board";

  const { data: docs } = await supabase
    .from("documents")
    .select("id, category, title, description, uploaded_at")
    .order("uploaded_at", { ascending: false });

  return (
    <PageShell title="Documents">
      {isBoard && (
        <div className="mb-4">
          <Link
            href="/documents/upload"
            className="inline-block bg-(--accent) text-white text-[14px] font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition"
          >
            + Upload document
          </Link>
        </div>
      )}
      {!docs || docs.length === 0 ? (
        <ComingSoon note="No documents uploaded yet." />
      ) : (
        <ul className="bg-(--paper) border border-(--line) rounded-xl divide-y divide-(--line)">
          {docs.map((d) => (
            <li key={d.id} className="px-5 py-4">
              <div className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
                {d.category}
              </div>
              <Link
                href={`/documents/${d.id}`}
                className="text-[16px] font-medium text-(--primary) hover:text-(--accent)"
              >
                {d.title}
              </Link>
              {d.description && (
                <p className="text-[13px] text-(--ink-soft) mt-1">
                  {d.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
