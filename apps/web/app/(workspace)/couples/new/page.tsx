import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { TeamMemberRow } from "@crystal/db/types";
import { createCouple } from "./actions";

const CONSENT_OPTIONS = [
  { value: "none", label: "None — internal use only" },
  { value: "internal", label: "Internal — team can see full photos" },
  { value: "web", label: "Web — website / social with approval" },
  { value: "press", label: "Press — media publication allowed" },
];

export default async function NewCouplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: members } = await supabase
    .from("team_member")
    .select("id, display_name, role")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("display_name");

  const planners = (members ?? []) as Pick<
    TeamMemberRow,
    "id" | "display_name" | "role"
  >[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/couples" className="text-muted hover:text-charcoal text-sm">
          ← Couples
        </Link>
        <span className="text-muted-soft">/</span>
        <span className="text-sm text-charcoal">New couple</span>
      </div>

      <h1 className="text-3xl">New couple</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "validation"
            ? "Please check the form — some fields are invalid."
            : "Could not save — please try again."}
        </div>
      )}

      <form action={createCouple} className="space-y-8">
        {/* ── Couple details ──────────────────────────────────────────── */}
        <section className="rounded-lg border border-muted-soft bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-display text-lg text-charcoal">Couple details</h2>

          <Field label="Display name *" hint="e.g. Sham &amp; Shwan — shown in all internal views">
            <input
              type="text"
              name="display_name"
              required
              placeholder="Partner 1 & Partner 2"
              className={inputCls}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Partner 1 full name">
              <input type="text" name="partner1_full_name" className={inputCls} />
            </Field>
            <Field label="Partner 2 full name">
              <input type="text" name="partner2_full_name" className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nationality 1">
              <input type="text" name="nationality_1" className={inputCls} />
            </Field>
            <Field label="Nationality 2">
              <input type="text" name="nationality_2" className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary email">
              <input type="email" name="email_primary" className={inputCls} />
            </Field>
            <Field label="Primary phone (E.164)">
              <input
                type="tel"
                name="phone_primary_e164"
                placeholder="+44..."
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Photo consent">
            <select name="photo_consent_level" className={inputCls} defaultValue="none">
              {CONSENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-start gap-2">
            <input
              id="gdpr_consent"
              type="checkbox"
              name="gdpr_consent"
              className="mt-0.5 h-4 w-4 rounded border-muted-soft text-charcoal"
            />
            <label htmlFor="gdpr_consent" className="text-sm text-muted">
              Couple has given GDPR consent for data processing
            </label>
          </div>

          <Field label="Notes">
            <textarea name="notes" rows={3} className={inputCls} />
          </Field>
        </section>

        {/* ── Project details ─────────────────────────────────────────── */}
        <section className="rounded-lg border border-muted-soft bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-display text-lg text-charcoal">Project details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Wedding date">
              <input type="date" name="wedding_date" className={inputCls} />
            </Field>
            <Field label="City">
              <input
                type="text"
                name="location_city"
                defaultValue="Barcelona"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Venue (primary)">
            <input type="text" name="venue_primary" className={inputCls} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guest count min">
              <input type="number" name="guest_count_min" min={1} className={inputCls} />
            </Field>
            <Field label="Guest count max">
              <input type="number" name="guest_count_max" min={1} className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget min (EUR)">
              <input type="number" name="budget_eur_min" min={0} step="0.01" className={inputCls} />
            </Field>
            <Field label="Budget max (EUR)">
              <input type="number" name="budget_eur_max" min={0} step="0.01" className={inputCls} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-4">
            <CheckboxField name="is_hindu_sikh" label="Hindu / Sikh wedding" />
            <CheckboxField name="is_jewish" label="Jewish wedding" />
            <CheckboxField name="is_civil" label="Civil ceremony" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lead planner">
              <select name="lead_planner_id" className={inputCls}>
                <option value="">— auto (me) —</option>
                {planners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Secondary planner">
              <select name="secondary_planner_id" className={inputCls}>
                <option value="">— none —</option>
                {planners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Project notes">
            <textarea name="project_notes" rows={3} className={inputCls} />
          </Field>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-charcoal px-6 py-2 text-sm font-medium text-cream hover:bg-charcoal/90"
          >
            Create couple
          </button>
          <Link
            href="/couples"
            className="rounded-lg border border-muted-soft px-6 py-2 text-sm font-medium text-charcoal hover:bg-cream"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-muted-soft px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-charcoal">{label}</label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}

function CheckboxField({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={name}
        type="checkbox"
        name={name}
        className="h-4 w-4 rounded border-muted-soft text-charcoal"
      />
      <label htmlFor={name} className="text-sm text-charcoal">
        {label}
      </label>
    </div>
  );
}
