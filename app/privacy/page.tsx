import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the resident portal handles community and resident data.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
      <p className="text-[11px] tracking-[0.18em] uppercase text-(--warm) font-semibold mb-3 inline-flex items-center gap-2">
        <span className="inline-block w-6 h-px bg-(--warm)" />
        Legal
      </p>
      <h1 className="font-(family-name:--font-serif) text-[40px] sm:text-[48px] text-(--primary) leading-[1.05] tracking-[-0.015em] mb-3">
        Privacy Policy
      </h1>
      <p className="text-[14px] text-(--ink-soft) mb-10">
        Last updated: May 4, 2026
      </p>

      <div className="space-y-8 text-[15px] text-(--primary) leading-[1.7]">
        <Section title="The short version">
          <p>
            The portal collects only what it needs to do its job: resident
            email addresses, names, optional phone numbers, unit assignments,
            announcement read receipts, RSVPs, and the audit trail required
            by law for SMS consent. Everything is stored in cloud
            infrastructure registered in the Community&rsquo;s name, not
            ours. We don&rsquo;t sell anyone&rsquo;s data, ever.
          </p>
        </Section>

        <Section title="What we collect">
          <p>From residents:</p>
          <ul className="list-disc list-inside space-y-1.5 text-(--ink-soft)">
            <li>Email address (required for sign-in)</li>
            <li>Display name and unit assignment (set by the board)</li>
            <li>Optional phone number (only if you opt in to SMS)</li>
            <li>Notification preferences (email on/off, SMS on/off)</li>
            <li>Directory visibility preferences (share email/phone yes/no)</li>
            <li>RSVPs, announcement read receipts, issue reports you submit</li>
          </ul>
          <p>For TCPA-compliant SMS consent, we additionally record:</p>
          <ul className="list-disc list-inside space-y-1.5 text-(--ink-soft)">
            <li>The exact opt-in language shown to you</li>
            <li>The date and time you consented</li>
            <li>Your IP address and browser user-agent at the time of consent</li>
          </ul>
          <p>
            This evidence is required by federal law (47 U.S.C. § 227) to
            send SMS messages in response to express consent.
          </p>
        </Section>

        <Section title="Where data lives">
          <p>
            All Community data is stored in a Supabase project (Postgres
            database + file storage) registered in the Community&rsquo;s name.
            Outbound email is sent through Resend; outbound SMS through
            Twilio. These are industry-standard service providers chosen for
            their security posture and clear data handling commitments.
          </p>
          <p>
            Data is encrypted in transit (HTTPS) and at rest (managed by the
            cloud providers).
          </p>
        </Section>

        <Section title="Who can see what">
          <p>
            The portal uses row-level security in the database to enforce who
            can read what:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-(--ink-soft)">
            <li>
              <strong className="text-(--primary)">Residents</strong> can see
              other residents&rsquo; names + units, plus contact info those
              residents have opted to share.
            </li>
            <li>
              <strong className="text-(--primary)">Board members</strong> can
              see all resident contact info regardless of share preferences,
              the issue queue, and the outbound message audit log.
            </li>
            <li>
              <strong className="text-(--primary)">Anonymous visitors</strong>{" "}
              can submit issue reports anonymously and view the public
              landing.
            </li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc list-inside space-y-1.5 text-(--ink-soft)">
            <li>We don&rsquo;t sell, rent, or trade resident data.</li>
            <li>
              We don&rsquo;t use resident data to train AI models or generate
              insights for third parties.
            </li>
            <li>
              We don&rsquo;t embed third-party trackers, analytics pixels, or
              advertising tags.
            </li>
            <li>
              We don&rsquo;t share the Community&rsquo;s data with anyone
              outside the cloud infrastructure providers listed above.
            </li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>You can, at any time:</p>
          <ul className="list-disc list-inside space-y-1.5 text-(--ink-soft)">
            <li>Update your contact info and preferences in Settings.</li>
            <li>Revoke SMS consent (your phone number stays in your record but no further SMS are sent).</li>
            <li>
              Reply STOP to any SMS to unsubscribe instantly (handled by
              Twilio, synced to our consent log).
            </li>
            <li>
              Request a copy of your personal data, or its deletion, by
              emailing your board contact.
            </li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions? Email{" "}
            <a
              href="mailto:j.sundby@gmail.com"
              className="text-(--accent) underline underline-offset-2"
            >
              j.sundby@gmail.com
            </a>
            . For data access or deletion requests specific to your
            Community, contact your board first; they have administrative
            control over the portal.
          </p>
        </Section>
      </div>

      <div className="mt-16 pt-8 border-t border-(--line) flex items-center justify-between text-[13px] text-(--ink-soft)">
        <Link href="/" className="hover:text-(--accent) transition">
          ← Back to portal
        </Link>
        <Link href="/terms" className="hover:text-(--accent) transition">
          Terms of service →
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-(--primary) mb-3 tracking-[-0.005em]">
        {title}
      </h2>
      <div className="space-y-3 text-(--ink-soft)">{children}</div>
    </section>
  );
}
