import Link from "next/link";

export function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <Link
        href="/"
        className="text-[13px] text-(--ink-soft) hover:text-(--accent) transition"
      >
        ← Home
      </Link>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-(--primary) mt-4 mb-6">
        {title}
      </h1>
      <div>{children}</div>
    </main>
  );
}

export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="bg-(--paper) border border-(--line) rounded-xl p-6 text-[15px] text-(--ink-soft) leading-[1.6]">
      <p className="mb-1 text-(--primary) font-medium">Coming soon.</p>
      <p>{note ?? "This feature is being built. Check back shortly."}</p>
    </div>
  );
}
