# Architecture Decision Records

Append a new ADR every time a non-spec architectural call is made. Keep
them short — what was decided, what we considered, what triggered it.

---

## ADR-001: Single `app/page.tsx` branches on auth instead of `(public)/page.tsx` parallel route

**Date:** 2026-05-04

**Decision:** The root URL `/` resolves to a single `app/page.tsx` that
renders either the public sign-in landing or the resident dashboard
depending on whether the request has an authenticated user.

**Why:** The original spec (section 4) listed both `app/page.tsx` and
`app/(public)/page.tsx`. Next 16 raises a parallel-route conflict if
both files resolve to the same URL — they can't coexist. Branching
inside one component is simpler than introducing an artificial public
prefix like `/welcome` and a redirect, and it keeps the URL tidy.

**How to apply:** Other route groups (e.g. `(public)`) can still be used
for shared layouts, but never put two `page.tsx` files at paths that
collapse to the same URL.

---

## ADR-002: Server actions over `app/api/` route handlers for mutations

**Date:** 2026-05-04

**Decision:** All mutations (sign-in, issue submission, SMS consent,
announcement publish) are Next.js server actions. No `app/api/`
directory.

**Why:** Same as the LibertyOne quorum repo. Server actions are
type-safe end-to-end, avoid double-defining request/response shapes,
and play well with progressive-enhancement forms. Webhooks (when added,
e.g. for Twilio STOP handling) will live under `app/api/webhooks/`.

**How to apply:** New form-driven mutations get a `"use server"`
function colocated with the page (`actions.ts`). Webhook receivers
remain route handlers.
