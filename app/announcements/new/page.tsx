import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { COMMUNITY } from "@/lib/config";
import { publishAnnouncement } from "./actions";

export default async function NewAnnouncementPage({
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
  if (me.role !== "board") redirect("/announcements");

  // Show how many residents will receive each channel so the board
  // sees the blast radius before publishing.
  const [{ count: emailRecipients }, { count: smsRecipients }] = await Promise.all([
    supabase
      .from("residents")
      .select("id", { count: "exact", head: true })
      .eq("notify_email", true),
    supabase
      .from("residents")
      .select("id", { count: "exact", head: true })
      .eq("notify_sms", true),
  ]);

  return (
    <PageShell title="New announcement">
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form
        action={publishAnnouncement}
        className="bg-(--paper) border border-(--line) rounded-xl p-6 space-y-4"
      >
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Pool reopening Friday"
            className={inputCls}
          />
        </Field>

        <Field
          label="Body"
          htmlFor="body_md"
          hint="Use blank lines for paragraphs. Plain text — no markdown formatting yet."
        >
          <textarea
            id="body_md"
            name="body_md"
            rows={8}
            required
            placeholder="What residents should know."
            className={inputCls}
          />
        </Field>

        <div className="flex flex-wrap gap-4 pt-2">
          <Toggle name="pinned" defaultChecked={false}>
            Pin to top
          </Toggle>
          <Toggle name="send_email" defaultChecked>
            Email residents who opted in ({emailRecipients ?? 0})
          </Toggle>
          <Toggle name="send_sms" defaultChecked={false}>
            Text residents who opted in ({smsRecipients ?? 0})
          </Toggle>
        </div>

        <p className="text-[12px] text-(--ink-softer) leading-[1.5]">
          Email comes from {COMMUNITY.emailFrom}. SMS only goes to residents
          with an active TCPA consent on file. Every send is logged.
        </p>

        <button
          type="submit"
          className="bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
        >
          Publish
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

function Toggle({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-[14px] text-(--primary) cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{children}</span>
    </label>
  );
}

const inputCls =
  "w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition";
