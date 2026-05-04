import { COMMUNITY } from "@/lib/config";
import { sendMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; email?: string }>;
}) {
  const { error, next, email } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
            Resident portal
          </p>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-(--primary)">
            {COMMUNITY.name}
          </h1>
        </div>

        <div className="bg-(--paper) border border-(--line) rounded-2xl p-8 sm:p-10 shadow-[0_2px_6px_rgba(0,0,0,0.04),0_28px_64px_rgba(30,30,30,0.06)]">
          <h2 className="text-[22px] font-semibold tracking-[-0.015em] mb-2 text-(--primary)">
            Sign in
          </h2>
          <p className="text-[15px] text-(--ink-soft) mb-6 leading-[1.55]">
            Enter your email and we&rsquo;ll send a one-time sign-in link.
          </p>

          {error && (
            <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form action={sendMagicLink} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={email ?? ""}
                placeholder="you@email.com"
                className="w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3.5 text-[16px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-(--accent) hover:opacity-90 text-white font-medium text-[16px] py-3.5 rounded-[10px] transition"
            >
              Email me a sign-in link
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[14px] text-(--ink-soft)">
          Not a resident yet?{" "}
          <a
            href={`mailto:${COMMUNITY.contactEmail}`}
            className="text-(--accent) hover:underline underline-offset-4"
          >
            Contact the board
          </a>
        </p>
      </div>
    </main>
  );
}
