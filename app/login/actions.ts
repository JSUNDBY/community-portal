"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendBrandedMagicLink } from "@/lib/auth/send-magic-link";

const DEMO_CREDS = {
  board:    { email: "demo-board@example.com",    password: "demo-board-2026" },
  resident: { email: "demo-resident@example.com", password: "demo-resident-2026" },
} as const;

/** One-click demo sign-in for prospects. The two demo accounts live in
 *  Supabase Auth (created by scripts/seed-demo.mjs) with known passwords.
 *  We sign them in via signInWithPassword and drop them straight on the
 *  resident home — no email round-trip, no magic-link friction. */
export async function signInAsDemo(formData: FormData) {
  const role = String(formData.get("role"));
  const creds = role === "board" ? DEMO_CREDS.board : DEMO_CREDS.resident;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(creds);

  if (error) {
    redirect("/login?error=" + encodeURIComponent(`Demo unavailable: ${error.message}`));
  }
  redirect("/");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/").trim() || "/";

  if (!email || !email.includes("@")) {
    redirect("/login?error=" + encodeURIComponent("Please enter a valid email."));
  }

  const origin = (await headers()).get("origin") ?? "";
  const callback = new URL("/auth/callback", origin);
  if (next && next !== "/") callback.searchParams.set("next", next);

  const result = await sendBrandedMagicLink({
    email,
    redirectTo: callback.toString(),
  });

  if (!result.ok) {
    redirect("/login?error=" + encodeURIComponent(result.error));
  }

  redirect("/login/check-email?email=" + encodeURIComponent(email));
}
