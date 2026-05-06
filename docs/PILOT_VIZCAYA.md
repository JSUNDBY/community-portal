# Vizcaya Pilot Deploy Runbook

Step-by-step for spinning up a Vizcaya-branded pilot deploy of the
community portal. Targets one sub-association (Bellagio at Vizcaya)
as a 60-day proof-of-concept rather than the full 1,278-home master.

**Estimated time:** 15–20 minutes (most of it waiting for cloud
providers to provision).

---

## What you'll end up with

- A second Supabase project, isolated from Sandstone Ridge demo data
- A second Vercel deploy at `vizcaya-pilot-{hash}.vercel.app` (or your
  custom domain when ready)
- Vizcaya brand colors (terracotta + sage), Mediterranean address
  data, FL-flavored seed content (hurricane prep, pool reopening,
  annual meeting per FL 720)
- Two demo accounts the board can hand out for prospects on the
  Vizcaya side: `demo-board@example.com` / `demo-board-2026` and
  `demo-resident@example.com` / `demo-resident-2026`

---

## Prerequisites

- This repo cloned locally
- A working `gh` CLI (`gh auth status` succeeds)
- A Supabase account
- A Vercel account linked to the GitHub repo

---

## 1. Provision a fresh Supabase project (~3 min)

1. https://supabase.com → **New project**
2. Organization: same one as Sandstone, or a new one if you want
   stricter isolation
3. Name: `vizcaya-bellagio-pilot`
4. Region: **us-east-1** (closest to Miramar, FL)
5. Database password: generate a strong one and save it
6. Wait for provisioning (~2 min)

Once provisioned, in **Settings → API**, copy:
- **Project URL**
- **`sb_publishable_*`** key (anon)
- **`sb_secret_*`** key (service role) — click Reveal first

## 2. Apply the schema (~1 min)

In Supabase **SQL Editor → New query**, paste the contents of
`supabase/schema.sql` and run. You should see ~13 tables, the
`is_board()` function, RLS policies, and the documents storage bucket
created.

## 3. Update local `.env.local` to point at Vizcaya (~1 min)

Temporarily swap your local env to the new Supabase project and
Vizcaya brand vars. Save your existing `.env.local` first if you want
to switch back to Sandstone later.

```
NEXT_PUBLIC_SUPABASE_URL=https://<new-vizcaya-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<vizcaya>
SUPABASE_SERVICE_ROLE_KEY=sb_secret_<vizcaya>

NEXT_PUBLIC_COMMUNITY_NAME="Bellagio at Vizcaya"
NEXT_PUBLIC_COMMUNITY_SLUG="bellagio-vizcaya"
NEXT_PUBLIC_COMMUNITY_DOMAIN="vizcaya-pilot.vercel.app"

# Vizcaya brand: warm Mediterranean
NEXT_PUBLIC_PRIMARY_COLOR="#7C3F1A"
NEXT_PUBLIC_ACCENT_COLOR="#8AA67A"

COMMUNITY_CONTACT_EMAIL="board@vizcayacommunity.com"

EMAIL_FROM="Bellagio at Vizcaya <noreply@vizcayacommunity.com>"
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## 4. Run the Vizcaya seed (~30 sec)

```
npm run seed:vizcaya
```

You should see roughly:
- 1 hoa row (Bellagio at Vizcaya)
- 20 units (10 townhouses on SW 49th Ct, 10 single-families on SW 135th Way)
- 18 auth users + 18 residents (16 fictional with realistic Miramar-area names + 2 demo accounts)
- 5 announcements with read receipts
- 5 calendar events (pool opening, board meeting, annual meeting, hurricane workshop, July 4)
- 10 documents (CC&Rs, bylaws, articles, 3 minutes, budget, reserve study, insurance, hurricane guide)
- 3 issue reports (mixed states)

## 5. Verify locally (~2 min)

```
npm run dev
```

Visit `http://localhost:47331/` and confirm the Bellagio brand colors
load. Sign in with the demo board credentials and click around — the
seeded content should look Florida-realistic.

## 6. Create a new Vercel project for the pilot (~5 min)

The same GitHub repo (`JSUNDBY/community-portal`) can power multiple
Vercel projects with different env vars.

1. https://vercel.com/new → import `JSUNDBY/community-portal` again
2. **Project name:** `vizcaya-pilot`
3. In **Environment Variables**, paste the same Vizcaya `.env.local`
   you used in step 3 (Vercel parses it into individual rows)
4. **Deploy**
5. Wait ~90 seconds. You'll get `vizcaya-pilot-{hash}.vercel.app`.

## 7. Smoke-test the live deploy (~1 min)

```
curl -s -o /dev/null -w "%{http_code}\n" https://<the-vercel-url>/
curl -s -o /dev/null -w "%{http_code}\n" https://<the-vercel-url>/about
curl -s https://<the-vercel-url>/manifest.webmanifest
```

All should return 200; the manifest should report `Bellagio at
Vizcaya` and `theme_color: #7C3F1A`.

Open in incognito → click **Tour as a board member** → confirm seeded
data renders.

## 8. Switch your local back to Sandstone (~30 sec)

If you want your local dev server to point back at the Sandstone Ridge
demo Supabase, restore the original `.env.local`. Vercel keeps its
own Vizcaya env vars regardless of what's in your local file.

---

## What's still left for the actual sales path

This runbook gets you to a *working live demo* you can send David
Brown. To turn the pilot into a real customer engagement, you'll
also need:

- **Real logo** — Vizcaya doesn't have a wordmark logo asset yet; the
  hero photo in `/public/hero.png` is still Sandstone Ridge's. Either
  generate a Vizcaya hero via Midjourney + commission a wordmark, or
  use a temporary text-only treatment on the topbar
- **Custom domain** — when the board says yes, point a real subdomain
  (e.g. `portal.vizcayacommunity.com`) at the Vercel deploy and add
  it to the Vercel project's domains
- **Resend domain verification** for `vizcayacommunity.com` so
  outbound email sends from `noreply@vizcayacommunity.com`
- **Twilio phone number** with a 305-area code, configured for SMS
- **Production seed** — replace the demo seed with the real unit
  list, real board members as `resident_invites`, real
  governing-doc PDFs uploaded to the `documents` storage bucket

When you're ready for those, we can do them together. The runbook
above is the part you can run before any of that exists, just to
have a clickable, branded demo for the conversation.

---

## Notes on PMC sensitivity

The seed announcements and copy have been written to make the
PMC-coexistence framing visible to anyone clicking through:

- The welcome announcement explicitly says "*Our management company
  at Allied Property Group continues handling accounting, dues, and
  work orders. The portal is for board announcements, the calendar,
  governing documents, and a faster way to report issues.*"
- The contact email (`board@vizcayacommunity.com`) is the board, not
  the PMC — but the issue-reports flow can be configured to forward
  to whichever email address the PMC monitors
- The /about page now has a dedicated "For managed communities"
  section showing what the PMC keeps doing vs what the portal handles

If the actual PMC at Vizcaya is United Community Management Corp
(per one source) rather than Allied, swap the name in the welcome
announcement before sending the link.
