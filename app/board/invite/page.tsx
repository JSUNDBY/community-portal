import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { COMMUNITY } from "@/lib/config";
import { inviteResident, revokeInvite } from "./actions";

type UnitOption = { id: string; number: string };

type InviteRow = {
  id: string;
  email: string;
  name: string | null;
  role: "resident" | "board";
  invited_at: string;
  claimed_at: string | null;
  unit: { number: string } | null;
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; email?: string }>;
}) {
  const { ok, error, email } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);
  if (me.role !== "board") redirect("/");

  const [{ data: unitsRaw }, { data: invitesRaw }] = await Promise.all([
    supabase.from("units").select("id, number").order("number"),
    supabase
      .from("resident_invites")
      .select(
        `id, email, name, role, invited_at, claimed_at,
         unit:units(number)`
      )
      .order("invited_at", { ascending: false }),
  ]);

  const units = (unitsRaw as UnitOption[] | null) ?? [];
  const invites = (invitesRaw as unknown as InviteRow[] | null) ?? [];
  const pending = invites.filter((i) => !i.claimed_at);
  const claimed = invites.filter((i) => i.claimed_at);

  return (
    <PageShell title="Invite a resident">
      <p className="text-[15px] text-(--ink-soft) mb-6 leading-[1.55]">
        Pre-register a resident by email. The next time they request a sign-in
        link from the portal, they&rsquo;ll be linked to their unit and (if
        marked) given board access. Optionally send the welcome email
        immediately.
      </p>

      {ok === "invited" && (
        <div className="text-[14px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          Invite created{email ? ` for ${email}` : ""}. They&rsquo;ll be linked
          on their first sign-in.
        </div>
      )}
      {ok === "invited-and-emailed" && (
        <div className="text-[14px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          Invite created and welcome email sent
          {email ? ` to ${email}` : ""}.
        </div>
      )}
      {ok === "revoked" && (
        <div className="text-[14px] text-(--primary) bg-(--paper) border border-(--line) rounded-lg px-4 py-3 mb-4">
          Invite revoked.
        </div>
      )}
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form
        action={inviteResident}
        className="bg-(--paper) border border-(--line) rounded-xl p-6 space-y-4 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="resident@email.com"
              className={inputCls}
            />
          </div>
          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Resident"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_id">Unit</Label>
            <select
              id="unit_id"
              name="unit_id"
              defaultValue=""
              className={inputCls}
            >
              <option value="">— No unit —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.number}
                </option>
              ))}
            </select>
            {units.length === 0 && (
              <p className="text-[12px] text-(--ink-softer) mt-1">
                No units in the database yet. Add them in the Supabase SQL editor first.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="resident"
              className={inputCls}
            >
              <option value="resident">Resident</option>
              <option value="board">Board member</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 text-[14px] text-(--primary) cursor-pointer">
          <input
            type="checkbox"
            name="send_welcome"
            defaultChecked
            className="mt-1"
          />
          <span>
            Email a sign-in link now ({COMMUNITY.name} branded). Uncheck to
            invite quietly and send the welcome later.
          </span>
        </label>

        <button
          type="submit"
          className="w-full sm:w-auto bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
        >
          Invite resident
        </button>
      </form>

      <h2 className="text-[18px] font-semibold text-(--primary) mb-3">
        Pending invites
        <span className="text-(--ink-softer) font-medium ml-2">
          ({pending.length})
        </span>
      </h2>
      {pending.length === 0 ? (
        <p className="text-[14px] text-(--ink-soft) bg-(--paper) border border-(--line) rounded-xl p-5 mb-8">
          No pending invites.
        </p>
      ) : (
        <ul className="bg-(--paper) border border-(--line) rounded-xl divide-y divide-(--line) mb-8">
          {pending.map((inv) => (
            <li key={inv.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-(--primary)">
                  {inv.name || inv.email}
                </div>
                {inv.name && (
                  <div className="text-[13px] text-(--ink-soft)">
                    {inv.email}
                  </div>
                )}
                <div className="text-[12px] text-(--ink-softer) mt-1">
                  Invited {new Date(inv.invited_at).toLocaleDateString()}
                  {inv.unit?.number && <> · Unit {inv.unit.number}</>}
                  {inv.role === "board" && <> · Board</>}
                </div>
              </div>
              <form action={revokeInvite}>
                <input type="hidden" name="id" value={inv.id} />
                <button
                  type="submit"
                  className="text-[13px] text-(--ink-soft) hover:text-red-700 transition"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {claimed.length > 0 && (
        <details className="bg-(--paper) border border-(--line) rounded-xl px-5 py-4">
          <summary className="text-[14px] font-medium text-(--primary) cursor-pointer">
            Claimed invites ({claimed.length})
          </summary>
          <ul className="mt-3 space-y-1 text-[13px] text-(--ink-soft)">
            {claimed.map((inv) => (
              <li key={inv.id}>
                {inv.name || inv.email} ·{" "}
                {inv.claimed_at
                  ? new Date(inv.claimed_at).toLocaleDateString()
                  : ""}
                {inv.unit?.number && <> · Unit {inv.unit.number}</>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-8">
        <Link
          href="/board"
          className="text-[13px] text-(--ink-soft) hover:text-(--accent) transition"
        >
          ← Board dashboard
        </Link>
      </div>
    </PageShell>
  );
}

const inputCls =
  "w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
    >
      {children}
    </label>
  );
}
