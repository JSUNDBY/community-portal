import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ensureProfile } from "@/lib/profile";

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes — long enough to start a download, short enough to deter sharing.

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await ensureProfile(supabase, user);

  const { data: d } = await supabase
    .from("documents")
    .select(
      "id, category, title, description, storage_path, file_size_bytes, uploaded_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!d) notFound();

  // Generate the signed URL through service role so the link works
  // even if the resident-side RLS for storage is tightened later. The
  // URL expires in SIGNED_URL_TTL_SECONDS, so this isn't a leak vector.
  const service = createServiceClient();
  const { data: signed } = await service.storage
    .from("documents")
    .createSignedUrl(d.storage_path, SIGNED_URL_TTL_SECONDS, {
      download: true,
    });

  return (
    <PageShell title={d.title}>
      <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
        <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          {labelFor(d.category)}
        </div>
        {d.description && (
          <p className="text-[15px] text-(--primary) mb-4 leading-[1.6] whitespace-pre-line">
            {d.description}
          </p>
        )}
        <div className="text-[13px] text-(--ink-soft) mb-5">
          Uploaded {new Date(d.uploaded_at).toLocaleDateString()}
          {d.file_size_bytes && (
            <> · {formatBytes(d.file_size_bytes)}</>
          )}
        </div>

        {signed?.signedUrl ? (
          <a
            href={signed.signedUrl}
            className="inline-block bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
          >
            Download
          </a>
        ) : (
          <p className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Could not generate a download link. Try refreshing.
          </p>
        )}

        <p className="text-[12px] text-(--ink-softer) mt-3">
          Link expires in {Math.round(SIGNED_URL_TTL_SECONDS / 60)} minutes.
        </p>
      </div>
    </PageShell>
  );
}

function labelFor(category: string): string {
  switch (category) {
    case "governing":
      return "Governing docs";
    case "minutes":
      return "Meeting minutes";
    case "financial":
      return "Financials";
    case "insurance":
      return "Insurance";
    default:
      return "Other";
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
