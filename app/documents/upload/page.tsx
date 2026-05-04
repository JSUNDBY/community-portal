import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { uploadDocument } from "./actions";

export default async function DocumentUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/documents");

  return (
    <PageShell title="Upload document">
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form
        action={uploadDocument}
        encType="multipart/form-data"
        className="bg-(--paper) border border-(--line) rounded-xl p-6 space-y-4"
      >
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="2026 Annual Budget"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" htmlFor="category">
            <select
              id="category"
              name="category"
              defaultValue="governing"
              className={inputCls}
            >
              <option value="governing">Governing docs</option>
              <option value="minutes">Meeting minutes</option>
              <option value="financial">Financials</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field
            label="File"
            htmlFor="file"
            hint="PDF preferred. Max 25 MB."
          >
            <input
              id="file"
              name="file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              className="w-full text-[14px] text-(--primary) file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-(--accent) file:text-white file:font-medium file:hover:opacity-90 file:cursor-pointer"
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="description" hint="Optional. What is this and when does it apply?">
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Approved at the March 2026 board meeting."
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
        >
          Upload
        </button>
      </form>
    </PageShell>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-(--ink-softer) mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition";
