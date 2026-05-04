import { createClient } from "@/lib/supabase/server";

/**
 * Renders a sign-out button at the bottom of every page that uses
 * PageShell. No-op for anonymous visitors (the public report form,
 * the public landing) — they have nothing to sign out of.
 */
export async function SignOutFooter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <footer className="mt-12 pt-6 border-t border-(--line) flex items-center justify-between gap-3 text-[13px] text-(--ink-soft)">
      <span className="truncate">{user.email}</span>
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
