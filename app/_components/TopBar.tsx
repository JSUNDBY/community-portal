import Image from "next/image";
import Link from "next/link";
import { COMMUNITY } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Site-wide top bar. Shows the community wordmark on the left + a
 * sign-in or sign-out action on the right. Renders on every route
 * (it's mounted in the root layout) so the brand is consistent
 * regardless of where in the portal the resident lands.
 */
export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-(--paper) border-b border-(--line)">
      <div className="max-w-4xl mx-auto px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={COMMUNITY.name}
          className="flex items-center shrink-0"
        >
          <Image
            src="/logo.png"
            alt={COMMUNITY.name}
            width={520}
            height={156}
            priority
            className="h-24 sm:h-32 w-auto"
          />
        </Link>
        {user ? (
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="text-[13px] text-(--ink-soft) hover:text-(--accent) underline-offset-2 hover:underline transition"
            >
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="text-[13px] text-(--ink-soft) hover:text-(--accent) underline-offset-2 hover:underline transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
