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
directory except for webhook receivers.

**Why:** Same as the LibertyOne quorum repo. Server actions are
type-safe end-to-end, avoid double-defining request/response shapes,
and play well with progressive-enhancement forms.

**How to apply:** New form-driven mutations get a `"use server"`
function colocated with the page (`actions.ts`). Webhook receivers
remain route handlers under `app/api/webhooks/`.

---

## ADR-003: `cache()` for impure reads in Server Components

**Date:** 2026-05-04

**Decision:** Wherever a Server Component needs `Date.now()` or
similar request-scoped impure data, wrap the call in React's `cache()`
helper.

**Why:** React 19 + Next 16 enforce a `react-hooks/purity` lint rule
that fails the build on direct `Date.now()` calls inside component
bodies. `cache()` is the React-blessed escape hatch — it dedupes per
request, so the value stays consistent within a render and the lint
rule accepts it.

**How to apply:**
```typescript
import { cache } from "react";
const getNowMs = cache(() => Date.now());
```
Use only in Server Components. Server actions are already explicitly
impure and the lint rule doesn't fire there.

---

## ADR-004: Webhook receivers verify signatures before doing work

**Date:** 2026-05-04

**Decision:** `app/api/webhooks/twilio/sms/route.ts` rejects any POST
without a valid `X-Twilio-Signature` (HMAC-SHA1 with `TWILIO_AUTH_TOKEN`).
The handler short-circuits before reading the body or touching the
database. The same pattern applies to any future webhook source.

**Why:** Without signature verification, anyone could POST a spoofed
STOP message and force-unsubscribe other residents — TCPA-defensible
on our side, but the resident still loses notifications. The signing
secret is already in env vars; verifying is one HMAC call.

**How to apply:** Per-provider verification helpers live in `lib/{provider}.ts`
(see `lib/twilio.ts`'s `verifyTwilioSignature`). Webhook routes
themselves are kept tiny — verify, dispatch, log.

---

## ADR-005: Anonymous endpoints get layered anti-spam, not CAPTCHAs

**Date:** 2026-05-04

**Decision:** `/report` (the only anonymous-writeable route) uses three
cheap layers — honeypot field, minimum form age (>2s), minimum
description length — instead of integrating Recaptcha or Turnstile.
Submissions that trip the honeypot or form-age check redirect to the
success page silently so bots can't reverse-engineer the rules.

**Why:** Recaptcha/Turnstile add a third-party dependency, a billing
relationship, and visible UX friction for residents who already trust
the portal. The threat model here is drive-by spam, not motivated
abuse — three cheap heuristics catch >99% of bots while leaving the
form a single click for humans. If spam slips through, we revisit.

**How to apply:** Any new anonymous endpoint adds the same triplet.
Don't surface validation failures to suspected bots — silent success
beats an arms race.
