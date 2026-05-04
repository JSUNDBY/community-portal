# Sandstone Ridge Portal — Claude operating notes

## What this is

A freelance-built community portal for the Sandstone Ridge HOA. One repo,
one Supabase project, one Vercel deploy, one custom domain. Not multi-tenant.

## Read these first

- [docs/PORTAL_SCAFFOLD_SPEC.md](docs/PORTAL_SCAFFOLD_SPEC.md) — the
  authoritative spec. Locked stack and feature scope.
- [docs/decisions.md](docs/decisions.md) — architectural decisions made
  outside of the original spec.

## Architecture cheat sheet

- **Auth:** Supabase magic-link via `lib/auth/send-magic-link.ts` +
  branded Resend email + `app/auth/callback/route.ts` (verifyOtp).
- **Auth gate:** `proxy.ts` → `lib/supabase/session.ts`. Public paths:
  `/`, `/login*`, `/auth/*`, `/report`. Everything else requires auth.
- **Roles:** `residents.role` is `'resident'` or `'board'`. The
  `is_board()` SQL helper drives RLS.
- **Outbound messaging:** all emails go through `lib/email.ts`, all SMS
  through `lib/sms.ts`. Both log to `outbound_messages` first, then
  call provider. SMS refuses to send without an active row in
  `sms_consents` (TCPA gate). Use `lib/notify.ts` for fan-out.
- **Per-community theming:** `lib/config.ts` reads `NEXT_PUBLIC_*` env
  vars. Brand colors land in CSS vars on `:root` via `app/layout.tsx`.
- **Server actions everywhere.** No `app/api/` directory unless adding
  a webhook receiver (see ADR-002).

## Conventions

- Next.js 16 — `proxy.ts` (not `middleware.ts`); `params` and
  `searchParams` are `Promise<...>` and must be `await`ed.
- TypeScript strict everywhere; no `any` unless escape-hatched.
- Tailwind 4 with CSS-var arbitrary values: `text-(--primary)`,
  `bg-(--accent)`, etc. Brand vars are the single source of truth.
- File naming: kebab-case for routes, PascalCase for React components,
  camelCase for utilities.

## Things to refuse without explicit user approval

(Per spec section 2 — these blow up the freelance margin.)

- AI features
- Stripe / payments / dues collection
- Native mobile apps (PWA is enough)
- Multi-tenancy
- Third-party analytics SaaS
