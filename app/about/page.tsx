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
      {/* Hero — photo-forward. The entrance image breathes at the top;
          a navy gradient blooms upward only enough to give the type
          full contrast at the bottom. Headline uses Fraunces (serif)
          for an editorial feel. */}
      <section className="relative min-h-[640px] sm:min-h-[720px] overflow-hidden flex flex-col">
        <Image
          src="/entrance.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 78%" }}
        />
        {/* Smooth two-stop gradient — no hard color stops, no banding. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--primary) 0%, rgba(11,31,59,0.92) 35%, rgba(11,31,59,0.55) 60%, rgba(11,31,59,0.18) 85%, transparent 100%)",
          }}
        />
        <div className="relative flex-1 flex flex-col justify-end max-w-4xl mx-auto w-full px-6 pb-14 sm:pb-20 pt-24 text-white">
          <p className="text-[12px] tracking-[0.18em] uppercase text-(--warm-soft) font-semibold mb-4 flex items-center gap-2">
            <span className="inline-block w-8 h-px bg-(--warm)" />
            Resident portals
          </p>
          <h1 className="font-(family-name:--font-serif) text-[44px] sm:text-[64px] font-normal tracking-[-0.015em] leading-[1.02] max-w-3xl">
            A real resident portal,{" "}
            <span className="italic font-light text-(--warm-soft)">
              not another HOA website.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-white/90 mt-6 max-w-2xl leading-[1.55]">
            Most HOA web vendors give you a brochure with a login button. We
            give you a portal residents actually use — magic-link sign-in,
            shared calendar, announcements that fan out to email and SMS,
            document vault, issue triage. On your domain, in your accounts.
          </p>

          <form action={signInAsDemo} className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              name="role"
              value="board"
              className="bg-white text-(--primary) hover:bg-white/90 font-semibold text-[15px] px-6 py-3.5 rounded-[10px] transition shadow-md"
            >
              Tour as a board member →
            </button>
            <button
              type="submit"
              name="role"
              value="resident"
              className="border border-white/40 bg-white/5 backdrop-blur-sm text-white hover:bg-white/15 font-medium text-[15px] px-6 py-3.5 rounded-[10px] transition"
            >
              Tour as a resident
            </button>
          </form>
          <p className="text-[12px] text-white/60 mt-3">
            No account needed. Click anything — it&rsquo;s a sandbox.
          </p>
        </div>
      </section>

      {/* Differentiation — the "real portal vs. brochure" call-out */}
      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <Eyebrow>Why this is different</Eyebrow>
        <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[36px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-10 max-w-2xl">
          The HOA website you&rsquo;ve seen before. And the one residents will actually open.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
            <p className="text-[11px] tracking-[0.18em] uppercase text-(--ink-softer) font-semibold mb-3">
              Most HOA vendors
            </p>
            <ul className="space-y-2.5 text-[14px] text-(--ink-soft) leading-[1.5]">
              <ConBullet>Brochure pages with a login button</ConBullet>
              <ConBullet>The login goes to a basic modal — no real functionality</ConBullet>
              <ConBullet>Documents are PDF links on a page</ConBullet>
              <ConBullet>Announcements are static text</ConBullet>
              <ConBullet>No SMS, no read receipts, no audit trail</ConBullet>
              <ConBullet>Cookie-cutter templates with a logo swap</ConBullet>
              <ConBullet>Unclear what happens to your data if you leave</ConBullet>
            </ul>
          </div>
          <div className="bg-(--paper) border-2 border-(--accent) rounded-xl p-6 shadow-sm">
            <p className="text-[11px] tracking-[0.18em] uppercase text-(--accent) font-semibold mb-3">
              This portal
            </p>
            <ul className="space-y-2.5 text-[14px] text-(--primary) leading-[1.5]">
              <ProBullet>Magic-link sign-in. No passwords for residents.</ProBullet>
              <ProBullet>Real calendar with RSVPs and per-event .ics download</ProBullet>
              <ProBullet>Categorized document vault with signed-URL downloads</ProBullet>
              <ProBullet>Announcements that fan out to email + SMS, with read receipts</ProBullet>
              <ProBullet>TCPA-compliant SMS opt-in with audit log</ProBullet>
              <ProBullet>Custom domain, brand color, and logo per community</ProBullet>
              <ProBullet>Every cloud account in your name. Zero vendor lock-in.</ProBullet>
            </ul>
          </div>
        </div>
        <p className="text-[14px] text-(--ink-soft) mt-6 leading-[1.55]">
          Click <strong className="text-(--primary)">Tour as a board member</strong> at the top of this page if you want
          proof. The demo is the actual product, not a screenshot.
        </p>
      </section>

      <Ornament />

      {/* Compliance — three pillars */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
          <Eyebrow>Compliance</Eyebrow>
          <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[36px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-3 max-w-2xl">
            The rules that bind your board, baked into the portal.
          </h2>
          <p className="text-[15px] text-(--ink-soft) mb-10 max-w-2xl leading-[1.55]">
            HOAs sit at the intersection of state association law, federal
            communications law, and basic data hygiene. The portal is
            designed for all three out of the box.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComplianceCard
              eyebrow="State HOA law"
              title="Florida 720, California Davis-Stirling, Texas 209, and equivalents."
              points={[
                "Owner records access fulfilled within the statutory window your state requires (10 business days in FL, 15 in CA, etc.)",
                "Meeting notice cadence configured to match state-mandated periods (FL: 48-hour board notice, 14-day member notice)",
                "7+ year financial records retention with no auto-delete, ever",
                "Governing documents and minutes archived indefinitely",
              ]}
            />
            <ComplianceCard
              eyebrow="Federal communications law"
              title="TCPA-defensible SMS. CAN-SPAM-clean email."
              points={[
                "Explicit, written SMS opt-in with the exact consent text logged alongside IP, user-agent, and timestamp",
                "Inbound STOP / CANCEL / UNSUBSCRIBE keywords auto-revoke consent and sync to the audit log",
                "Every outbound email identifies the sender, includes the community's physical address, and carries an unsubscribe link",
                "Twilio webhook signatures verified before any inbound is processed",
              ]}
            />
            <ComplianceCard
              eyebrow="Data security & privacy"
              title="Resident data treated like the records it is."
              points={[
                "Row-level security in Postgres — residents only see what they're entitled to, board only sees what they need",
                "Encrypted at rest (managed by Supabase) and in transit (HTTPS-only)",
                "Documents served via short-lived signed URLs, never publicly indexable",
                "Full outbound audit log: every email and SMS, who got it, when it sent, whether it failed",
                "Breach notification plan ready for the 30-day FL window and equivalent state laws",
              ]}
            />
          </div>

          <p className="text-[13px] text-(--ink-soft) mt-6 leading-[1.6] max-w-3xl">
            What this is <em>not</em>: legal advice. Your board still needs to
            follow your governing documents and your state statute — the
            portal makes that easier, not automatic. We can connect you with
            HOA-experienced attorneys at setup if you don&rsquo;t already
            have one.
          </p>
        </div>
      </section>

      <Ornament />

      {/* PMC partnership — sensitivity for managed communities */}
      <section className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <Eyebrow>For managed communities</Eyebrow>
        <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[36px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-3 max-w-2xl">
          We work alongside your management company, not instead of them.
        </h2>
        <p className="text-[16px] text-(--ink-soft) mb-8 max-w-2xl leading-[1.6]">
          If your community already has a property management firm handling
          accounting, dues, vendor invoices, and work orders — keep them.
          The portal is for the resident-facing layer your management
          software was never great at.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-(--paper) border border-(--line) rounded-xl p-6">
            <p className="text-[11px] tracking-[0.18em] uppercase text-(--ink-softer) font-semibold mb-3">
              Your PMC keeps doing
            </p>
            <ul className="space-y-2 text-[14px] text-(--ink-soft) leading-[1.5]">
              <li>· Bookkeeping and accounting</li>
              <li>· Dues collection and assessment billing</li>
              <li>· Vendor management and work orders</li>
              <li>· Compliance reporting to the board</li>
              <li>· Annual budget and audit support</li>
            </ul>
          </div>
          <div className="bg-(--paper) border-2 border-(--accent) rounded-xl p-6 shadow-sm">
            <p className="text-[11px] tracking-[0.18em] uppercase text-(--accent) font-semibold mb-3">
              We do the resident layer
            </p>
            <ul className="space-y-2 text-[14px] text-(--primary) leading-[1.5]">
              <li>· Magic-link sign-in for every resident</li>
              <li>· Branded calendar, announcements, document vault</li>
              <li>· Email + opt-in SMS fan-out for board updates</li>
              <li>· Issue intake routed to whoever the board names</li>
              <li>· Mobile-installable PWA, your community&rsquo;s color</li>
            </ul>
          </div>
        </div>
        <p className="text-[14px] text-(--ink-soft) mt-6 leading-[1.6] max-w-3xl">
          The board contact for issue reports, the records custodian for
          document downloads, the address that announcement replies go
          to — all configurable. If your PMC fields resident calls today,
          set their email as the contact and the portal will route
          residents to them automatically.
        </p>
      </section>

      <Ornament />

      {/* Who it's for */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20 text-center">
        <Eyebrow>Who it&rsquo;s for</Eyebrow>
        <p className="font-(family-name:--font-serif) text-[26px] sm:text-[32px] text-(--primary) leading-[1.3] tracking-[-0.01em] max-w-2xl mx-auto">
          Self-managed HOAs and small condo associations who want to retire
          the email chains, the shared Dropbox folder, and the Mailchimp
          account they hate logging into.
        </p>
        <p className="text-[15px] text-(--ink-soft) mt-5 max-w-xl mx-auto">
          Built for boards run by neighbors, not professional property
          managers.
        </p>
      </section>

      <Ornament />

      {/* Features */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <Eyebrow>What you get</Eyebrow>
          <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[34px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-10 max-w-xl">
            Everything a small board needs. Nothing it doesn&rsquo;t.
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

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[34px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-10 max-w-xl">
          From first email to live portal in under two weeks.
        </h2>
        <ol className="space-y-6">
          <Step
            n={1}
            title="Send us your community details"
            body="Email us with your community name, rough unit count, and what you're using today (Mailchimp, Dropbox, Excel, paper). Takes a few minutes."
          />
          <Step
            n={2}
            title="We send a fixed-price quote"
            body="Within one business day. No surprises, no hourly billing for the build. The quote covers the setup fee and the first year of monthly service."
          />
          <Step
            n={3}
            title="We provision your portal"
            body="Custom domain, branded colors, your community's logo, all 20-or-however-many units pre-loaded. Live within 5 to 10 business days of contract signing."
          />
          <Step
            n={4}
            title="We onboard your board"
            body="A single 30-minute call to walk through publishing announcements, uploading documents, and inviting the rest of the residents. After that, you're running it."
          />
        </ol>
      </section>

      {/* Pricing */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[34px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-3 max-w-xl">
            Three tiers. No per-resident pricing tricks.
          </h2>
          <p className="text-[15px] text-(--ink-soft) mb-10 max-w-2xl leading-[1.55]">
            Every tier includes the full feature set. What changes is the
            unit cap, SMS allowance, and how much board admin help is built in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TierCard
              name="Starter"
              setup="$1,500"
              monthly="$99"
              annual="$1,089"
              tagline="Small, calm communities."
              features={[
                "Up to 30 units",
                "Email announcements",
                "All resident features (directory, calendar, documents, RSVPs, reports)",
                "Board onboarding call",
                "Email support · 48-hour response",
              ]}
            />
            <TierCard
              name="Standard"
              setup="$2,500"
              monthly="$149"
              annual="$1,639"
              tagline="Most HOAs land here."
              popular
              features={[
                "Up to 75 units",
                "Email + SMS announcements (TCPA-compliant opt-in)",
                "Recurring calendar events",
                "Onboarding + 30-day check-in",
                "Email support · 24-hour response",
              ]}
            />
            <TierCard
              name="Premium"
              setup="$5,000"
              monthly="$249"
              annual="$2,739"
              tagline="Larger or higher-touch."
              features={[
                "Up to 150 units",
                "Custom email branding (sends from your domain)",
                "Quarterly review + planning sessions",
                "Up to 4 hours/mo of board admin help",
                "Priority support · 12-hour response",
              ]}
            />
          </div>
          <p className="text-[12px] text-(--ink-softer) mt-4 text-center">
            Annual billing saves one month. Setup fee is one-time.
          </p>

          <div className="mt-10 bg-(--warm-soft)/40 border border-(--warm)/20 rounded-xl p-6">
            <p className="text-[11px] tracking-[0.18em] uppercase text-(--warm) font-semibold mb-2">
              Custom add-ons
            </p>
            <p className="text-[15px] text-(--primary) mb-4 leading-[1.55]">
              For boards that need more than the standard portal, we quote
              custom builds on top of any tier:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[14px] text-(--ink-soft)">
              <li>· QuickBooks / Yardi / Buildium integration</li>
              <li>· Online voting + motion tracking</li>
              <li>· Dues collection (Stripe)</li>
              <li>· Assessment billing + late-fee automation</li>
              <li>· Vendor marketplace + invoice routing</li>
              <li>· Communities over 150 units</li>
            </ul>
            <p className="text-[13px] text-(--ink-soft) mt-4">
              Send us the workflow and we&rsquo;ll quote a fixed-price build.
            </p>
          </div>
        </div>
      </section>

      {/* Hand-off promise */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20 text-center">
        <Eyebrow>No vendor lock-in</Eyebrow>
        <p className="font-(family-name:--font-serif) text-[24px] sm:text-[30px] text-(--primary) leading-[1.3] tracking-[-0.01em] max-w-2xl mx-auto italic">
          &ldquo;If you ever want to leave, you take everything with you.&rdquo;
        </p>
        <p className="text-[15px] text-(--ink-soft) mt-5 max-w-xl mx-auto leading-[1.6]">
          Every community owns the cloud accounts the portal runs on. The
          codebase is yours. The database is yours. The domain is yours. Hand
          a future developer the README and they&rsquo;re productive in an
          hour.
        </p>
      </section>

      <Ornament />

      {/* FAQ */}
      <section className="bg-(--paper) border-y border-(--line)">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <Eyebrow>Common questions</Eyebrow>
          <h2 className="font-(family-name:--font-serif) text-[28px] sm:text-[34px] text-(--primary) leading-[1.2] tracking-[-0.01em] mb-10 max-w-xl">
            Things boards ask before they buy.
          </h2>
          <div className="space-y-3">
            <Faq q="How long does setup take?">
              Five to ten business days from signed agreement to live portal,
              assuming the board can get us a unit list and the first batch of
              board emails on day one.
            </Faq>
            <Faq q="Is it secure?">
              Magic-link auth (no password leaks), row-level security in
              Postgres, signed URLs for documents, TCPA-defensible SMS consent
              log, signature-verified webhooks. Same building blocks the bigger
              HOA platforms use; the difference is yours stays small and
              focused.
            </Faq>
            <Faq q="What does the board need to do during onboarding?">
              Hand us a unit list (number, address, owner name + email),
              pick a custom domain (we&rsquo;ll register it for you if needed),
              and let us know your brand color and logo. One 30-minute call to
              walk through the admin tools and you&rsquo;re running.
            </Faq>
            <Faq q="What if we want to bring it in-house or switch providers?">
              Every account the portal depends on (database, hosting, email,
              SMS, domain) is registered to your community, not to us. The
              codebase ships with a hand-off README. Any web developer can pick
              it up and keep it running.
            </Faq>
            <Faq q="Can residents install it on their phone?">
              Yes. It&rsquo;s a Progressive Web App — &ldquo;Add to Home
              Screen&rdquo; from Safari or Chrome and it behaves like a native
              app, with your community&rsquo;s brand color in the OS chrome.
              No App Store review, no separate downloads.
            </Faq>
            <Faq q="What if my state has unusual requirements?">
              See the Compliance section above for how we handle the
              standard playbook (FL Chapter 720, CA Davis-Stirling, TX 209,
              and others). If your state has unusual requirements — say a
              specific election ballot format, a public-records-style
              member request flow, or a recurring filing your software
              needs to generate — flag it on the intake call and
              we&rsquo;ll either configure it during setup or quote it as
              a paid add-on.
            </Faq>
            <Faq q="Does it integrate with QuickBooks, Yardi, or Buildium?">
              Not in the standard build, but yes — we offer integrations as a
              paid add-on. If your board needs assessment billing pushed to
              QuickBooks, vendor invoices synced to Yardi, or owner data
              reconciled with Buildium, send us the workflow and we&rsquo;ll
              quote a custom build on top of the base portal.
            </Faq>
            <Faq q="Can we add custom features later?">
              Yes. Voting and motions, vendor marketplaces, dues collection,
              and other build-outs are quoted separately. Most communities
              start with the standard portal and add features once they know
              what their residents actually use.
            </Faq>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-(--primary) text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <span className="inline-block w-10 h-px bg-(--warm) mb-6" />
          <h2 className="font-(family-name:--font-serif) text-[36px] sm:text-[44px] tracking-[-0.015em] leading-[1.1] mb-4">
            Ready to talk?
          </h2>
          <p className="text-[15px] text-white/85 mb-7 max-w-md mx-auto leading-[1.55]">
            Send us your community name and a rough unit count. We&rsquo;ll
            send back a fixed-price quote and timeline within one business day.
          </p>
          <a
            href="mailto:j.sundby@gmail.com?subject=Resident%20portal%20for%20our%20HOA"
            className="inline-block bg-white text-(--primary) font-semibold text-[15px] px-6 py-3.5 rounded-[10px] hover:opacity-90 transition shadow-sm"
          >
            j.sundby@gmail.com
          </a>
          <p className="text-[12px] text-white/55 mt-8">
            Independent and small by design. Serving HOAs nationwide.
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

function ProBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check />
      <span>{children}</span>
    </li>
  );
}

function ComplianceCard({
  eyebrow,
  title,
  points,
}: {
  eyebrow: string;
  title: string;
  points: string[];
}) {
  return (
    <div className="bg-(--background) border border-(--line) rounded-xl p-6 flex flex-col">
      <p className="text-[10px] tracking-[0.18em] uppercase text-(--warm) font-semibold mb-2">
        {eyebrow}
      </p>
      <h3 className="font-(family-name:--font-serif) text-[20px] text-(--primary) leading-[1.25] tracking-[-0.005em] mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5 text-[13px] text-(--ink-soft) leading-[1.5]">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <Check />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="shrink-0 mt-1 text-(--ink-softer)"
        aria-hidden="true"
      >
        <path
          d="M3 7H11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}

/** Small uppercase eyebrow with a warm accent rule on the left. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] tracking-[0.18em] uppercase text-(--warm) font-semibold mb-4 inline-flex items-center gap-2">
      <span className="inline-block w-6 h-px bg-(--warm)" />
      {children}
    </p>
  );
}

/** Editorial divider — thin lines flanking a small four-point mark in
 *  the warm accent. Marks transitions between sections. */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 py-2 max-w-3xl mx-auto px-6">
      <span className="flex-1 h-px bg-(--line)" />
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className="text-(--warm) shrink-0"
        aria-hidden="true"
      >
        <path
          d="M7 0 L8 6 L14 7 L8 8 L7 14 L6 8 L0 7 L6 6 Z"
          fill="currentColor"
        />
      </svg>
      <span className="flex-1 h-px bg-(--line)" />
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4 items-start">
      <span className="shrink-0 w-8 h-8 rounded-full bg-(--accent)/10 text-(--accent) font-semibold text-[14px] flex items-center justify-center">
        {n}
      </span>
      <div>
        <h3 className="text-[16px] font-semibold text-(--primary) mb-1 tracking-[-0.005em]">
          {title}
        </h3>
        <p className="text-[14px] text-(--ink-soft) leading-[1.6]">{body}</p>
      </div>
    </li>
  );
}

function TierCard({
  name,
  setup,
  monthly,
  annual,
  tagline,
  features,
  popular,
}: {
  name: string;
  setup: string;
  monthly: string;
  annual: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}) {
  const subject = encodeURIComponent(`Resident portal — ${name} tier`);
  const cardCls = popular
    ? "bg-(--background) border-2 border-(--accent) rounded-xl p-6 relative shadow-sm"
    : "bg-(--background) border border-(--line) rounded-xl p-6 relative";

  return (
    <div className={cardCls}>
      {popular && (
        <span className="absolute -top-3 left-6 text-[10px] tracking-[0.08em] uppercase font-semibold text-white bg-(--accent) px-2.5 py-1 rounded">
          Most popular
        </span>
      )}
      <p className="text-[11px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-1">
        {name}
      </p>
      <p className="text-[14px] text-(--ink-soft) mb-4">{tagline}</p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[28px] font-semibold tracking-[-0.02em] text-(--primary) leading-none">
          {monthly}
        </span>
        <span className="text-[13px] text-(--ink-soft)">/ month</span>
      </div>
      <p className="text-[12px] text-(--warm) mb-1 font-medium">
        or {annual}/year &middot; save one month
      </p>
      <p className="text-[13px] text-(--ink-soft) mb-5">
        + {setup} setup (one-time)
      </p>

      <ul className="space-y-2.5 mb-6">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[14px] text-(--primary) leading-[1.45]"
          >
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href={`mailto:j.sundby@gmail.com?subject=${subject}`}
        className={
          popular
            ? "block w-full text-center bg-(--accent) hover:opacity-90 text-white font-medium text-[14px] py-2.5 rounded-lg transition"
            : "block w-full text-center bg-(--paper) text-(--primary) border border-(--line) hover:border-(--accent) hover:text-(--accent) font-medium text-[14px] py-2.5 rounded-lg transition"
        }
      >
        Get a quote
      </a>
    </div>
  );
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0 mt-1 text-(--accent)"
      aria-hidden="true"
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <details className="bg-(--background) border border-(--line) rounded-xl px-5 py-4">
      <summary className="text-[15px] font-medium text-(--primary) cursor-pointer">
        {q}
      </summary>
      <div className="text-[14px] text-(--ink-soft) mt-3 leading-[1.6]">
        {children}
      </div>
    </details>
  );
}
