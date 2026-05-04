import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DEMO_EMAILS = new Set([
  "demo-resident@example.com",
  "demo-board@example.com",
]);

/**
 * Small persistent banner at the top of every page when the visitor is
 * signed in as one of the demo accounts. Reassures prospects that the
 * data is dummy and gives them a quick exit.
 */
export async function DemoBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !DEMO_EMAILS.has(user.email ?? "")) return null;

  return (
    <div className="bg-(--primary) text-white text-[13px]">
      <div className="max-w-3xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        <span>
          <span className="font-semibold">Demo mode.</span>{" "}
          <span className="opacity-90">
            All data is illustrative — feel free to click around and try things.
          </span>
        </span>
        <Link
          href="/about"
          className="shrink-0 underline underline-offset-2 hover:opacity-80"
        >
          About this portal →
        </Link>
      </div>
    </div>
  );
}
