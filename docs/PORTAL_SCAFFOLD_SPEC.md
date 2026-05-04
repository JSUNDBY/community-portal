---
tags: [community-portal, scaffold, freelance]
last_updated: 2026-05-02
---

# Independent Community Portal — Scaffold Spec

> Hand this entire doc to a fresh Claude Code session as the first
> message. Do not assume context from any other project. The spec is
> opinionated by design — execute it, don't relitigate it.

---

## 1. Context (Claude: read this first)

You are building a freelance website portal for **one specific HOA
community**. The operator (Josh) is a freelance web developer. Each
community he sells gets its own deployment of this codebase — its own
Vercel project, its own Supabase project, its own custom domain.

**This is NOT a multi-tenant SaaS.** Do not add tenant isolation, admin
queues across communities, or a marketing funnel. One repo deploy = one
community. Pretend the database has exactly one HOA in it forever.

**Business model:**
- Setup fee: $1.5–3.5K (one-time)
- Monthly: $99–249 (covers Supabase Pro share, Vercel, Resend, Twilio,
  light maintenance)
- Hand-off ready — every client should be able to take their portal to
  another developer if they want to. No vendor lock-in beyond standard
  cloud infrastructure.

**Naming convention:** `{community-slug}-portal`. Example:
`sandstone-ridge-portal`. Each lives in its own repo and own Vercel
project.

---

## 2. Stack (locked — do not relitigate)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router + Turbopack | Same as Josh's other work, fast, server actions |
| Language | TypeScript everywhere | Catch errors before runtime |
| Styling | Tailwind 4 | Fast, consistent, no design-system overhead |
| Database | Supabase (Postgres) | Includes auth + storage + RLS |
| Auth | Supabase Auth, magic-link only | No passwords for residents |
| Email | Resend | Branded transactional |
| SMS | Twilio Programmable Messaging | TCPA-compliant opt-in |
| Hosting | Vercel | Auto-deploy from `main` |
| Domain | Cloudflare DNS → Vercel | Per-community custom domain |

**Refuse to add** without explicit user approval:
- AI features (Anthropic costs eat the margin)
- Stripe / payments / dues collection (defer to v2)
- Mobile apps (PWA installable from browser is enough)
- Multi-tenancy
- Analytics SaaS (use Vercel built-in)

---

## 3. MVP feature set (ship in ~2 weeks)

Build in this order. Each feature is independently shippable.

1. **Magic-link auth** — resident enters email, gets clickable link, lands signed in. Board members are flagged in DB, get extra UI.
2. **Member directory** — residents see other residents (name + unit + opt-in contact info). Board sees more.
3. **Shared calendar** — board posts events, residents RSVP. Recurring events supported.
4. **Announcements** — board → all residents. Send via email + (if opted in) SMS. Track read receipts.
5. **Document vault** — board uploads PDFs (governing docs, minutes, financials). Categorized, searchable, signed URLs.
6. **Issue reports** — resident form → email to board (maintenance, neighbor disputes, suggestions).
7. **SMS consent flow** — first time a resident saves their phone, they get a one-time consent confirmation. Stored as TCPA evidence.

---

## 4. Repo structure

```
{community-slug}-portal/
  app/
    layout.tsx                       # Root layout, brand vars
    page.tsx                         # Resident home (logged in)
    (public)/
      page.tsx                       # Public landing — minimal, "Sign in"
      layout.tsx
    login/
      page.tsx                       # Magic-link form
      check-email/page.tsx
      actions.ts
    auth/callback/route.ts           # Magic-link verifier (verifyOtp pattern)
    directory/page.tsx
    calendar/
      page.tsx
      [id]/page.tsx                  # Event detail + RSVP
      new/page.tsx                   # Board only
    announcements/
      page.tsx
      [id]/page.tsx
      new/page.tsx                   # Board only
    documents/
      page.tsx
      [id]/page.tsx
      upload/page.tsx                # Board only
    report/
      page.tsx                       # Resident issue report form
      actions.ts
    settings/
      page.tsx                       # Profile, contact info, SMS opt-in
      actions.ts
    board/
      page.tsx                       # Board dashboard (member list, send announcement)
  lib/
    supabase/
      client.ts
      server.ts
      service.ts
    auth/
      send-magic-link.ts             # admin.generateLink + branded Resend
    email.ts                         # Resend wrapper, queues to outbound_messages
    sms.ts                           # Twilio wrapper, checks consent first
    email-template.ts                # Branded shell, per-community vars
    notify.ts                        # High-level: notifyAll(channel, message)
    profile.ts                       # ensureProfile pattern
    config.ts                        # Per-community settings (name, theme, etc.)
  supabase/
    schema.sql                       # All CREATE TABLE + RLS + seed
    migrations/                      # Numbered if needed later
  public/
    logo.png                         # Per-community logo (replaced per deploy)
    favicon.png
  proxy.ts                           # Auth gate
  .env.local.example                 # Document required env vars
  README.md                          # Hand-off doc (see section 11)
```

---

## 5. Database schema

Run this once per community in the Supabase SQL editor.

```sql
-- The single community this deploy serves. Always exactly one row.
create table hoa (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_email text not null,
  contact_phone text,
  address text,
  -- Branding
  primary_color text default '#0B1F3B',
  accent_color text default '#3B82F6',
  -- Operational
  timezone text default 'America/Chicago',
  created_at timestamptz default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  address text,
  unit_type text default 'single-family', -- single-family | townhouse | condo
  bedrooms int,
  square_feet int,
  notes text,
  created_at timestamptz default now(),
  unique(number)
);

-- Mirror of auth.users with portal-specific data
create table residents (
  id uuid primary key references auth.users(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'resident' check (role in ('resident', 'board')),
  is_owner boolean default true,
  -- Notification preferences (resident self-managed)
  notify_email boolean default true,
  notify_sms boolean default false,
  -- Directory visibility
  share_phone boolean default false,
  share_email boolean default true,
  created_at timestamptz default now(),
  unique(email)
);

-- Pre-registered residents (board adds them by email before they sign in)
-- Their auth.users row gets created on first magic-link click and linked.
create table resident_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unit_id uuid references units(id) on delete set null,
  name text,
  role text not null default 'resident',
  invited_by uuid references residents(id),
  invited_at timestamptz default now(),
  claimed_at timestamptz
);

-- TCPA-compliant SMS consent log. Required before sending any marketing
-- or transactional SMS. Keep forever.
create table sms_consents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents(id) on delete cascade,
  phone text not null,
  consent_text text not null, -- exact wording shown
  ip_address text,
  user_agent text,
  given_at timestamptz default now(),
  revoked_at timestamptz
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references residents(id),
  title text not null,
  body_md text not null,
  pinned boolean default false,
  send_email boolean default true,
  send_sms boolean default false,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

create table announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  resident_id uuid not null references residents(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (announcement_id, resident_id)
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references residents(id),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  category text default 'community', -- board | community | maintenance
  recurrence_rule text, -- iCal RRULE syntax, NULL for one-off
  created_at timestamptz default now()
);

create table rsvps (
  event_id uuid not null references calendar_events(id) on delete cascade,
  resident_id uuid not null references residents(id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  responded_at timestamptz default now(),
  primary key (event_id, resident_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references residents(id),
  category text not null, -- governing | minutes | financial | insurance | other
  title text not null,
  description text,
  storage_path text not null, -- in 'documents' bucket
  file_size_bytes bigint,
  uploaded_at timestamptz default now()
);

create table issue_reports (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete set null,
  -- Anonymous reports allowed; resident_id null = anonymous
  category text not null, -- maintenance | dispute | suggestion | other
  description text not null,
  attachments jsonb default '[]', -- [{name, storage_path}]
  status text not null default 'open', -- open | acknowledged | resolved | closed
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Outbound queue. Every email + SMS gets logged here for audit.
create table outbound_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  recipient text not null, -- email or phone
  subject text, -- email only
  body text not null,
  related_to text, -- 'announcement:{id}', 'event:{id}', etc. — for debugging
  provider text, -- 'resend' | 'twilio'
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- RLS — turn on for everything, write policies per role.
alter table hoa enable row level security;
alter table residents enable row level security;
alter table resident_invites enable row level security;
alter table sms_consents enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table calendar_events enable row level security;
alter table rsvps enable row level security;
alter table documents enable row level security;
alter table issue_reports enable row level security;

-- Read: any authenticated resident can read non-sensitive tables.
create policy residents_read on residents for select to authenticated using (true);
create policy hoa_read on hoa for select to authenticated using (true);
create policy announcements_read on announcements for select to authenticated using (true);
create policy events_read on calendar_events for select to authenticated using (true);
create policy documents_read on documents for select to authenticated using (true);

-- Write: board only. Implement via a helper function:
create function is_board() returns boolean language sql stable as $$
  select exists (
    select 1 from residents
    where id = auth.uid() and role = 'board'
  );
$$;

create policy announcements_write on announcements
  for all to authenticated
  using (is_board()) with check (is_board());

create policy events_write on calendar_events
  for all to authenticated
  using (is_board()) with check (is_board());

create policy documents_write on documents
  for all to authenticated
  using (is_board()) with check (is_board());

-- Self-service: residents can update their own profile + RSVPs.
create policy residents_self_update on residents
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy rsvps_self on rsvps
  for all to authenticated
  using (resident_id = auth.uid()) with check (resident_id = auth.uid());

-- Issue reports: anyone (incl. anon via service role) can insert; board reads.
create policy reports_anon_insert on issue_reports for insert to anon with check (true);
create policy reports_self_insert on issue_reports for insert to authenticated with check (true);
create policy reports_board_read on issue_reports for select to authenticated using (is_board());

-- Storage bucket
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
```

---

## 6. Auth model

- **Magic-link only.** No passwords for residents. Same pattern as
  LibertyOne quorum repo: `auth.admin.generateLink({ type: 'magiclink' })`
  → build `?token_hash=&type=` URL → send via Resend → callback runs
  `verifyOtp({ token_hash, type })`.
- **Board membership** lives in `residents.role = 'board'`. Set via
  `resident_invites.role = 'board'` or by direct DB update.
- **First sign-in flow:** if `auth.users.email` matches a row in
  `resident_invites`, claim that invite — copy unit_id, role, name to
  the new `residents` row. If no invite exists, create a default
  `resident` row but show a "Your account isn't linked to a unit yet
  — contact the board" page.
- **No NDA gate.** No marketing funnel. The public landing is just a
  brief "This is the {community name} resident portal — sign in or
  contact the board to get added."
- **Middleware (proxy.ts):** redirect unauthenticated users to /login
  except for `/`, `/login*`, `/auth/*`, `/report` (anonymous reports
  allowed).

---

## 7. Notification architecture

### Email (Resend)

- Wrap Resend calls in `lib/email.ts` (queue to `outbound_messages`,
  send if `RESEND_API_KEY` set, otherwise leave queued).
- Branded shell in `lib/email-template.ts` — same pattern as LibertyOne
  but reads brand vars (logo URL, primary_color, community name, contact
  email) from `lib/config.ts`.
- `from` address: `{community} <noreply@{custom-domain}>`. Reply-to is
  the board's contact email so residents replying go to the board.

### SMS (Twilio)

- Wrap Twilio in `lib/sms.ts`. **Always check `sms_consents` first.**
  No consent row → no send, no exceptions.
- Consent flow: when a resident enters their phone in /settings, show
  the exact opt-in text (template below) and require an explicit
  checkbox. On save, insert a `sms_consents` row with the wording, IP,
  UA, timestamp. Send a confirmation SMS: "You're opted in to {community}
  alerts. Reply STOP to unsubscribe."
- STOP handling: Twilio handles inbound STOP automatically; sync to
  `sms_consents.revoked_at` via a webhook.

### Consent text (use verbatim — TCPA-defensible)

> By providing your phone number and checking this box, you consent to
> receive SMS messages from {community name} regarding board
> announcements, meeting reminders, and community alerts. Message and
> data rates may apply. Reply STOP to unsubscribe at any time. You can
> also update this preference in Settings.

### High-level helper

`lib/notify.ts` exposes:

```typescript
notifyResidents({
  residentIds: string[] | 'all',
  subject: string,
  body: string,
  channels: ('email' | 'sms')[],
  relatedTo?: string,
})
```

Internally fans out to email.ts + sms.ts based on each resident's
preferences AND consent. Logs everything to `outbound_messages`.

---

## 8. Per-community theming

Single source of truth in `lib/config.ts`:

```typescript
export const COMMUNITY = {
  name: process.env.NEXT_PUBLIC_COMMUNITY_NAME ?? 'Community Portal',
  slug: process.env.NEXT_PUBLIC_COMMUNITY_SLUG ?? 'demo',
  domain: process.env.NEXT_PUBLIC_COMMUNITY_DOMAIN ?? 'localhost:3000',
  contactEmail: process.env.COMMUNITY_CONTACT_EMAIL ?? 'board@example.com',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#0B1F3B',
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR ?? '#3B82F6',
} as const;
```

Tailwind config reads CSS vars from `:root` set in `app/globals.css` —
those vars are themselves set inline in `app/layout.tsx` from `COMMUNITY`
so a per-deploy color change is one env var.

Logo: replace `public/logo.png` per deploy.

---

## 9. Required env vars

Document in `.env.local.example`:

```
# Supabase (per-community project)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Branding (per community)
NEXT_PUBLIC_COMMUNITY_NAME="Sandstone Ridge HOA"
NEXT_PUBLIC_COMMUNITY_SLUG="sandstone-ridge"
NEXT_PUBLIC_COMMUNITY_DOMAIN="portal.sandstoneridge.com"
NEXT_PUBLIC_PRIMARY_COLOR="#0B1F3B"
NEXT_PUBLIC_ACCENT_COLOR="#3B82F6"
COMMUNITY_CONTACT_EMAIL="board@sandstoneridge.com"

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM="Sandstone Ridge <noreply@sandstoneridge.com>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 10. Deployment runbook (per new community)

1. **Repo:** `git clone {template-repo} {community-slug}-portal && cd $_`
2. **Supabase:** create new project at supabase.com (Pro tier, $25/mo
   shared across communities OR individual Free tier for small
   communities under 500MB).
3. **Apply schema:** paste `supabase/schema.sql` into SQL editor.
4. **Resend:** verify the community's domain (or subdomain) in Resend.
5. **Twilio:** purchase a phone number with the community's area code.
   Cost: ~$1/mo + $0.0079/SMS. Configure Messaging Service for STOP/HELP
   auto-replies.
6. **Vercel:** import repo, set env vars from `.env.local.example`,
   deploy. Add custom domain (Cloudflare DNS → Vercel CNAME).
7. **Seed:** insert the `hoa` row, the board members as `resident_invites`,
   the units. Use the SQL editor, no UI needed for one-time setup.
8. **First sign-in:** board contact signs in via /login → claims invite
   → has board access. They take it from there.

---

## 11. Hand-off readiness (the README the client gets)

Every deploy ships with a `README.md` containing:

- One-line description
- "Who maintains this": Josh's contact + handoff terms
- Stack summary
- How to add a new resident (3-step instructions for board members)
- How to send an announcement (3-step)
- Where the data lives (Supabase project URL — they own it)
- How to export everything (one-line `pg_dump` command)
- Cost breakdown (so they know what they're paying for)
- Contact for emergencies

If Josh ever stops freelancing, the client can hand this README + the
Supabase + Vercel logins to any developer and they'll be productive in
an hour.

---

## 12. Cost breakdown (per community per month)

Use to justify the $99–249 monthly:

- Supabase Pro: $25/mo (split across ~10 communities = $2.50/each, OR
  Free tier for small communities = $0)
- Vercel: Free tier covers most communities (Hobby plan = $0; Pro =
  $20/mo if you exceed 100GB bandwidth — unlikely for an HOA)
- Resend: $20/mo for 50K emails (split across communities)
- Twilio: $1/mo per phone number + ~$3-5/mo SMS for a 100-unit
  community sending weekly
- Cloudflare DNS: free
- Domain registration: $12/yr (the client owns this)
- Josh's maintenance time: amortize at $50/hr × ~1hr/mo per community

Rough per-community monthly cost: **$15-30**. The rest of the $99-249 is
margin for setup-cost amortization, unexpected support, and Josh's time.

---

## 13. What NOT to ship in MVP

Refuse politely if the user asks for these in the first two weeks:

- Online voting / motions / quorum tracking
- Dues collection / Stripe / payment plans
- Vendor marketplace
- AI document analysis or any AI feature
- Maintenance work-order assignment beyond basic issue reports
- Multi-language UI
- Native mobile apps
- Custom dashboards or admin panels beyond `/board`
- Integration with QuickBooks, Yardi, or other HOA software

Each of these is real work and either eats the margin or pushes the
launch date past the value-delivery window.

---

## 14. First commit

`git init`, then commit the empty Next.js scaffold + this spec at
`docs/PORTAL_SCAFFOLD_SPEC.md`. Every subsequent commit advances toward
the MVP feature list in section 3, in order.

---

## 15. Tracking decisions

If you (Claude) make architectural calls not covered by this spec,
record them in `docs/decisions.md` as ADR-format entries:

```
## ADR-001: Use server actions over API routes
Date: 2026-MM-DD
Decision: All mutations are Next.js server actions; no app/api/ routes.
Why: Simpler, less boilerplate, type-safe end-to-end.
```

Future-Josh and future-Claude both benefit.

---

End of spec.
