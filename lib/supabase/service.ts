import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row-Level Security — use only
 * in server-side code paths that have already authenticated their caller
 * (e.g. branded magic-link generation, anonymous issue-report inserts,
 * outbound message audit log).
 *
 * Never import from a client component or expose on a public route.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
