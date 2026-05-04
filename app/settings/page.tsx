import { redirect } from "next/navigation";
import { PageShell } from "@/app/_components/PageShell";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { getSmsConsentText } from "@/lib/sms";
import { COMMUNITY } from "@/lib/config";
import { saveProfile, recordSmsConsent, revokeSmsConsent } from "./actions";

const OK_MESSAGES: Record<string, string> = {
  profile: "Profile saved.",
  sms: "Phone confirmed and SMS opt-in is active. Watch for a confirmation text.",
  "sms-revoked": "SMS opt-in revoked. You won't get text alerts going forward.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await ensureProfile(supabase, user);

  // Look up the active consent row directly so the UI shows the right
  // state even if `residents.notify_sms` drifts (it's a cache, the
  // sms_consents table is the source of truth).
  const { data: activeConsent } = await supabase
    .from("sms_consents")
    .select("phone, given_at")
    .eq("resident_id", me.id)
    .is("revoked_at", null)
    .order("given_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const smsActive = !!activeConsent;

  return (
    <PageShell title="Settings">
      {ok && OK_MESSAGES[ok] && (
        <div className="text-[14px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          {OK_MESSAGES[ok]}
        </div>
      )}
      {error && (
        <div className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <Card title="Profile">
        <form action={saveProfile} className="space-y-4">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={me.name}
              className={inputCls}
            />
          </Field>
          <div className="text-[13px] text-(--ink-soft) -mt-2">
            Email: <span className="text-(--primary)">{me.email}</span>
            <span className="text-(--ink-softer)"> · changes via support</span>
          </div>

          <fieldset className="space-y-3 pt-2">
            <legend className="text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2">
              Notifications
            </legend>
            <Toggle name="notify_email" defaultChecked={me.notify_email}>
              Email me announcements and meeting reminders
            </Toggle>
          </fieldset>

          <fieldset className="space-y-3 pt-2">
            <legend className="text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2">
              Directory visibility
            </legend>
            <Toggle name="share_email" defaultChecked={me.share_email}>
              Show my email in the resident directory
            </Toggle>
            <Toggle name="share_phone" defaultChecked={me.share_phone}>
              Show my phone in the resident directory
            </Toggle>
            <p className="text-[12px] text-(--ink-softer) leading-[1.5]">
              Board members always see your contact info.
            </p>
          </fieldset>

          <button
            type="submit"
            className="bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
          >
            Save profile
          </button>
        </form>
      </Card>

      <Card title="SMS alerts">
        {smsActive ? (
          <>
            <p className="text-[15px] text-(--primary) mb-2">
              <span className="text-(--accent) font-medium">SMS opt-in is active.</span>{" "}
              Texts go to {activeConsent.phone}.
            </p>
            <p className="text-[13px] text-(--ink-soft) mb-4">
              Confirmed{" "}
              {new Date(activeConsent.given_at).toLocaleDateString()}.
              You can also reply STOP to any text to unsubscribe instantly.
            </p>
            <form action={revokeSmsConsent}>
              <button
                type="submit"
                className="text-[14px] text-(--ink-soft) underline underline-offset-2 hover:text-red-700 transition"
              >
                Revoke SMS opt-in
              </button>
            </form>
          </>
        ) : (
          <form action={recordSmsConsent} className="space-y-4">
            <Field
              label="Phone"
              htmlFor="phone"
              hint="US phone numbers only. We text only board announcements and reminders."
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                defaultValue={me.phone ?? ""}
                placeholder="(555) 123-4567"
                className={inputCls}
              />
            </Field>

            <label className="flex items-start gap-3 text-[14px] text-(--primary) cursor-pointer">
              <input
                type="checkbox"
                name="sms_consent"
                required
                className="mt-1"
              />
              <span className="text-[13px] text-(--ink-soft) leading-[1.55]">
                {getSmsConsentText()}
              </span>
            </label>

            <button
              type="submit"
              className="bg-(--accent) text-white font-medium text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition"
            >
              Confirm and opt in
            </button>
          </form>
        )}
      </Card>

      <p className="text-[12px] text-(--ink-softer) leading-[1.5] mt-6 text-center">
        Trouble? Email{" "}
        <a
          href={`mailto:${COMMUNITY.contactEmail}`}
          className="text-(--accent) underline underline-offset-2"
        >
          {COMMUNITY.contactEmail}
        </a>
        .
      </p>
    </PageShell>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-(--paper) border border-(--line) rounded-xl p-6 mb-4">
      <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-(--primary) mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] tracking-[0.08em] uppercase text-(--ink-soft) font-semibold mb-2"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-(--ink-softer) mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-[14px] text-(--primary) cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span>{children}</span>
    </label>
  );
}

const inputCls =
  "w-full bg-(--background) border border-(--line) rounded-[10px] px-4 py-3 text-[15px] text-(--primary) placeholder:text-(--ink-softer) focus:outline-none focus:border-(--accent) focus:bg-(--paper) transition";
