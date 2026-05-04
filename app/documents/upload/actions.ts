"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ensureProfile } from "@/lib/profile";

const CATEGORIES = new Set([
  "governing",
  "minutes",
  "financial",
  "insurance",
  "other",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/documents");

  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const categoryRaw = String(formData.get("category") ?? "other").trim();
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : "other";
  const file = formData.get("file");

  if (!title) {
    redirect(
      "/documents/upload?error=" + encodeURIComponent("Title is required.")
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/documents/upload?error=" + encodeURIComponent("Pick a file to upload.")
    );
  }
  if (file.size > MAX_BYTES) {
    redirect(
      "/documents/upload?error=" +
        encodeURIComponent(
          `File is too large (${(file.size / 1024 / 1024).toFixed(
            1
          )} MB). 25 MB limit.`
        )
    );
  }

  const safeName = sanitizeFilename(file.name || "document");
  const path = `${category}/${crypto.randomUUID()}-${safeName}`;

  // Service-role client for storage write — RLS storage policy gates
  // on is_board() at the SQL layer, but going through service role
  // here avoids a JWT round-trip and keeps the upload deterministic
  // even if the policy ever changes shape.
  const service = createServiceClient();

  const { error: uploadErr } = await service.storage
    .from("documents")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadErr) {
    redirect(
      "/documents/upload?error=" + encodeURIComponent(uploadErr.message)
    );
  }

  const { data: row, error: insertErr } = await service
    .from("documents")
    .insert({
      uploaded_by: me.id,
      category,
      title,
      description,
      storage_path: path,
      file_size_bytes: file.size,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    // The file is already in storage. Surface the row failure but don't
    // delete the blob — board can re-attempt the metadata insert via a
    // re-upload (with the same content) or via SQL.
    redirect(
      "/documents/upload?error=" +
        encodeURIComponent(
          insertErr?.message ?? "File saved, but metadata insert failed."
        )
    );
  }

  revalidatePath("/documents");
  redirect(`/documents/${row.id}`);
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "document";
}
