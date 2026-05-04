import Link from "next/link";
import { COMMUNITY } from "@/lib/config";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px] text-center">
        <p className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold mb-2">
          {COMMUNITY.name}
        </p>

        <div className="bg-(--paper) border border-(--line) rounded-2xl p-8 sm:p-10 mt-4">
          <div className="w-14 h-14 rounded-full bg-(--accent)/10 text-(--accent) mx-auto mb-5 grid place-items-center text-[24px]">
            ✉
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.015em] mb-3 text-(--primary)">
            Check your email
          </h1>
          <p className="text-[15px] text-(--ink-soft) leading-[1.55] mb-1">
            We sent a sign-in link to
          </p>
          <p className="text-[15px] text-(--primary) font-medium mb-5 break-all">
            {email ?? "your address"}
          </p>
          <p className="text-[14px] text-(--ink-soft) leading-[1.55]">
            Open the email and click the link. It&rsquo;ll bring you back here, signed in.
          </p>
        </div>

        <div className="mt-5 text-[13px] text-(--ink-soft) text-left bg-(--paper) border border-(--line) rounded-xl p-5">
          <div className="font-medium text-(--primary) mb-2">Didn&rsquo;t get it?</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Check spam or promotions.</li>
            <li>The link expires in one hour.</li>
            <li>
              <Link href="/login" className="text-(--accent) hover:underline">
                Request a new link
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
