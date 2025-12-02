"use server";

import { upsertUserBasic } from "@Faworra/supabase/mutations";
import { createServerClient } from "@Faworra/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CookiePreferredSignInProvider } from "@/lib/cookies";

export async function verifyOtpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const token = String(formData.get("token") || "").trim();
  const redirectTo = String(formData.get("redirect_to") || "/");

  if (!(email && token)) {
    redirect("/login?error=otp_missing_params");
  }

  const supabase = await createServerClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (verifyError) {
    redirect(`/login?error=otp_failed&reason=${encodeURIComponent(verifyError.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=no_user_after_otp");
  }

  const SECONDS_PER_MINUTE = 60;
  const MINUTES_PER_HOUR = 60;
  const HOURS_PER_DAY = 24;
  const DAYS_PER_YEAR = 365;
  const YEAR_IN_SECONDS = SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;
  (await cookies()).set(CookiePreferredSignInProvider, "otp", { maxAge: YEAR_IN_SECONDS });

  // Ensure a row exists in public.users (first-login bootstrap)
  const admin = await createServerClient({ admin: true });
  const { error: upsertError } = await upsertUserBasic(admin, { id: user.id, email: user.email });
  if (upsertError) {
    redirect(`/login?error=user_creation_failed&reason=${encodeURIComponent(upsertError.message)}`);
  }

  // Trust only same-origin paths
  let target = "/";
  try {
    const url = new URL(redirectTo, "http://localhost");
    target = `${url.pathname}${url.search}` || "/";
  } catch {
    target = redirectTo.startsWith("/") ? redirectTo : "/";
  }

  redirect(target);
}
