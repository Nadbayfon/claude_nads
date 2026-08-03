"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Route } from "next";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";

async function originUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function signInWithGoogle() {
  const supabase = await getServerSupabase();
  const origin = await originUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Could not start Google sign-in")}`);
  }
  // External Supabase OAuth URL — typedRoutes only knows internal routes.
  redirect(data.url as Route);
}

export async function sendMagicLink(formData: FormData) {
  const parsed = z.object({ email: z.string().email() }).safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent("Enter a valid email")}`);
  }
  const supabase = await getServerSupabase();
  const origin = await originUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?sent=1");
}
