import { notFound } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: d } = await supabase
    .from("documents")
    .select("id, category, title, description, storage_path, file_size_bytes, uploaded_at")
    .eq("id", id)
    .maybeSingle();

  if (!d) notFound();

  return (
    <PageShell title={d.title}>
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          {d.category}
        </div>
        {d.description && (
          <p className="text-[15px] text-(--primary) mb-4 leading-[1.6]">
            {d.description}
          </p>
        )}
        <div className="text-[13px] text-(--ink-soft)">
          Uploaded {new Date(d.uploaded_at).toLocaleDateString()}
        </div>
      </div>
      <div className="mt-4">
        <ComingSoon note="Signed-URL download button wires up next." />
      </div>
    </PageShell>
  );
}
