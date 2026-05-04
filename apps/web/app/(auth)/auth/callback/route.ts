import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const message =
      error.message?.includes("not on the planner allow-list")
        ? "This email isn't on the planner allow-list. Ask Jennifer to add you."
        : error.message;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, url.origin),
    );
  }
  return NextResponse.redirect(new URL("/", url.origin));
}
