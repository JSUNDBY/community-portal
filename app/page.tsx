import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { COMMUNITY } from "@/lib/config";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicLanding />;
  }

  const resident = await ensureProfile(supabase, user);
  return <ResidentHome resident={resident} />;
}

function PublicLanding() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[480px] text-center">
        <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          Resident portal
        </p>
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-(--primary) mb-3 leading-tight">
          {COMMUNITY.name}
        </h1>
        <p className="text-[16px] text-(--ink-soft) leading-[1.55] mb-8">
          This portal is for {COMMUNITY.name}{" "}residents. Sign in below,
          or contact the board if you haven&rsquo;t been added yet.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="bg-(--accent) hover:opacity-90 text-white font-medium text-[15px] py-3.5 rounded-[10px] transition"
          >
            Sign in
          </Link>
          <a
            href={`mailto:${COMMUNITY.contactEmail}`}
            className="text-[14px] text-(--ink-soft) hover:text-(--accent) transition"
          >
            Contact the board →
          </a>
        </div>
      </div>
    </main>
  );
}

function ResidentHome({
  resident,
}: {
  resident: { name: string; unit_id: string | null; role: "resident" | "board" };
}) {
  const isBoard = resident.role === "board";
  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold">
          {COMMUNITY.name}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-(--primary) mt-1">
          Welcome back, {resident.name.split(" ")[0]}.
        </h1>
        {!resident.unit_id && (
          <p className="mt-3 text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-4">
            Your account isn&rsquo;t linked to a unit yet.{" "}
            <a
              href={`mailto:${COMMUNITY.contactEmail}`}
              className="text-(--accent) underline underline-offset-2"
            >
              Contact the board
            </a>{" "}
            to get added.
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Tile href="/announcements" label="Announcements" />
        <Tile href="/calendar" label="Calendar" />
        <Tile href="/directory" label="Directory" />
        <Tile href="/documents" label="Documents" />
        <Tile href="/report" label="Report an issue" />
        <Tile href="/settings" label="Settings" />
        {isBoard && <Tile href="/board" label="Board dashboard" highlight />}
      </section>

      <footer className="mt-10 text-[13px] text-(--ink-soft)">
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="underline underline-offset-2">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  );
}

function Tile({
  href,
  label,
  highlight,
}: {
  href: string;
  label: string;
  highlight?: boolean;
}) {
  const base =
    "block bg-(--paper) border border-(--line) rounded-xl px-5 py-6 text-[16px] font-medium hover:border-(--accent) transition";
  const highlightCls = highlight
    ? " text-(--accent) border-(--accent)/40"
    : " text-(--primary)";
  return (
    <Link href={href} className={base + highlightCls}>
      {label} →
    </Link>
  );
}
