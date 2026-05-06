import Link from "next/link";
import { COMMUNITY } from "@/lib/config";

/**
 * Quiet site-wide footer. Lives at the bottom of every page (mounted
 * in the root layout). Gives the site a "real business" floor with
 * legal links + contact, without competing with page content.
 */
export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="border-t border-(--line) bg-(--paper) mt-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px] text-(--ink-soft)">
        <div>
          <p className="font-medium text-(--primary) mb-2">{COMMUNITY.name}</p>
          <p className="leading-[1.55]">
            Resident portal hosted at{" "}
            <span className="text-(--primary)">{COMMUNITY.domain}</span>.
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.12em] uppercase text-(--ink-softer) font-semibold mb-2">
            Resources
          </p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/about" className="hover:text-(--accent) transition">
                About this portal
              </Link>
            </li>
            <li>
              <Link href="/report" className="hover:text-(--accent) transition">
                Report an issue
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${COMMUNITY.contactEmail}`}
                className="hover:text-(--accent) transition"
              >
                Contact the board
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.12em] uppercase text-(--ink-softer) font-semibold mb-2">
            Legal
          </p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/terms" className="hover:text-(--accent) transition">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-(--accent) transition">
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-(--line)">
        <div className="max-w-4xl mx-auto px-6 py-4 text-[12px] text-(--ink-softer) flex items-center justify-between">
          <span>© {year} {COMMUNITY.name}. All rights reserved.</span>
          <span>Independent &amp; small by design.</span>
        </div>
      </div>
    </footer>
  );
}
