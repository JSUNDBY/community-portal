#!/usr/bin/env node
/**
 * Seed Sandstone Ridge with believable demo data so prospects can click
 * through and see what their community would look like with content in
 * every section.
 *
 * Reads SUPABASE_URL + SERVICE_ROLE_KEY from .env.local.
 *
 * Run: `npm run seed:demo`
 *
 * Idempotent: safe to re-run. It checks for an existing demo board
 * account and skips re-creating data if found. To force a clean reseed,
 * delete the auth users with @example.com emails and the rows in the
 * announcements / calendar_events / documents / issue_reports tables,
 * then run again.
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

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ---------- HTTP helpers ----------

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
    // Already exists is a 422 — pull the existing user instead.
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

// ---------- relative-time helpers ----------

const DAY = 24 * 60 * 60 * 1000;
function daysAgo(n) {
  return new Date(Date.now() - n * DAY).toISOString();
}
function daysFromNow(n, atHour = 19) {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(atHour, 0, 0, 0);
  return d.toISOString();
}

// ---------- seed data ----------

const FICTIONAL_RESIDENTS = [
  { email: "sarah.anderson@example.com",  name: "Sarah Anderson",  role: "board",    unit: "7",  share_email: true,  share_phone: true,  is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "mike.lindgren@example.com",   name: "Mike Lindgren",   role: "resident", unit: "4",  share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "jennifer.carlson@example.com",name: "Jennifer Carlson",role: "resident", unit: "5",  share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "tom.olson@example.com",       name: "Tom Olson",       role: "resident", unit: "6",  share_email: false, share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "amy.peterson@example.com",    name: "Amy Peterson",    role: "resident", unit: "8",  share_email: true,  share_phone: true,  is_owner: true,  notify_email: true,  notify_sms: true  },
  { email: "brian.johnson@example.com",   name: "Brian Johnson",   role: "resident", unit: "9",  share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "lisa.larson@example.com",     name: "Lisa Larson",     role: "resident", unit: "10", share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "mark.erickson@example.com",   name: "Mark Erickson",   role: "resident", unit: "11", share_email: false, share_phone: false, is_owner: true,  notify_email: false, notify_sms: false },
  { email: "rachel.nelson@example.com",   name: "Rachel Nelson",   role: "resident", unit: "12", share_email: true,  share_phone: true,  is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "steve.thompson@example.com",  name: "Steve Thompson",  role: "resident", unit: "13", share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "megan.hovde@example.com",     name: "Megan Hovde",     role: "resident", unit: "14", share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "dave.klein@example.com",      name: "Dave Klein",      role: "resident", unit: "15", share_email: true,  share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "nicole.brekke@example.com",   name: "Nicole Brekke",   role: "resident", unit: "16", share_email: true,  share_phone: false, is_owner: false, notify_email: true,  notify_sms: false },
  { email: "pat.flaherty@example.com",    name: "Pat Flaherty",    role: "resident", unit: "17", share_email: false, share_phone: false, is_owner: true,  notify_email: true,  notify_sms: false },
  { email: "andy.berg@example.com",       name: "Andy Berg",       role: "resident", unit: "18", share_email: true,  share_phone: false, is_owner: true,  notify_email: false, notify_sms: false },
  { email: "emily.rasmussen@example.com", name: "Emily Rasmussen", role: "resident", unit: "19", share_email: true,  share_phone: false, is_owner: false, notify_email: true,  notify_sms: false },
];

const DEMO_RESIDENT = {
  email: "demo-resident@example.com",
  password: "demo-resident-2026",
  name: "Demo Resident",
  role: "resident",
  unit: "3",
};

const DEMO_BOARD = {
  email: "demo-board@example.com",
  password: "demo-board-2026",
  name: "Demo Board Member",
  role: "board",
  unit: "2",
};

const DEMO_PASSWORD = "seed-only-not-used-2026";

// ---------- main ----------

async function main() {
  // 1. Make sure units 6-20 exist.
  console.log("→ Ensuring 20 units exist…");
  const existingUnits = await rest("GET", "units?select=id,number");
  const haveNumbers = new Set(existingUnits.map((u) => u.number));
  const toAdd = [];
  for (let n = 6; n <= 20; n++) {
    if (!haveNumbers.has(String(n))) {
      toAdd.push({
        number: String(n),
        address: `${100 + n} Sandstone Way`,
        unit_type: "townhouse",
        bedrooms: n % 2 === 0 ? 2 : 3,
      });
    }
  }
  if (toAdd.length) {
    await rest("POST", "units", toAdd);
    console.log(`  + added units ${toAdd.map((u) => u.number).join(", ")}`);
  } else {
    console.log("  units already complete");
  }
  const allUnits = await rest("GET", "units?select=id,number");
  const unitIdByNumber = Object.fromEntries(allUnits.map((u) => [u.number, u.id]));

  // 2. Create demo + fictional auth users.
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

  // 3. Insert residents (idempotent: skip if exists).
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
      is_owner: r.is_owner ?? true,
      notify_email: r.notify_email ?? true,
      notify_sms: r.notify_sms ?? false,
      share_email: r.share_email ?? true,
      share_phone: r.share_phone ?? false,
    }));
  if (residentRows.length) {
    await rest("POST", "residents", residentRows);
    console.log(`  + ${residentRows.length} new residents`);
  } else {
    console.log("  residents already seeded");
  }

  // 4. Look up authoring residents for content.
  const allResidents = await rest("GET", "residents?select=id,name,email,role");
  const residentByEmail = Object.fromEntries(allResidents.map((r) => [r.email, r]));
  const board = allResidents.filter((r) => r.role === "board");
  const josh = residentByEmail["j.sundby@gmail.com"] ?? board[0];
  const sarah = residentByEmail["sarah.anderson@example.com"];
  const mike = residentByEmail["mike.lindgren@example.com"];
  const rachel = residentByEmail["rachel.nelson@example.com"];

  // 5. Announcements (skip if any exist — assume already seeded).
  console.log("→ Inserting announcements…");
  const existingAnn = await rest("GET", "announcements?select=id&limit=1");
  if (existingAnn.length === 0) {
    const announcements = [
      {
        author_id: josh.id,
        title: "Welcome to your new resident portal",
        body_md:
          "We just rolled out a single place for board announcements, the community calendar, governing documents, and the directory.\n\nYou can update your contact preferences in Settings, including whether you want SMS alerts for time-sensitive things. If you have feedback on the portal itself, send it through Report an issue.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(36),
      },
      {
        author_id: sarah.id,
        title: "Spring landscaping starts Monday",
        body_md:
          "Crews from Greenway Lawn Care will be on site Monday through Wednesday next week. Expect mowing, edging, and mulch refresh on the front beds. Please keep pets indoors during the working hours (8am–4pm) and move any vehicles off the street so they can reach the curbs.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(22),
      },
      {
        author_id: josh.id,
        title: "Annual community meeting — Sunday May 18, 7pm",
        body_md:
          "Mark your calendar for the annual community meeting at the clubhouse. We'll cover the 2026 budget, the board election (two seats open), and a vote on the proposed solar bylaw amendment.\n\nIf you can't attend in person, a recording will be posted to the documents section within 48 hours.",
        pinned: false,
        send_email: true,
        send_sms: true,
        published_at: daysAgo(13),
      },
      {
        author_id: sarah.id,
        title: "Pool reopens May 22",
        body_md:
          "The pool passes inspection and opens Friday May 22 at 10am. Hours through Memorial Day are 10am–9pm daily; full summer hours start Memorial Day weekend.\n\nIf you haven't picked up your 2026 pool key, swing by unit 7 between 5–7pm any weekday and Sarah will get you set up.",
        pinned: false,
        send_email: true,
        send_sms: false,
        published_at: daysAgo(7),
      },
      {
        author_id: josh.id,
        title: "Driveway sealing this Tuesday — please park on the street",
        body_md:
          "AsphaltCraft will be sealing the main loop and the visitor lot on Tuesday May 7 starting at 7am. The work should wrap by 4pm, weather permitting.\n\nPlease park on Sandstone Way overnight Monday so the crew can start on time. The asphalt needs 24 hours to cure, so plan to leave cars on the street through Wednesday morning.",
        pinned: true,
        send_email: true,
        send_sms: true,
        published_at: daysAgo(1),
      },
    ];
    const created = await rest("POST", "announcements", announcements);
    console.log(`  + ${created.length} announcements`);

    // Read receipts: simulate that residents have opened the older posts.
    const readReceipts = [];
    const everyone = allResidents;
    const readPercents = [0.85, 0.78, 0.72, 0.65, 0.42]; // newest reads less
    created.forEach((a, idx) => {
      const pct = readPercents[idx] ?? 0.6;
      for (const r of everyone) {
        if (Math.random() < pct) {
          const offset = Math.random() * 3 * DAY;
          const readAt = new Date(
            new Date(a.published_at).getTime() + offset
          ).toISOString();
          readReceipts.push({
            announcement_id: a.id,
            resident_id: r.id,
            read_at: readAt,
          });
        }
      }
    });
    if (readReceipts.length) {
      // Chunk in 100s — Supabase REST accepts up to a few MB but be safe.
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
        created_by: josh.id,
        title: "Spring cleanup day",
        description:
          "Volunteer day to clean common areas, plant the entry beds, and freshen up the playground. Coffee + donuts on Sarah. Family-friendly.",
        starts_at: daysAgo(2).replace(/T.*/, "T14:00:00.000Z"),
        ends_at: daysAgo(2).replace(/T.*/, "T18:00:00.000Z"),
        location: "Front entrance + clubhouse",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: josh.id,
        title: "Board meeting — May 9",
        description:
          "Standing monthly board meeting. Open to residents. Agenda posted 48 hours in advance in Documents.",
        starts_at: daysFromNow(5, 19),
        ends_at: daysFromNow(5, 21),
        location: "Clubhouse meeting room",
        category: "board",
        recurrence_rule: "FREQ=MONTHLY;BYDAY=2TH",
      },
      {
        created_by: sarah.id,
        title: "Annual community meeting",
        description:
          "All residents welcome. Budget review, board election, and a vote on the solar bylaw amendment.",
        starts_at: daysFromNow(12, 19),
        ends_at: daysFromNow(12, 21),
        location: "Clubhouse main hall",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: sarah.id,
        title: "Memorial Day cookout",
        description:
          "Bring a side or a dessert. Burgers, brats, and the kid's bike parade all afternoon. Rain plan: under the pavilion.",
        starts_at: daysFromNow(20, 16),
        ends_at: daysFromNow(20, 21),
        location: "Pool area",
        category: "community",
        recurrence_rule: null,
      },
      {
        created_by: josh.id,
        title: "Quarterly board meeting",
        description: "Quarterly review with the property manager.",
        starts_at: daysFromNow(45, 19),
        ends_at: daysFromNow(45, 21),
        location: "Clubhouse meeting room",
        category: "board",
        recurrence_rule: null,
      },
      {
        created_by: sarah.id,
        title: "Community garage sale",
        description:
          "Annual neighborhood garage sale. We post a single ad and signage; you set up at your driveway.",
        starts_at: daysFromNow(90, 9),
        ends_at: daysFromNow(90, 15),
        location: "Throughout the community",
        category: "community",
        recurrence_rule: null,
      },
    ];
    const createdEvents = await rest("POST", "calendar_events", events);
    console.log(`  + ${createdEvents.length} events`);

    // RSVPs on upcoming events
    const upcoming = createdEvents.filter(
      (e) => new Date(e.starts_at).getTime() > Date.now()
    );
    const rsvps = [];
    const sample = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
    for (const e of upcoming) {
      const yesCount = e.category === "community" ? 8 : 3;
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
    // Dedupe within (event_id, resident_id)
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

  // 7. Documents (metadata only — no actual files in storage; downloads
  // will 404, which is acceptable for a demo).
  console.log("→ Inserting documents…");
  const existingDocs = await rest("GET", "documents?select=id&limit=1");
  if (existingDocs.length === 0) {
    const docs = [
      { uploaded_by: josh.id,  category: "governing", title: "CC&Rs (Declaration of Covenants)", description: "Recorded with Hennepin County. Last amended 2018.", storage_path: "demo/ccrs.pdf",        file_size_bytes: 1_847_232, uploaded_at: daysAgo(180) },
      { uploaded_by: josh.id,  category: "governing", title: "Bylaws",                          description: "Operating bylaws of the Sandstone Ridge HOA.",       storage_path: "demo/bylaws.pdf",       file_size_bytes:   428_106, uploaded_at: daysAgo(180) },
      { uploaded_by: sarah.id, category: "minutes",   title: "April 2026 board meeting minutes", description: null,                                                  storage_path: "demo/min-2026-04.pdf",  file_size_bytes:   124_502, uploaded_at: daysAgo(28)  },
      { uploaded_by: sarah.id, category: "minutes",   title: "March 2026 board meeting minutes", description: null,                                                  storage_path: "demo/min-2026-03.pdf",  file_size_bytes:   118_204, uploaded_at: daysAgo(60)  },
      { uploaded_by: sarah.id, category: "minutes",   title: "February 2026 board meeting minutes", description: null,                                               storage_path: "demo/min-2026-02.pdf",  file_size_bytes:   122_984, uploaded_at: daysAgo(90)  },
      { uploaded_by: josh.id,  category: "financial", title: "2026 Annual Budget",               description: "Approved at the December 2025 board meeting.",        storage_path: "demo/budget-2026.pdf",   file_size_bytes:   289_112, uploaded_at: daysAgo(120) },
      { uploaded_by: josh.id,  category: "financial", title: "Reserve Study",                    description: "Five-year reserve forecast prepared by ReserveData LLC.", storage_path: "demo/reserve-study.pdf", file_size_bytes: 2_104_556, uploaded_at: daysAgo(240) },
      { uploaded_by: josh.id,  category: "insurance", title: "Property Insurance Certificate",   description: "Master policy through Travelers, effective Jan–Dec 2026.", storage_path: "demo/insurance-cert.pdf", file_size_bytes:   312_980, uploaded_at: daysAgo(120) },
    ];
    await rest("POST", "documents", docs);
    console.log(`  + ${docs.length} documents`);
  } else {
    console.log("  documents already seeded");
  }

  // 8. Issue reports.
  console.log("→ Inserting issue reports…");
  const existingIssues = await rest("GET", "issue_reports?select=id&limit=1");
  if (existingIssues.length === 0) {
    // PostgREST bulk insert requires every object to have identical keys —
    // pad each row with null fields where needed.
    const issues = [
      {
        resident_id: mike?.id ?? null,
        category: "maintenance",
        description:
          "There's a broken sprinkler head spraying sideways near the entrance to unit 7. It's been like this since the system kicked on Monday — soaking the sidewalk every cycle.",
        status: "open",
        resolved_at: null,
        created_at: daysAgo(3),
      },
      {
        resident_id: null, // anonymous
        category: "maintenance",
        description:
          "The streetlight at the corner of Sandstone Way and the visitor parking entrance has been out for at least a week. Pretty dark walking the dog after sunset.",
        status: "acknowledged",
        resolved_at: null,
        created_at: daysAgo(5),
      },
      {
        resident_id: rachel?.id ?? null,
        category: "maintenance",
        description:
          "Mailbox at unit 12 was knocked off its post — looks like it got hit by something. The mail carrier is leaving everything at the leasing office for now.",
        status: "resolved",
        resolved_at: daysAgo(2),
        created_at: daysAgo(14),
      },
    ];
    await rest("POST", "issue_reports", issues);
    console.log(`  + ${issues.length} issue reports`);
  } else {
    console.log("  issues already seeded");
  }

  // 9. A few outbound message log entries so the audit doesn't look empty.
  console.log("→ Inserting outbound messages…");
  const existingOutbound = await rest("GET", "outbound_messages?select=id&limit=1");
  if (existingOutbound.length === 0) {
    const samples = [
      ...allResidents.slice(0, 8).map((r) => ({
        channel: "email",
        recipient: r.email,
        subject: "[Sandstone Ridge HOA] Driveway sealing this Tuesday",
        body: "<branded HTML body>",
        related_to: "announcement:demo",
        provider: "resend",
        status: "skipped",
        error: "RESEND_API_KEY not configured",
        sent_at: null,
        created_at: daysAgo(1),
      })),
      ...allResidents.slice(0, 5).map((r) => ({
        channel: "email",
        recipient: r.email,
        subject: "[Sandstone Ridge HOA] Pool reopens May 22",
        body: "<branded HTML body>",
        related_to: "announcement:demo",
        provider: "resend",
        status: "sent",
        error: null,
        sent_at: daysAgo(7),
        created_at: daysAgo(7),
      })),
    ];
    await rest("POST", "outbound_messages", samples);
    console.log(`  + ${samples.length} outbound entries`);
  } else {
    console.log("  outbound messages already seeded");
  }

  console.log("\n✓ demo seed complete");
  console.log(`  board:    ${DEMO_BOARD.email}    /  ${DEMO_BOARD.password}`);
  console.log(`  resident: ${DEMO_RESIDENT.email} / ${DEMO_RESIDENT.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
