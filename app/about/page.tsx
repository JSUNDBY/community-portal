import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { signInAsDemo } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "About — Sandstone Ridge Portal",
  description:
    "A simple resident portal for one HOA at a time. Magic-link sign-in, calendar, announcements, documents, issue reports.",
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative">
        <div className="relative w-full aspect-[3/2] sm:aspect-[2/1] max-h-[560px] overflow-hidden">
          <Image
            src="/hero.png"
            alt="A modest townhouse community entrance"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-3xl mx-auto w-full px-6 pb-10 sm:pb-14">
              <p className="text-[12px] tracking-[0.08em] uppercase text-white/85 font-semibold mb-2">
                Resident portals
              </p>
              <h1 className="text-[34px] sm:text-[44px] font-semibold tracking-[-0.02em] text-white leading-[1.05] max-w-2xl">
                A simple resident portal for one community at a time.
              </h1>
              <p className="text-[16px] sm:text-[17px] text-white/90 mt-4 max-w-xl leading-[1.55]">
                Magic-link sign-in, shared calendar, announcements, documents,
                and issue reports. No multi-tenant SaaS bloat. Your data stays
                in your Supabase project, on your domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
              Try the live demo
            </p>
            <p className="text-[15px] text-(--primary)">
              Click into a fully populated community right now. No account
              needed.
            </p>
          </div>
          <form action={signInAsDemo} className="flex flex-wrap gap-2 shrink-0">
            <button
              type="submit"
              name="role"
              value="board"
              className="bg-(--accent) hover:opacity-90 text-white font-medium text-[14px] px-4 py-2.5 rounded-lg transition"
            >
              Tour as a board member
            </button>
            <button
              type="submit"
              name="role"
              value="resident"
              className="bg-(--paper) text-(--primary) border border-(--line) hover:border-(--accent) hover:text-(--accent) font-medium text-[14px] px-4 py-2.5 rounded-lg transition"
            >
              Tour as a resident
            </button>
          </form>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
          Who it&rsquo;s for
        </h2>
        <p className="text-[20px] sm:text-[22px] text-(--primary) leading-[1.45] tracking-[-0.01em]">
          Self-managed HOAs and small condo associations who want to retire the
          email chains, the shared Dropbox folder, and the Mailchimp account
          they hate logging into. Built for boards run by neighbors, not
          professional property managers.
        </p>
      </section>

      {/* Features */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-6">
            What you get
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-[15px] text-(--primary) leading-[1.55]">
            <Feature title="Magic-link sign-in">
              No passwords. Residents click a link in their email and they&rsquo;re in.
            </Feature>
            <Feature title="Resident directory">
              Names, units, opt-in contact info. Board sees more, residents control what they share.
            </Feature>
            <Feature title="Shared calendar">
              Board meetings, community events, recurring schedules. RSVP + .ics download per event.
            </Feature>
            <Feature title="Announcements">
              Compose once, fan out to email and (with consent) SMS. Per-resident read receipts.
            </Feature>
            <Feature title="Document vault">
              CC&amp;Rs, bylaws, minutes, financials. Categorized, signed-URL downloads.
            </Feature>
            <Feature title="Issue reports">
              Maintenance, neighbor concerns, suggestions. Residents can submit anonymously.
            </Feature>
            <Feature title="TCPA-compliant SMS">
              Explicit opt-in flow with audit trail. Inbound STOP keywords automatically unsubscribe.
            </Feature>
            <Feature title="Full audit log">
              Every email and SMS is logged. The board can see exactly what went out and who got it.
            </Feature>
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-6">
          Pricing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PriceCard
            label="Setup"
            amount="$1,500 – $3,500"
            sublabel="One-time"
            note="Branded domain, real data seeded, board onboarded. Live within a week of contract."
          />
          <PriceCard
            label="Monthly"
            amount="$99 – $249"
            sublabel="Per community"
            note="Covers cloud infrastructure (Supabase, Vercel, Resend, Twilio) plus light maintenance."
          />
        </div>
        <p className="text-[13px] text-(--ink-soft) mt-4 leading-[1.55]">
          Pricing scales with community size and how much hand-holding the board
          wants. The thirty-unit case is on the low end; a hundred-unit
          condo with weekly mailings is on the high end.
        </p>
      </section>

      {/* Hand-off promise */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-3">
            No vendor lock-in
          </h2>
          <p className="text-[18px] text-(--primary) leading-[1.5] tracking-[-0.005em] max-w-2xl">
            Every community owns the cloud accounts the portal runs on. If you
            ever want to take it elsewhere, the codebase is yours, your
            Supabase database is yours, your domain is yours. Hand a future
            developer the README and they&rsquo;re productive in an hour.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-6">
          Common questions
        </h2>
        <div className="space-y-5">
          <Faq q="How long does setup take?">
            Five to ten business days from signed agreement to live portal,
            assuming the board can get me a unit list and the first batch of
            board emails on day one.
          </Faq>
          <Faq q="Is it secure?">
            Magic-link auth (no password leaks), row-level security in
            Postgres, signed URLs for documents, TCPA-defensible SMS consent
            log, signature-verified webhooks. Same building blocks the bigger
            HOA platforms use; the difference is yours stays small.
          </Faq>
          <Faq q="What happens if you stop freelancing?">
            Every cloud account is in your name. The codebase ships with a
            README that any web developer can pick up. You&rsquo;d need to
            re-paper the maintenance retainer with someone, but the portal
            keeps running while you do.
          </Faq>
          <Faq q="Can I install it on my phone?">
            Yes. It&rsquo;s a PWA — &ldquo;Add to Home Screen&rdquo; in
            Safari or Chrome and it behaves like a native app, with the
            community&rsquo;s brand color in the OS chrome.
          </Faq>
          <Faq q="Does it integrate with QuickBooks / Yardi / Buildium?">
            Not yet. It&rsquo;s designed for self-managed boards who don&rsquo;t
            already pay for that kind of software. If you do, you probably
            want a different product.
          </Faq>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-(--primary) text-white">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 className="text-[24px] font-semibold tracking-[-0.015em] mb-3">
            Want one for your community?
          </h2>
          <p className="text-[15px] text-white/85 mb-6 max-w-md mx-auto leading-[1.55]">
            Email me with your community name and a rough unit count. I&rsquo;ll
            send back a fixed-price quote and a timeline within a day.
          </p>
          <a
            href="mailto:j.sundby@gmail.com?subject=Resident%20portal%20for%20our%20HOA"
            className="inline-block bg-white text-(--primary) font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
          >
            j.sundby@gmail.com
          </a>
          <p className="text-[12px] text-white/60 mt-8">
            Built and maintained by Josh Sundby in Minnesota.
          </p>
        </div>
      </section>

      {/* Tiny bottom nav back to portal */}
      <section className="border-t border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-[13px] text-(--ink-soft)">
          <Link href="/" className="hover:text-(--accent) transition">
            ← Back to portal
          </Link>
          <span>Sandstone Ridge HOA · live demo</span>
        </div>
      </section>
    </main>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <span className="block font-medium text-(--primary) mb-1">{title}</span>
      <span className="text-(--ink-soft) text-[14px]">{children}</span>
    </li>
  );
}

function PriceCard({
  label,
  amount,
  sublabel,
  note,
}: {
  label: string;
  amount: string;
  sublabel: string;
  note: string;
}) {
  return (
    <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
      <p className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
        {label}
      </p>
      <p className="text-[28px] font-semibold tracking-[-0.02em] text-(--primary) leading-tight">
        {amount}
      </p>
      <p className="text-[13px] text-(--ink-soft) mb-3">{sublabel}</p>
      <p className="text-[14px] text-(--ink-soft) leading-[1.55]">{note}</p>
    </div>
  );
}

function Faq({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <details className="bg-(--paper) border border-(--line) rounded-xl px-5 py-4">
      <summary className="text-[15px] font-medium text-(--primary) cursor-pointer">
        {q}
      </summary>
      <div className="text-[14px] text-(--ink-soft) mt-3 leading-[1.6]">
        {children}
      </div>
    </details>
  );
}
