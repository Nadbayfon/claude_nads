import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("team_member")
    .select("display_name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ display_name: string; role: string }>();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-muted-soft bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-charcoal">
            Crystal Events
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            {member ? (
              <span>
                {member.display_name}
                <span className="text-gold-dark">{" · "}{member.role}</span>
              </span>
            ) : (
              <span>{user.email}</span>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-charcoal hover:text-gold-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
