import { createClient } from "@/lib/supabase/server";

const DEMO_EMAILS = new Set([
  "demo-resident@example.com",
  "demo-board@example.com",
]);

/**
 * Renders a sign-out button at the bottom of every page that uses
 * PageShell. No-op for anonymous visitors (the public report form,
 * the public landing) — they have nothing to sign out of. Demo
 * accounts get a small "demo mode" pill so prospects don't get
 * confused about whether they're seeing real data.
 */
export async function SignOutFooter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const isDemo = DEMO_EMAILS.has(user.email ?? "");

  return (
    <footer className="mt-12 pt-6 border-t border-(--line) flex items-center justify-between gap-3 text-[13px] text-(--ink-soft)">
      <span className="truncate flex items-center gap-2">
        {user.email}
        {isDemo && (
          <span className="text-[10px] tracking-[0.08em] uppercase font-semibold text-(--accent) bg-(--accent)/10 px-2 py-0.5 rounded">
            Demo
          </span>
        )}
      </span>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="hover:text-(--accent) underline underline-offset-2 transition"
        >
          Sign out
        </button>
      </form>
    </footer>
  );
}
