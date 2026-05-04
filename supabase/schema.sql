-- Sandstone Ridge Portal — full schema.
-- Run once per community in the Supabase SQL editor (project owner role).
-- Idempotent-ish: re-running drops & rebuilds RLS policies, leaves data alone.

-- ============================================================================
-- Tables
-- ============================================================================

-- The single community this deploy serves. Always exactly one row.
create table if not exists hoa (
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

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  address text,
  unit_type text default 'single-family', -- single-family | townhouse | condo
  bedrooms int,
  square_feet int,
  notes text,
  created_at timestamptz default now()
);

-- Mirror of auth.users with portal-specific data.
create table if not exists residents (
  id uuid primary key references auth.users(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  name text not null,
  email text not null unique,
  phone text,
  role text not null default 'resident' check (role in ('resident', 'board')),
  is_owner boolean default true,
  -- Notification preferences (resident self-managed)
  notify_email boolean default true,
  notify_sms boolean default false,
  -- Directory visibility
  share_phone boolean default false,
  share_email boolean default true,
  created_at timestamptz default now()
);

-- Pre-registered residents (board adds them by email before they sign in).
-- Their auth.users row gets created on first magic-link click; the
-- ensureProfile flow claims this invite and copies unit_id / role / name
-- into a fresh residents row.
create table if not exists resident_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unit_id uuid references units(id) on delete set null,
  name text,
  role text not null default 'resident' check (role in ('resident', 'board')),
  invited_by uuid references residents(id),
  invited_at timestamptz default now(),
  claimed_at timestamptz
);

-- TCPA-compliant SMS consent log. Required before sending any SMS.
-- Keep forever; never hard-delete.
create table if not exists sms_consents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents(id) on delete cascade,
  phone text not null,
  consent_text text not null, -- exact wording shown when consent was given
  ip_address text,
  user_agent text,
  given_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists announcements (
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

create table if not exists announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  resident_id uuid not null references residents(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (announcement_id, resident_id)
);

create table if not exists calendar_events (
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

create table if not exists rsvps (
  event_id uuid not null references calendar_events(id) on delete cascade,
  resident_id uuid not null references residents(id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  responded_at timestamptz default now(),
  primary key (event_id, resident_id)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references residents(id),
  category text not null, -- governing | minutes | financial | insurance | other
  title text not null,
  description text,
  storage_path text not null, -- inside the 'documents' storage bucket
  file_size_bytes bigint,
  uploaded_at timestamptz default now()
);

create table if not exists issue_reports (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete set null,
  -- Anonymous reports allowed; resident_id null = anonymous.
  category text not null, -- maintenance | dispute | suggestion | other
  description text not null,
  attachments jsonb default '[]', -- [{name, storage_path}]
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'closed')),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Outbound queue. Every email + SMS gets logged here for audit.
create table if not exists outbound_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  recipient text not null, -- email address or E.164 phone
  subject text, -- email only
  body text not null,
  related_to text, -- 'announcement:{id}', 'event:{id}', etc.
  provider text, -- 'resend' | 'twilio'
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- Helper function: is the current user on the board?
-- ============================================================================

create or replace function is_board() returns boolean language sql stable as $$
  select exists (
    select 1 from residents
    where id = auth.uid() and role = 'board'
  );
$$;

-- ============================================================================
-- Row-Level Security
-- ============================================================================

alter table hoa enable row level security;
alter table units enable row level security;
alter table residents enable row level security;
alter table resident_invites enable row level security;
alter table sms_consents enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table calendar_events enable row level security;
alter table rsvps enable row level security;
alter table documents enable row level security;
alter table issue_reports enable row level security;
alter table outbound_messages enable row level security;

-- Drop & recreate so re-running is safe.
drop policy if exists hoa_read on hoa;
drop policy if exists units_read on units;
drop policy if exists residents_read on residents;
drop policy if exists residents_self_update on residents;
drop policy if exists invites_board_all on resident_invites;
drop policy if exists sms_consents_self_read on sms_consents;
drop policy if exists sms_consents_self_insert on sms_consents;
drop policy if exists announcements_read on announcements;
drop policy if exists announcements_write on announcements;
drop policy if exists announcement_reads_self on announcement_reads;
drop policy if exists events_read on calendar_events;
drop policy if exists events_write on calendar_events;
drop policy if exists rsvps_read on rsvps;
drop policy if exists rsvps_self on rsvps;
drop policy if exists documents_read on documents;
drop policy if exists documents_write on documents;
drop policy if exists reports_anon_insert on issue_reports;
drop policy if exists reports_self_insert on issue_reports;
drop policy if exists reports_board_read on issue_reports;
drop policy if exists outbound_board_read on outbound_messages;

-- Read: any authenticated resident can read non-sensitive tables.
create policy hoa_read on hoa for select to authenticated using (true);
create policy units_read on units for select to authenticated using (true);
create policy residents_read on residents for select to authenticated using (true);
create policy announcements_read on announcements for select to authenticated using (true);
create policy events_read on calendar_events for select to authenticated using (true);
create policy documents_read on documents for select to authenticated using (true);
create policy rsvps_read on rsvps for select to authenticated using (true);

-- Self-service: residents can update their own profile + RSVPs + read receipts.
create policy residents_self_update on residents
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy rsvps_self on rsvps
  for all to authenticated
  using (resident_id = auth.uid()) with check (resident_id = auth.uid());

create policy announcement_reads_self on announcement_reads
  for all to authenticated
  using (resident_id = auth.uid()) with check (resident_id = auth.uid());

-- SMS consent: residents see their own; insert via the consent flow.
create policy sms_consents_self_read on sms_consents
  for select to authenticated using (resident_id = auth.uid());
create policy sms_consents_self_insert on sms_consents
  for insert to authenticated with check (resident_id = auth.uid());

-- Write: board only.
create policy announcements_write on announcements
  for all to authenticated
  using (is_board()) with check (is_board());

create policy events_write on calendar_events
  for all to authenticated
  using (is_board()) with check (is_board());

create policy documents_write on documents
  for all to authenticated
  using (is_board()) with check (is_board());

create policy invites_board_all on resident_invites
  for all to authenticated
  using (is_board()) with check (is_board());

-- Issue reports: anyone (incl. anon via service role) can insert; board reads.
create policy reports_anon_insert on issue_reports
  for insert to anon with check (true);
create policy reports_self_insert on issue_reports
  for insert to authenticated with check (true);
create policy reports_board_read on issue_reports
  for select to authenticated using (is_board());

-- Outbound audit log: board reads only. Inserts come from the service role
-- (server-side wrappers in lib/email.ts and lib/sms.ts), which bypasses RLS.
create policy outbound_board_read on outbound_messages
  for select to authenticated using (is_board());

-- ============================================================================
-- Storage bucket for documents
-- ============================================================================

insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Storage policies: board uploads, residents read via signed URLs only.
drop policy if exists "documents read" on storage.objects;
drop policy if exists "documents board write" on storage.objects;

create policy "documents read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents');

create policy "documents board write" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and is_board())
  with check (bucket_id = 'documents' and is_board());
