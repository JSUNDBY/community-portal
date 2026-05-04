# Sandstone Ridge Resident Portal

Private resident portal for the Sandstone Ridge HOA. Magic-link sign-in,
shared calendar, announcements, document vault, and an issue-report inbox.

## Who maintains this

Built and maintained by Josh Sundby (freelance). Email **j.sundby@gmail.com**
for support, change requests, or to hand the project off to another developer.

The codebase is yours — there is no vendor lock-in. Every cloud account
(Supabase, Vercel, Resend, Twilio, Cloudflare, the domain) is set up under
a billing email you control. If you ever want to take this elsewhere, hand
this README, the env vars, and the cloud logins to any web developer and
they should be productive within a couple of hours.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) — web framework
- **TypeScript** — type-checked throughout
- **Tailwind 4** — styling
- **Supabase** — Postgres database, authentication (magic-link), file
  storage for the document vault
- **Resend** — branded transactional email
- **Twilio** — SMS announcements (TCPA-compliant, opt-in only)
- **Vercel** — hosting; deploys on every push to `main`
- **Cloudflare DNS** — domain routed to Vercel

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real values
npm run dev                        # starts on http://localhost:47331
npm run typecheck
npm run build
```

Required env vars are documented in [`.env.local.example`](.env.local.example).
Without `RESEND_API_KEY` or Twilio creds, outbound messages queue to
`outbound_messages` with status = `skipped` instead of being sent — useful
for safe local development.

## How to add a new resident (board member)

The board adds a resident before they sign in. The next time the resident
clicks a magic-link, the portal claims their invite and links them to a unit.

1. Open the Supabase SQL editor for this project.
2. Run:

   ```sql
   insert into resident_invites (email, name, unit_id, role)
   values (
     'jane@example.com',
     'Jane Resident',
     (select id from units where number = '12'),
     'resident'           -- or 'board'
   );
   ```

3. Email the resident: "Visit https://portal.sandstoneridge.com and click
   'Sign in'." When they click their magic-link, they're set up automatically.

## How to send an announcement

1. Sign in as a board member.
2. Click **Announcements → New announcement**.
3. Compose, choose email + (optional) SMS, hit publish.

Announcements fan out via Resend (email) and Twilio (SMS). Every send is
logged in the `outbound_messages` table for audit.

## Where the data lives

Everything is in one Supabase project (Postgres + Auth + Storage):

- Project URL: set in `NEXT_PUBLIC_SUPABASE_URL`
- Login at https://supabase.com with the project owner's email
- Schema lives in [`supabase/schema.sql`](supabase/schema.sql) — run it in
  the SQL editor against a fresh project to recreate everything

## How to export everything

```bash
# Replace with the connection string from Supabase → Settings → Database
pg_dump "postgresql://postgres:[PASSWORD]@db.<project>.supabase.co:5432/postgres" \
  > sandstone-ridge-backup-$(date +%Y%m%d).sql
```

Document files in the `documents` storage bucket export via the Supabase
dashboard (Storage → documents → "Download bucket").

## Cost breakdown (per month, rough)

| Service | Cost | Notes |
|---|---|---|
| Supabase | $0 – $25 | Free tier covers most communities; Pro shared across deploys |
| Vercel | $0 | Hobby tier covers a single HOA |
| Resend | ~$2 | Small share of a $20/50K-email plan |
| Twilio | ~$1 + per-SMS | $1/mo phone + ≈$0.0079/SMS |
| Cloudflare DNS | $0 | Free tier |
| Domain | ~$1 | $12/yr, your registrar |

## Emergencies

For platform issues (site down, can't sign in, lost board access):
**j.sundby@gmail.com**, or text Josh directly.

For Supabase/Vercel/Resend incidents, status pages are at
status.supabase.com / vercel-status.com / resend.com/status.

## Project layout

See [`docs/PORTAL_SCAFFOLD_SPEC.md`](docs/PORTAL_SCAFFOLD_SPEC.md) for the
architectural decisions baked into this codebase.
