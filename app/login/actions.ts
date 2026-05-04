"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendBrandedMagicLink } from "@/lib/auth/send-magic-link";

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
