import Link from "next/link";
import { redirect } from "next/navigation";
import { ComingSoon, PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

type Unit = { number: string; address: string | null } | null;

type DirectoryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "resident" | "board";
  is_owner: boolean;
  share_email: boolean;
  share_phone: boolean;
  unit_id: string | null;
  unit: Unit;
};

export default async function DirectoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const me = await ensureProfile(supabase, user);
  const isBoard = me.role === "board";

  const { data: rows } = await supabase
    .from("residents")
    .select(
      `id, name, email, phone, role, is_owner, share_email, share_phone, unit_id,
       unit:units(number, address)`
    )
    .order("name");

  const residents = ((rows as unknown as DirectoryRow[] | null) ?? []).slice().sort(byUnitThenName);

  return (
    <PageShell title="Directory">
      {isBoard && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[13px] text-(--ink-soft)">
            Board view — you can see contact info regardless of share settings.
          </p>
          <Link
            href="/board/invite"
            className="shrink-0 inline-block bg-(--accent) text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:opacity-90 transition"
          >
            + Invite resident
          </Link>
        </div>
      )}

      {residents.length === 0 ? (
        <ComingSoon
          note={
            isBoard
              ? "No residents yet. Use Invite resident to pre-register people, or seed the residents table directly via SQL."
              : "No residents in the directory yet."
          }
        />
      ) : (
        <ul className="bg-(--paper) border border-(--line) rounded-xl divide-y divide-(--line)">
          {residents.map((r) => (
            <li key={r.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-(--primary) text-[16px]">
                    {r.name}
                  </span>
                  {r.role === "board" && <Badge>Board</Badge>}
                  {isBoard && !r.is_owner && <BadgeMuted>Renter</BadgeMuted>}
                </div>
                {(isBoard || r.share_email) && r.email && (
                  <a
                    href={`mailto:${r.email}`}
                    className="block text-[14px] text-(--accent) hover:underline"
                  >
                    {r.email}
                  </a>
                )}
                {(isBoard || r.share_phone) && r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className="block text-[14px] text-(--ink-soft) hover:text-(--accent)"
                  >
                    {r.phone}
                  </a>
                )}
              </div>
              <div className="shrink-0 text-right">
                {r.unit?.number ? (
                  <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-semibold">
                    Unit {r.unit.number}
                  </div>
                ) : (
                  <div className="text-[12px] tracking-[0.08em] uppercase text-(--ink-softer) font-medium">
                    No unit
                  </div>
                )}
                {isBoard && r.unit?.address && (
                  <div className="text-[12px] text-(--ink-soft) mt-1 max-w-[180px]">
                    {r.unit.address}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] tracking-[0.08em] uppercase font-semibold text-(--accent) bg-(--accent)/10 px-2 py-0.5 rounded">
      {children}
    </span>
  );
}

function BadgeMuted({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] tracking-[0.08em] uppercase font-semibold text-(--ink-soft) bg-(--line) px-2 py-0.5 rounded">
      {children}
    </span>
  );
}

function byUnitThenName(a: DirectoryRow, b: DirectoryRow): number {
  // Residents without a unit drop to the bottom; numeric unit numbers
  // sort numerically (12 before 102) so a townhouse community with
  // numeric addresses reads correctly.
  const aN = a.unit?.number ?? null;
  const bN = b.unit?.number ?? null;
  if (aN === null && bN === null) return a.name.localeCompare(b.name);
  if (aN === null) return 1;
  if (bN === null) return -1;
  const aNum = Number(aN);
  const bNum = Number(bN);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) {
    return aNum - bNum;
  }
  if (aN !== bN) return aN.localeCompare(bN);
  return a.name.localeCompare(b.name);
}
