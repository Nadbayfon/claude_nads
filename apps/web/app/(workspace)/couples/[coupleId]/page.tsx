import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CoupleRow, WeddingProjectRow, EventRow } from "@crystal/db/types";
import {
  EVENT_KIND_LABELS,
  PHASE_KINDS,
  PHASE_LABELS,
  type EventPhase,
  type EventKind,
} from "@crystal/db/zod";
import { addEvent } from "./actions";

type EventWithProject = EventRow;

type ProjectWithEvents = WeddingProjectRow & {
  lead_planner: { display_name: string } | null;
  secondary_planner: { display_name: string } | null;
  event: EventWithProject[];
};

type CoupleDetail = CoupleRow & {
  lead_planner: { display_name: string } | null;
  wedding_project: ProjectWithEvents[];
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

const CONSENT_LABELS: Record<string, string> = {
  none: "None",
  internal: "Internal",
  web: "Web / Social",
  press: "Press",
};

export default async function CoupleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ coupleId: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { coupleId } = await params;
  const { phase: phaseParam } = await searchParams;
  const activePhase: EventPhase =
    phaseParam === "wedding_day" || phaseParam === "post"
      ? phaseParam
      : "pre";

  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("couple")
    .select(
      `
      *,
      lead_planner:lead_planner_id(display_name),
      wedding_project(
        *,
        lead_planner:lead_planner_id(display_name),
        secondary_planner:secondary_planner_id(display_name),
        event(*)
      )
    `
    )
    .eq("public_id", coupleId)
    .is("deleted_at", null)
    .single();

  if (error || !data) notFound();

  const couple = data as unknown as CoupleDetail;
  const project = couple.wedding_project?.[0] ?? null;
  const events = (project?.event ?? []) as EventRow[];

  const phaseEvents = events
    .filter((e) => e.phase === activePhase)
    .sort((a, b) => a.sort_order - b.sort_order);

  const inputCls =
    "w-full rounded-lg border border-muted-soft px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/couples" className="hover:text-charcoal">
          Couples
        </Link>
        <span>/</span>
        <span className="text-charcoal">{couple.display_name}</span>
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-muted-soft bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl">{couple.display_name}</h1>
            {project && (
              <p className="mt-1 text-sm text-muted">{project.name}</p>
            )}
          </div>
          {project && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLOURS[project.status] ?? "bg-cream text-charcoal"}`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          {project?.wedding_date && (
            <Stat
              label="Wedding date"
              value={new Date(project.wedding_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          )}
          {project?.guest_count_max && (
            <Stat
              label="Guests"
              value={
                project.guest_count_min
                  ? `${project.guest_count_min}–${project.guest_count_max}`
                  : `up to ${project.guest_count_max}`
              }
            />
          )}
          {project?.venue_primary && (
            <Stat label="Venue" value={project.venue_primary} />
          )}
          {project?.location_city && (
            <Stat label="City" value={project.location_city} />
          )}
          {project?.lead_planner && (
            <Stat label="Lead planner" value={project.lead_planner.display_name} />
          )}
          {project?.secondary_planner && (
            <Stat
              label="Secondary planner"
              value={project.secondary_planner.display_name}
            />
          )}
          <Stat
            label="Photo consent"
            value={CONSENT_LABELS[couple.photo_consent_level] ?? couple.photo_consent_level}
          />
          {couple.nationality_1 && (
            <Stat
              label="Nationalities"
              value={[couple.nationality_1, couple.nationality_2]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
        </div>

        {(project?.is_hindu_sikh || project?.is_jewish) && (
          <div className="mt-3 flex gap-2">
            {project.is_hindu_sikh && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Hindu / Sikh
              </span>
            )}
            {project.is_jewish && (
              <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                Jewish
              </span>
            )}
            {project.is_civil && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Civil ceremony
              </span>
            )}
          </div>
        )}

        {couple.notes && (
          <p className="mt-4 text-sm text-muted border-t border-muted-soft pt-4">
            {couple.notes}
          </p>
        )}
      </div>

      {/* ── Phase tabs ───────────────────────────────────────────────── */}
      {project ? (
        <div className="space-y-4">
          <nav className="flex border-b border-muted-soft">
            {(["pre", "wedding_day", "post"] as EventPhase[]).map((phase) => {
              const count = events.filter((e) => e.phase === phase).length;
              const isActive = phase === activePhase;
              return (
                <Link
                  key={phase}
                  href={`/couples/${coupleId}?phase=${phase}`}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-gold text-charcoal"
                      : "border-transparent text-muted hover:text-charcoal"
                  }`}
                >
                  {PHASE_LABELS[phase]}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-cream px-1.5 py-0.5 text-xs text-muted">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Events list ──────────────────────────────────────────── */}
          <div className="space-y-3">
            {phaseEvents.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                No {PHASE_LABELS[activePhase].toLowerCase()} events yet.
              </p>
            ) : (
              phaseEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border border-muted-soft bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-charcoal">{ev.name}</span>
                      <span className="ml-2 rounded bg-cream px-1.5 py-0.5 text-xs text-muted">
                        {EVENT_KIND_LABELS[ev.kind as EventKind] ?? ev.kind}
                      </span>
                    </div>
                    {ev.event_date && (
                      <span className="text-sm text-muted">
                        {new Date(ev.event_date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
                        {ev.end_time && `–${ev.end_time.slice(0, 5)}`}
                      </span>
                    )}
                  </div>
                  {ev.venue && (
                    <p className="mt-1 text-sm text-muted">{ev.venue}</p>
                  )}
                  {ev.guest_count && (
                    <p className="mt-0.5 text-xs text-muted">
                      {ev.guest_count} guests
                    </p>
                  )}
                  {ev.notes && (
                    <p className="mt-2 text-sm text-muted border-t border-muted-soft pt-2">
                      {ev.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Add event form ───────────────────────────────────────── */}
          <details className="rounded-lg border border-dashed border-muted-soft bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-charcoal hover:bg-cream/30">
              + Add {PHASE_LABELS[activePhase].toLowerCase()} event
            </summary>
            <form action={addEvent} className="border-t border-muted-soft p-4 space-y-4">
              <input type="hidden" name="wedding_project_id" value={project.id} />
              <input type="hidden" name="phase" value={activePhase} />
              <input type="hidden" name="couple_public_id" value={coupleId} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Event type *
                  </label>
                  <select
                    name="kind"
                    required
                    className={inputCls}
                    onChange={undefined}
                  >
                    {PHASE_KINDS[activePhase].map((kind) => (
                      <option key={kind} value={kind}>
                        {EVENT_KIND_LABELS[kind as EventKind]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Display name for this event"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Date
                  </label>
                  <input type="date" name="event_date" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Start
                  </label>
                  <input type="time" name="start_time" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    End
                  </label>
                  <input type="time" name="end_time" className={inputCls} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Venue
                  </label>
                  <input type="text" name="venue" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Guest count
                  </label>
                  <input
                    type="number"
                    name="guest_count"
                    min={1}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-charcoal">
                  Notes
                </label>
                <textarea name="notes" rows={2} className={inputCls} />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90"
              >
                Add event
              </button>
            </form>
          </details>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-soft bg-white p-8 text-center">
          <p className="text-sm text-muted">No wedding project yet.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-charcoal">{value}</dd>
    </div>
  );
}
