/**
 * Single source of truth for per-community settings. Every other module
 * (email templates, layout, SMS opt-in copy) reads from here, so swapping
 * a deploy from one community to another is purely an env-var change.
 *
 * NEXT_PUBLIC_* vars are baked into the client bundle at build time, so
 * Vercel re-deploys on every change. The non-public ones are server-only.
 */

export const COMMUNITY = {
  name: process.env.NEXT_PUBLIC_COMMUNITY_NAME ?? "Community Portal",
  slug: process.env.NEXT_PUBLIC_COMMUNITY_SLUG ?? "demo",
  domain: process.env.NEXT_PUBLIC_COMMUNITY_DOMAIN ?? "localhost:47331",
  contactEmail: process.env.COMMUNITY_CONTACT_EMAIL ?? "board@example.com",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#0B1F3B",
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "#3B82F6",
  emailFrom:
    process.env.EMAIL_FROM ??
    `${process.env.NEXT_PUBLIC_COMMUNITY_NAME ?? "Community Portal"} <noreply@example.com>`,
} as const;

export type Community = typeof COMMUNITY;
