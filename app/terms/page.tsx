import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for the resident portal.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
      <p className="text-[11px] tracking-[0.18em] uppercase text-(--warm) font-semibold mb-3 inline-flex items-center gap-2">
        <span className="inline-block w-6 h-px bg-(--warm)" />
        Legal
      </p>
      <h1 className="font-(family-name:--font-serif) text-[40px] sm:text-[48px] text-(--primary) leading-[1.05] tracking-[-0.015em] mb-3">
        Terms of Service
      </h1>
      <p className="text-[14px] text-(--ink-soft) mb-10">
        Last updated: May 4, 2026
      </p>

      <div className="space-y-8 text-[15px] text-(--primary) leading-[1.7]">
        <Section title="1. Who we are">
          <p>
            These Terms of Service govern your use of the resident portal
            service (the &ldquo;Service&rdquo;) provided to your homeowners
            association or condominium association (the &ldquo;Community&rdquo;).
            By using the Service, the Community and its residents agree to
            these terms.
          </p>
        </Section>

        <Section title="2. The service">
          <p>
            We provide a hosted, branded resident portal that includes
            magic-link authentication, a shared calendar, announcements,
            document storage, an issue-report inbox, and TCPA-compliant SMS
            messaging. The exact feature set depends on the tier the
            Community has selected.
          </p>
        </Section>

        <Section title="3. Fees and billing">
          <p>
            The Community pays a one-time setup fee and a recurring monthly
            fee as described in the signed agreement. Setup fees are due
            before the portal is provisioned. Monthly fees are billed in
            advance and are non-refundable for partial months. Late payments
            past 30 days may result in suspension of the Service.
          </p>
          <p>
            Pricing tiers may be revised with 60 days&rsquo; notice. Existing
            customers keep their current tier pricing for at least 12 months
            from the date of any change.
          </p>
        </Section>

        <Section title="4. Hosting and data ownership">
          <p>
            All Community data — resident records, announcements, documents,
            messages — is stored in cloud infrastructure (database, hosting,
            email, SMS) registered in the Community&rsquo;s name. The
            Community owns its data and may export, migrate, or delete it at
            any time. Upon written request, we will hand over administrative
            access to all underlying accounts within five business days.
          </p>
        </Section>

        <Section title="5. Your responsibilities">
          <p>
            The Community&rsquo;s board is responsible for accurate resident
            records, lawful use of the Service (including compliance with
            applicable state HOA laws and federal communications laws), and
            keeping its login credentials secure. Residents are responsible
            for the contact information they provide and for using the
            Service in good faith.
          </p>
        </Section>

        <Section title="6. SMS and TCPA compliance">
          <p>
            Inbound SMS opt-in is collected with explicit, written consent
            and recorded in a TCPA-defensible audit log. Inbound STOP
            keywords are honored automatically and immediately. The
            Community is responsible for the content of messages sent
            through the Service.
          </p>
        </Section>

        <Section title="7. Termination">
          <p>
            Either party may terminate with 30 days&rsquo; written notice.
            Upon termination, we will provide a final database export and
            transfer administrative ownership of all cloud accounts to the
            Community. The Community is responsible for any ongoing cloud
            infrastructure costs after the transfer.
          </p>
        </Section>

        <Section title="8. Warranty and liability">
          <p>
            The Service is provided &ldquo;as is.&rdquo; We do not warrant
            that the Service will be uninterrupted or error-free. To the
            maximum extent permitted by law, our total liability under these
            terms is limited to the fees paid by the Community in the prior
            twelve months.
          </p>
        </Section>

        <Section title="9. Governing law">
          <p>
            These terms are governed by the laws of the state in which the
            provider is registered as a business. Any disputes will be
            resolved in the courts of that state, unless the parties agree
            to alternative dispute resolution in writing.
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms occasionally. Material changes will be
            communicated to the Community board at least 30 days before
            taking effect.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these terms? Email{" "}
            <a
              href="mailto:j.sundby@gmail.com"
              className="text-(--accent) underline underline-offset-2"
            >
              j.sundby@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <div className="mt-16 pt-8 border-t border-(--line) flex items-center justify-between text-[13px] text-(--ink-soft)">
        <Link href="/" className="hover:text-(--accent) transition">
          ← Back to portal
        </Link>
        <Link href="/privacy" className="hover:text-(--accent) transition">
          Privacy policy →
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
