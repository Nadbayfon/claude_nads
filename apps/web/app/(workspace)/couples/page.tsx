import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { CoupleRow, WeddingProjectRow } from "@crystal/db/types";

type CoupleWithProject = CoupleRow & {
  lead_planner: { display_name: string } | null;
  wedding_project: Array<Pick<WeddingProjectRow, "wedding_date" | "status" | "guest_count_max" | "is_hindu_sikh" | "is_jewish">>;
};

const STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOURS: Record<string, string> = {
  enquiry: "bg-cream text-charcoal",
  confirmed: "bg-gold/20 text-gold-dark",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default async function CouplesPage() {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("couple")
    .select(
      "*, lead_planner:lead_planner_id(display_name), wedding_project(wedding_date, status, guest_count_max, is_hindu_sikh, is_jewish)"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const couples = (data ?? []) as CoupleWithProject[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Couples</h1>
          {error && (
            <p className="mt-1 text-sm text-red-600">
              Could not load couples — database not yet connected.
            </p>
          )}
        </div>
        <Link
          href="/couples/new"
          className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90"
        >
          New couple
        </Link>
      </div>

      {couples.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-soft bg-white p-12 text-center">
          <p className="text-muted">No couples yet.</p>
          <Link
            href="/couples/new"
            className="mt-3 inline-block text-sm text-gold-dark hover:underline"
          >
            Add the first couple →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-muted-soft bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted-soft bg-cream/40">
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Couple
                </th>
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Wedding date
                </th>
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Guests
                </th>
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Lead planner
                </th>
                <th className="px-4 py-3 text-left font-medium text-charcoal">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-soft">
              {couples.map((couple) => {
                const project = couple.wedding_project?.[0];
                const status = project?.status ?? "enquiry";
                return (
                  <tr
                    key={couple.id}
                    className="hover:bg-cream/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/couples/${couple.public_id}`}
                        className="font-display text-charcoal hover:text-gold-dark"
                      >
                        {couple.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project?.wedding_date
                        ? new Date(project.wedding_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" }
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[status] ?? "bg-cream text-charcoal"}`}
                      >
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project?.guest_count_max ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {couple.lead_planner?.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {project?.is_hindu_sikh && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                            Hindu/Sikh
                          </span>
                        )}
                        {project?.is_jewish && (
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
                            Jewish
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
