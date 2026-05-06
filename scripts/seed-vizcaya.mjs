#!/usr/bin/env node
/**
 * Vizcaya Community Association (Miramar, FL) — pilot seed.
 *
 * Mirrors what residents see today on AssociationVoice but with a
 * functioning calendar, announcements with read receipts, document
 * vault, and SMS-ready announcements. Built around one sub-association
 * (Bellagio) as the recommended pilot scope; the full master
 * (1,278 homes) would be a custom build.
 *
 * Reads SUPABASE_URL + SERVICE_ROLE_KEY from .env.local (which should
 * point at a NEW Supabase project provisioned for the Vizcaya pilot —
 * not the Sandstone Ridge demo project).
 *
 * Run: `npm run seed:vizcaya`
 *
 * Idempotent: safe to re-run; skips already-seeded sections.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

// ---------- env ----------

function loadEnv() {
  const text = readFileSync(join(repoRoot, ".env.local"), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[m[1]] = value;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!SUPABASE_URL.includes("supabase.co")) {
  console.error("Refusing to run: SUPABASE_URL doesn't look like a Supabase project");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function adminCreateUser({ email, password }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 422 || res.status === 409 || /exists/i.test(text)) {
      const list = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        { headers }
      ).then((r) => r.json());
      const found = list?.users?.find((u) => u.email === email);
      if (found) return found;
    }
    throw new Error(`createUser ${email} -> ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

const DAY = 24 * 60 * 60 * 1000;
function daysAgo(n) {
  return new Date(Date.now() - n * DAY).toISOString();
}
function daysFromNow(n, atHour = 19) {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(atHour, 0, 0, 0);
  return d.toISOString();
}

// ---------- pilot scope: Bellagio at Vizcaya (one sub-association) ----------

// Mediterranean / Miramar-flavored street names matching the actual
// Vizcaya naming pattern (Bellagio Way, Palazzo Drive, etc.)
const UNITS = [
  ["1",  "13501 SW 49th Ct",   "townhouse",   3],
  ["2",  "13503 SW 49th Ct",   "townhouse",   3],
  ["3",  "13505 SW 49th Ct",   "townhouse",   3],
  ["4",  "13507 SW 49th Ct",   "townhouse",   2],
  ["5",  "13509 SW 49th Ct",   "townhouse",   2],
  ["6",  "13511 SW 49th Ct",   "townhouse",   3],
  ["7",  "13513 SW 49th Ct",   "townhouse",   3],
  ["8",  "13515 SW 49th Ct",   "townhouse",   3],
  ["9",  "13517 SW 49th Ct",   "townhouse",   2],
  ["10", "13519 SW 49th Ct",   "townhouse",   2],
  ["11", "5001 SW 135th Way",  "single-family", 4],
  ["12", "5003 SW 135th Way",  "single-family", 4],
  ["13", "5005 SW 135th Way",  "single-family", 3],
  ["14", "5007 SW 135th Way",  "single-family", 4],
  ["15", "5009 SW 135th Way",  "single-family", 3],
  ["16", "5011 SW 135th Way",  "single-family", 4],
  ["17", "5013 SW 135th Way",  "single-family", 3],
  ["18", "5015 SW 135th Way",  "single-family", 4],
  ["19", "5017 SW 135th Way",  "single-family", 3],
  ["20", "5019 SW 135th Way",  "single-family", 4],
];

// Names reflecting Miramar's actual demographics — diverse mix.
const FICTIONAL_RESIDENTS = [
  { email: "carmen.rodriguez@example.com", name: "Carmen Rodriguez", role: "board",    unit: "1",  share_email: true,  share_phone: true,  notify_email: true,  notify_sms: true  },
  { email: "luis.fernandez@example.com",   name: "Luis Fernández",   role: "board",    unit: "11", share_email: true,  share_phone: true,  notify_email: true,  notify_sms: true  },
  { email: "marie.charles@example.com",    name: "Marie Charles",    role: "resident", unit: "4",  share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "anthony.greene@example.com",   name: "Anthony Greene",   role: "resident", unit: "5",  share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "ana.martinez@example.com",     name: "Ana Martínez",     role: "resident", unit: "6",  share_email: true,  share_phone: true,  notify_email: true,  notify_sms: true  },
  { email: "david.kim@example.com",        name: "David Kim",        role: "resident", unit: "7",  share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "fatima.haddad@example.com",    name: "Fatima Haddad",    role: "resident", unit: "8",  share_email: false, share_phone: false, notify_email: true,  notify_sms: false },
  { email: "robert.washington@example.com",name: "Robert Washington",role: "resident", unit: "9",  share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "elena.gomez@example.com",      name: "Elena Gómez",      role: "resident", unit: "10", share_email: true,  share_phone: true,  notify_email: true,  notify_sms: true  },
  { email: "michael.obrien@example.com",   name: "Michael O'Brien",  role: "resident", unit: "12", share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "priya.shah@example.com",       name: "Priya Shah",       role: "resident", unit: "13", share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "jose.castillo@example.com",    name: "José Castillo",    role: "resident", unit: "14", share_email: true,  share_phone: true,  notify_email: true,  notify_sms: false },
  { email: "denise.brooks@example.com",    name: "Denise Brooks",    role: "resident", unit: "15", share_email: true,  share_phone: false, notify_email: false, notify_sms: false },
  { email: "rachel.cohen@example.com",     name: "Rachel Cohen",     role: "resident", unit: "16", share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
  { email: "chen.wei@example.com",         name: "Chen Wei",         role: "resident", unit: "17", share_email: false, share_phone: false, notify_email: true,  notify_sms: false },
  { email: "samuel.delacruz@example.com",  name: "Samuel de la Cruz",role: "resident", unit: "18", share_email: true,  share_phone: false, notify_email: true,  notify_sms: false },
];

const DEMO_BOARD = {
  email: "demo-board@example.com",
  password: "demo-board-2026",
  name: "Demo Board Member",
  role: "board",
  unit: "2",
};

const DEMO_RESIDENT = {
  email: "demo-resident@example.com",
  password: "demo-resident-2026",
  name: "Demo Resident",
  role: "resident",
  unit: "3",
};

const DEMO_PASSWORD = "seed-only-not-used-2026";

// ---------- main ----------

async function main() {
  console.log(`→ Seeding Vizcaya pilot against ${SUPABASE_URL}`);

  // 1. Hoa row.
  console.log("→ Ensuring hoa row…");
  const existingHoa = await rest("GET", "hoa?select=id,slug");
  if (existingHoa.length === 0) {
    await rest("POST", "hoa", {
      name: "Bellagio at Vizcaya",
      slug: "bellagio-vizcaya",
      contact_email: "board@vizcayacommunity.com",
      contact_phone: "(305) 829-5577",
      address: "4998 SW 140th Terrace, Miramar, FL 33027",
      primary_color: "#7C3F1A",
      accent_color: "#8AA67A",
      timezone: "America/New_York",
    });
    console.log("  + hoa created (Bellagio at Vizcaya)");
  } else {
    console.log("  hoa already present — skipping");
  }

  // 2. Units.
  console.log("→ Ensuring units…");
  const existingUnits = await rest("GET", "units?select=id,number");
  const haveNumbers = new Set(existingUnits.map((u) => u.number));
  const toAdd = UNITS.filter(([n]) => !haveNumbers.has(n)).map(
    ([number, address, unit_type, bedrooms]) => ({
      number,
      address,
      unit_type,
      bedrooms,
    })
  );
  if (toAdd.length) {
    await rest("POST", "units", toAdd);
    console.log(`  + ${toAdd.length} units added`);
  } else {
    console.log("  units already present — skipping");
  }
  const allUnits = await rest("GET", "units?select=id,number");
  const unitIdByNumber = Object.fromEntries(allUnits.map((u) => [u.number, u.id]));

  // 3. Auth users.
  console.log("→ Creating auth users…");
  const all = [
    { ...DEMO_BOARD, isDemo: true },
    { ...DEMO_RESIDENT, isDemo: true },
    ...FICTIONAL_RESIDENTS.map((r) => ({ ...r, password: DEMO_PASSWORD })),
  ];
  const userByEmail = {};
  for (const r of all) {
    const u = await adminCreateUser({ email: r.email, password: r.password });
    userByEmail[r.email] = u;
  }
  console.log(`  ${Object.keys(userByEmail).length} users ready`);

  // 4. Residents rows.
  console.log("→ Inserting residents rows…");
  const existingResidents = await rest("GET", "residents?select=email");
  const haveEmails = new Set(existingResidents.map((r) => r.email));
  const residentRows = all
    .filter((r) => !haveEmails.has(r.email))
    .map((r) => ({
      id: userByEmail[r.email].id,
      unit_id: unitIdByNumber[r.unit] ?? null,
      name: r.name,
      email: r.email,
      role: r.role,
      is_owner: true,
      notify_email: r.notify_email ?? true,
      notify_sms: r.notify_sms ?? false,
      share_email: r.share_email ?? true,
      share_phone: r.share_phone ?? false,
    }));
  if (residentRows.length) {
    await rest("POST", "residents", residentRows);
    console.log(`  + ${residentRows.length} residents inserted`);
  } else {
    console.log("  residents already seeded");
  }

  const allResidents = await rest("GET", "residents?select=id,name,email,role");
  const byEmail = Object.fromEntries(allResidents.map((r) => [r.email, r]));
  const carmen = byEmail["carmen.rodriguez@example.com"];
  const luis   = byEmail["luis.fernandez@example.com"];
  const ana    = byEmail["ana.martinez@example.com"];

  // 5. Announcements — Florida-flavored, hurricane prep, pool, board meetings.
  console.log("→ Inserting announcements…");
  const existingAnn = await rest("GET", "announcements?select=id&limit=1");
  if (existingAnn.length === 0) {
    const announcements = [
      {
        author_id: carmen.id,
        title: "Welcome to the new Bellagio resident portal",
        body_md:
          "We've migrated from the old AssociationVoice site to a new portal that's faster, mobile-friendly, and built specifically for our community.\n\nSign in with your email — no password to remember. Our management company at Allied Property Group continues handling accounting, dues, and work orders. The portal is for board announcements, the calendar, governing documents, and a faster way to report issues.\n\nIf you can't sign in or your unit isn't linked correctly, email board@vizcayacommunity.com and we'll get you set up.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(28),
      },
      {
        author_id: luis.id,
        title: "Hurricane season starts June 1 — preparedness reminders",
        body_md:
          "South Florida hurricane season runs June 1 through November 30. A few reminders for everyone:\n\n· Trim trees and secure loose items in your yard now, before the first named storm.\n· Check your homeowners insurance and flood policy. The HOA master policy covers common areas only.\n· Sign up for SMS alerts in Settings — the board will text any community-wide notice during a storm watch or warning.\n· Generators: refer to the noise ordinance in our governing docs (no generators between 10pm and 7am except during a declared emergency).\n\nFull hurricane prep guide is in the Documents section.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(14),
      },
      {
        author_id: carmen.id,
        title: "Pool reopening Saturday May 17 — new hours posted",
        body_md:
          "Pool inspection passed and we reopen this Saturday. Summer hours through Labor Day:\n\n· Monday – Thursday: 8am – 9pm\n· Friday – Sunday: 7am – 10pm\n\nNew this year: a guest sign-in book at the gate. Each unit gets up to 4 guests at a time. Pool keys haven't changed.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(7),
      },
      {
        author_id: luis.id,
        title: "Annual community meeting — Sunday June 8, 7pm",
        body_md:
          "Per our bylaws and Florida Chapter 720, the annual community meeting is scheduled for Sunday June 8 at 7pm in the clubhouse. Agenda:\n\n· 2026 budget review\n· Two open board seats — election by ballot\n· Vote on landscaping vendor renewal\n· Open Q&A\n\nQuorum is 30% of voting members. If you can't attend, the proxy form is in the Documents section. Please return proxies by Friday June 6.",
        pinned: false,
        send_email: true,
        send_sms: true,
        published_at: daysAgo(3),
      },
      {
        author_id: ana.id,
        title: "Reminder: gate code changes Wednesday May 14",
        body_md:
          "The pedestrian gate code rotates this Wednesday at 6am as part of our quarterly security rotation. Vehicle gate transponders are not affected.\n\nNew code will be sent only to verified residents. If you have a guest, contact code, or service vendor that needs the new code, add them in your Settings → Visitors page (coming soon — for now reply to this announcement and we'll add them manually).",
        pinned: true,
        send_email: true,
        send_sms: true,
        published_at: daysAgo(1),
      },
    ];
    const created = await rest("POST", "announcements", announcements);
    console.log(`  + ${created.length} announcements`);

    // Read receipts (older = more reads)
    const readReceipts = [];
    const readPercents = [0.85, 0.78, 0.72, 0.65, 0.42];
    created.forEach((a, idx) => {
      const pct = readPercents[idx] ?? 0.6;
      for (const r of allResidents) {
        if (Math.random() < pct) {
          const offset = Math.random() * 3 * DAY;
          readReceipts.push({
            announcement_id: a.id,
            resident_id: r.id,
            read_at: new Date(new Date(a.published_at).getTime() + offset).toISOString(),
          });
        }
      }
    });
    if (readReceipts.length) {
      for (let i = 0; i < readReceipts.length; i += 100) {
        await rest("POST", "announcement_reads", readReceipts.slice(i, i + 100));
      }
      console.log(`  + ${readReceipts.length} read receipts`);
    }
  } else {
    console.log("  announcements already seeded");
  }

  // 6. Calendar events.
  console.log("→ Inserting calendar events…");
  const existingEvents = await rest("GET", "calendar_events?select=id&limit=1");
  if (existingEvents.length === 0) {
    const events = [
      {
        created_by: carmen.id,
        title: "Pool reopening — first day",
        description:
          "Pool reopens for the season. Lifeguard on duty 10am–6pm Saturday and Sunday. Pool keys haven't changed; new guest sign-in book at the gate.",
        starts_at: daysFromNow(2, 10),
        ends_at: daysFromNow(2, 21),
        location: "Club Vizcaya pool deck",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: carmen.id,
        title: "Monthly board meeting",
        description:
          "Standing monthly board meeting. Open to residents. Agenda posted 48 hours in advance in Documents.",
        starts_at: daysFromNow(8, 19),
        ends_at: daysFromNow(8, 21),
        location: "Clubhouse meeting room",
        category: "board",
        recurrence_rule: "FREQ=MONTHLY;BYDAY=2WE",
      },
      {
        created_by: luis.id,
        title: "Annual community meeting",
        description:
          "Required annual meeting per Florida Chapter 720. Budget review, board elections (two seats), landscaping vendor vote, open Q&A. Quorum is 30% — please attend or send a proxy.",
        starts_at: daysFromNow(34, 19),
        ends_at: daysFromNow(34, 21),
        location: "Clubhouse main hall",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: carmen.id,
        title: "Hurricane prep day — community workshop",
        description:
          "Free workshop with the City of Miramar emergency management office. Bring questions about your unit, your insurance, and what the HOA covers vs what you cover. Coffee and pastries provided.",
        starts_at: daysFromNow(20, 9),
        ends_at: daysFromNow(20, 12),
        location: "Clubhouse main hall",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: ana.id,
        title: "Fourth of July pool party",
        description:
          "Annual community Fourth of July gathering. Bring a side or dessert; burgers and brats provided. Kids' splash games starting at noon.",
        starts_at: daysFromNow(60, 12),
        ends_at: daysFromNow(60, 21),
        location: "Club Vizcaya pool deck + cabana",
        category: "community",
        recurrence_rule: null,
      },
    ];
    const createdEvents = await rest("POST", "calendar_events", events);
    console.log(`  + ${createdEvents.length} events`);

    const upcoming = createdEvents.filter(
      (e) => new Date(e.starts_at).getTime() > Date.now()
    );
    const rsvps = [];
    const sample = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
    for (const e of upcoming) {
      const yesCount = e.category === "community" ? 8 : 2;
      const maybeCount = e.category === "community" ? 3 : 0;
      const noCount = 1;
      sample(allResidents, yesCount).forEach((r) =>
        rsvps.push({ event_id: e.id, resident_id: r.id, status: "yes" })
      );
      sample(allResidents, maybeCount).forEach((r) =>
        rsvps.push({ event_id: e.id, resident_id: r.id, status: "maybe" })
      );
      sample(allResidents, noCount).forEach((r) =>
        rsvps.push({ event_id: e.id, resident_id: r.id, status: "no" })
      );
    }
    const seen = new Set();
    const uniq = rsvps.filter((r) => {
      const k = `${r.event_id}:${r.resident_id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (uniq.length) {
      await rest("POST", "rsvps", uniq);
      console.log(`  + ${uniq.length} RSVPs`);
    }
  } else {
    console.log("  events already seeded");
  }

  // 7. Documents.
  console.log("→ Inserting documents…");
  const existingDocs = await rest("GET", "documents?select=id&limit=1");
  if (existingDocs.length === 0) {
    const docs = [
      { uploaded_by: carmen.id, category: "governing", title: "Declaration of Covenants, Conditions & Restrictions",  description: "Recorded with Broward County. Last amended 2019.",                              storage_path: "demo/ccrs.pdf",          file_size_bytes: 2_104_556, uploaded_at: daysAgo(180) },
      { uploaded_by: carmen.id, category: "governing", title: "Bylaws of Bellagio at Vizcaya HOA",                     description: "Operating bylaws.",                                                              storage_path: "demo/bylaws.pdf",        file_size_bytes:   428_106, uploaded_at: daysAgo(180) },
      { uploaded_by: carmen.id, category: "governing", title: "Articles of Incorporation",                             description: "Filed with the Florida Department of State.",                                    storage_path: "demo/articles.pdf",      file_size_bytes:   189_402, uploaded_at: daysAgo(365) },
      { uploaded_by: luis.id,   category: "minutes",   title: "April 2026 board meeting minutes",                      description: null,                                                                              storage_path: "demo/min-2026-04.pdf",   file_size_bytes:   124_502, uploaded_at: daysAgo(28) },
      { uploaded_by: luis.id,   category: "minutes",   title: "March 2026 board meeting minutes",                      description: null,                                                                              storage_path: "demo/min-2026-03.pdf",   file_size_bytes:   118_204, uploaded_at: daysAgo(60) },
      { uploaded_by: luis.id,   category: "minutes",   title: "February 2026 board meeting minutes",                   description: null,                                                                              storage_path: "demo/min-2026-02.pdf",   file_size_bytes:   122_984, uploaded_at: daysAgo(90) },
      { uploaded_by: carmen.id, category: "financial", title: "2026 Annual Budget",                                    description: "Approved at the December 2025 board meeting.",                                   storage_path: "demo/budget-2026.pdf",   file_size_bytes:   289_112, uploaded_at: daysAgo(140) },
      { uploaded_by: carmen.id, category: "financial", title: "Reserve Study (2025)",                                  description: "Five-year reserve forecast prepared by Florida Reserve Studies LLC.",            storage_path: "demo/reserve-study.pdf", file_size_bytes: 2_104_556, uploaded_at: daysAgo(240) },
      { uploaded_by: carmen.id, category: "insurance", title: "Property Insurance Certificate (master policy)",        description: "Master policy through Citizens, effective Jan–Dec 2026.",                       storage_path: "demo/insurance-cert.pdf",file_size_bytes:   312_980, uploaded_at: daysAgo(120) },
      { uploaded_by: luis.id,   category: "other",     title: "Hurricane Preparedness Guide for Residents",            description: "Annual guide covering tree trimming, shutters, generator rules, evac routes.",   storage_path: "demo/hurricane-prep.pdf",file_size_bytes:   612_004, uploaded_at: daysAgo(30) },
    ];
    await rest("POST", "documents", docs);
    console.log(`  + ${docs.length} documents`);
  } else {
    console.log("  documents already seeded");
  }

  // 8. Issue reports — Florida flavor.
  console.log("→ Inserting issue reports…");
  const existingIssues = await rest("GET", "issue_reports?select=id&limit=1");
  if (existingIssues.length === 0) {
    const greene = byEmail["anthony.greene@example.com"];
    const cohen  = byEmail["rachel.cohen@example.com"];
    const issues = [
      {
        resident_id: greene?.id ?? null,
        category: "maintenance",
        description:
          "The cabana ceiling fan by the pool is making a clicking sound on its slowest setting — sounds like a loose blade. Probably worth a look before someone's at the pool with their kids and it gets worse.",
        status: "open",
        resolved_at: null,
        created_at: daysAgo(2),
      },
      {
        resident_id: null,
        category: "maintenance",
        description:
          "Streetlight at the corner of SW 49th Ct and 135th Way has been out for over a week. Pretty dark walking after sunset — anyone walking dogs or kids back from the pool can't see well.",
        status: "acknowledged",
        resolved_at: null,
        created_at: daysAgo(5),
      },
      {
        resident_id: cohen?.id ?? null,
        category: "maintenance",
        description:
          "Mailbox on unit 16's pillar is leaning. Looks like a vehicle bumped it. Mail carrier left a note that he'll keep delivering but it should be straightened or replaced.",
        status: "resolved",
        resolved_at: daysAgo(3),
        created_at: daysAgo(11),
      },
    ];
    await rest("POST", "issue_reports", issues);
    console.log(`  + ${issues.length} issue reports`);
  } else {
    console.log("  issues already seeded");
  }

  console.log("\n✓ Vizcaya pilot seed complete");
  console.log(`  board:    ${DEMO_BOARD.email}    /  ${DEMO_BOARD.password}`);
  console.log(`  resident: ${DEMO_RESIDENT.email} / ${DEMO_RESIDENT.password}`);
  console.log(`  Site URL should match: ${env.NEXT_PUBLIC_COMMUNITY_DOMAIN ?? "(unset)"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
