import { getServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EVENT_KIND_LABELS,
  PROVIDER_STATUS_LABELS,
  type EventKind,
  type ProviderStatus,
} from "@crystal/db/zod";
import {
  calcLine,
  formatEur,
  formatEurDetailed,
  sumLineTotals,
  summariseMilestones,
} from "@/lib/budget/calc";
import {
  addBudgetService,
  addLineItem,
  addPaymentMilestone,
  addProviderOption,
  deleteBudgetService,
  deleteLineItem,
  deletePaymentMilestone,
  deleteProviderOption,
  setProviderStatus,
} from "./actions";

type LineItem = {
  id: number
  description: string
  price_eur: number
  vat_pct: number
  vat_inclusive: boolean
  notes: string | null
}

type Milestone = {
  id: number
  label: string
  pct: number
  due_date: string | null
  due_date_text: string | null
  paid_at: string | null
  notes: string | null
}

type ProviderOption = {
  id: number
  display_name: string
  status: ProviderStatus
  notes: string | null
  budget_line_item: LineItem[]
  payment_milestone: Milestone[]
}

type Service = {
  id: number
  name: string
  notes: string | null
  budget_provider_option: ProviderOption[]
}

type EventNode = {
  id: number
  name: string
  kind: EventKind
  event_date: string | null
  budget_service: Service[]
}

type CoupleNode = {
  id: number
  public_id: string
  display_name: string
  wedding_project: Array<{
    id: number
    name: string
    event: EventNode[]
  }>
}

const STATUS_COLOURS: Record<ProviderStatus, string> = {
  pending: "bg-cream text-charcoal border-muted-soft",
  confirmed: "bg-gold/20 text-gold-dark border-gold/40",
  declined: "bg-red-50 text-red-700 border-red-200",
};

const inputCls =
  "w-full rounded-lg border border-muted-soft px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ coupleId: string }>;
}) {
  const { coupleId } = await params;
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("couple")
    .select(
      `
      id, public_id, display_name,
      wedding_project(
        id, name,
        event(
          id, name, kind, event_date,
          budget_service(
            id, name, notes,
            budget_provider_option(
              id, display_name, status, notes,
              budget_line_item(id, description, price_eur, vat_pct, vat_inclusive, notes),
              payment_milestone(id, label, pct, due_date, due_date_text, paid_at, notes)
            )
          )
        )
      )
    `,
    )
    .eq("public_id", coupleId)
    .is("deleted_at", null)
    .single();

  if (error || !data) notFound();

  const couple = data as unknown as CoupleNode;
  const project = couple.wedding_project?.[0];
  const events = project?.event ?? [];

  // Project-level total (sum of confirmed providers; falls back to highest-cost
  // pending option if no confirmed exists yet — gives a "best estimate" headline).
  const projectTotal = events.reduce((eventSum, ev) => {
    const eventTotal = (ev.budget_service ?? []).reduce((svcSum, svc) => {
      const options = svc.budget_provider_option ?? [];
      const confirmed = options.find((o) => o.status === "confirmed");
      const chosen = confirmed
        ? confirmed
        : options
            .filter((o) => o.status !== "declined")
            .map((o) => ({ o, total: sumLineTotals(o.budget_line_item ?? []).total }))
            .sort((a, b) => b.total - a.total)[0]?.o;
      const lines = chosen?.budget_line_item ?? [];
      return svcSum + sumLineTotals(lines).total;
    }, 0);
    return eventSum + eventTotal;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/couples" className="hover:text-charcoal">
          Couples
        </Link>
        <span>/</span>
        <Link href={`/couples/${coupleId}`} className="hover:text-charcoal">
          {couple.display_name}
        </Link>
        <span>/</span>
        <span className="text-charcoal">Budget</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Budget</h1>
          {project && (
            <p className="mt-1 text-sm text-muted">{project.name}</p>
          )}
        </div>
        <div className="rounded-lg border border-gold/40 bg-cream/50 px-4 py-2 text-right">
          <div className="text-xs text-muted">Project total (confirmed + best pending)</div>
          <div className="font-display text-2xl text-charcoal">
            {formatEur(projectTotal)}
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState coupleId={coupleId} />
      ) : (
        <div className="space-y-6">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              coupleId={coupleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ coupleId }: { coupleId: string }) {
  return (
    <div className="rounded-lg border border-dashed border-muted-soft bg-white p-8 text-center">
      <p className="text-sm text-muted">
        No events on this wedding yet. Add events on the
        <Link href={`/couples/${coupleId}`} className="text-gold-dark hover:underline">
          {" "}couple page{" "}
        </Link>
        first; budget services hang off events.
      </p>
    </div>
  );
}

function EventCard({ event, coupleId }: { event: EventNode; coupleId: string }) {
  const services = event.budget_service ?? [];
  const eventTotal = services.reduce((sum, svc) => {
    const options = svc.budget_provider_option ?? [];
    const confirmed = options.find((o) => o.status === "confirmed");
    const chosen = confirmed
      ? confirmed
      : options
          .filter((o) => o.status !== "declined")
          .map((o) => ({ o, total: sumLineTotals(o.budget_line_item ?? []).total }))
          .sort((a, b) => b.total - a.total)[0]?.o;
    return sum + sumLineTotals(chosen?.budget_line_item ?? []).total;
  }, 0);

  return (
    <section className="rounded-lg border border-muted-soft bg-white shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-muted-soft px-5 py-3">
        <div>
          <h2 className="font-display text-xl text-charcoal">{event.name}</h2>
          <p className="text-xs text-muted">
            {EVENT_KIND_LABELS[event.kind] ?? event.kind}
            {event.event_date &&
              ` · ${new Date(event.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Event subtotal</div>
          <div className="font-display text-lg text-charcoal">{formatEur(eventTotal)}</div>
        </div>
      </header>

      <div className="divide-y divide-muted-soft">
        {services.map((svc) => (
          <ServiceRow key={svc.id} service={svc} coupleId={coupleId} />
        ))}
      </div>

      <details className="border-t border-dashed border-muted-soft">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-charcoal hover:bg-cream/30">
          + Add service
        </summary>
        <form action={addBudgetService} className="space-y-3 border-t border-muted-soft p-4">
          <input type="hidden" name="event_id" value={event.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Service name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Catering, Photography, Florals…"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Notes</label>
            <input type="text" name="notes" className={inputCls} />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90"
          >
            Add service
          </button>
        </form>
      </details>
    </section>
  );
}

function ServiceRow({ service, coupleId }: { service: Service; coupleId: string }) {
  const options = service.budget_provider_option ?? [];

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base text-charcoal">{service.name}</h3>
        <form action={deleteBudgetService} className="text-xs">
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <button type="submit" className="text-muted hover:text-red-700" aria-label="Delete service">
            Remove service
          </button>
        </form>
      </div>

      {service.notes && (
        <p className="mt-1 text-xs text-muted">{service.notes}</p>
      )}

      <div className="mt-3 space-y-3">
        {options.map((opt) => (
          <ProviderOptionCard key={opt.id} option={opt} coupleId={coupleId} />
        ))}
      </div>

      <details className="mt-3 rounded-lg border border-dashed border-muted-soft">
        <summary className="cursor-pointer px-3 py-2 text-sm text-charcoal hover:bg-cream/30">
          + Add provider option
        </summary>
        <form action={addProviderOption} className="space-y-3 border-t border-muted-soft p-3">
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Provider name *</label>
            <input type="text" name="display_name" required className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-charcoal">Notes (contact, website, conditions)</label>
            <textarea name="notes" rows={2} className={inputCls} />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90"
          >
            Add provider option
          </button>
        </form>
      </details>
    </div>
  );
}

function ProviderOptionCard({
  option,
  coupleId,
}: {
  option: ProviderOption;
  coupleId: string;
}) {
  const lines = option.budget_line_item ?? [];
  const milestones = option.payment_milestone ?? [];
  const totals = sumLineTotals(lines);
  const milestoneSummary = summariseMilestones(totals.total, milestones);

  return (
    <div
      className={`rounded-lg border bg-cream/20 p-3 ${option.status === "confirmed" ? "border-gold/40" : "border-muted-soft"}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-charcoal">{option.display_name}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[option.status]}`}
          >
            {PROVIDER_STATUS_LABELS[option.status]}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Total</div>
          <div className="font-display text-base text-charcoal">{formatEur(totals.total)}</div>
        </div>
      </div>

      {option.notes && (
        <p className="mt-1 text-xs text-muted whitespace-pre-line">{option.notes}</p>
      )}

      {/* Status actions */}
      <div className="mt-2 flex flex-wrap gap-2">
        {option.status !== "confirmed" && (
          <form action={setProviderStatus} className="inline">
            <input type="hidden" name="provider_option_id" value={option.id} />
            <input type="hidden" name="status" value="confirmed" />
            <input type="hidden" name="couple_public_id" value={coupleId} />
            <button
              type="submit"
              className="rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs text-gold-dark hover:bg-gold/20"
            >
              Confirm
            </button>
          </form>
        )}
        {option.status !== "pending" && (
          <form action={setProviderStatus} className="inline">
            <input type="hidden" name="provider_option_id" value={option.id} />
            <input type="hidden" name="status" value="pending" />
            <input type="hidden" name="couple_public_id" value={coupleId} />
            <button
              type="submit"
              className="rounded-md border border-muted-soft bg-white px-2 py-0.5 text-xs text-muted hover:text-charcoal"
            >
              Mark pending
            </button>
          </form>
        )}
        {option.status !== "declined" && (
          <form action={setProviderStatus} className="inline">
            <input type="hidden" name="provider_option_id" value={option.id} />
            <input type="hidden" name="status" value="declined" />
            <input type="hidden" name="couple_public_id" value={coupleId} />
            <button
              type="submit"
              className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
            >
              Decline
            </button>
          </form>
        )}
        <form action={deleteProviderOption} className="inline ml-auto">
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <button type="submit" className="text-xs text-muted hover:text-red-700">
            Remove
          </button>
        </form>
      </div>

      {/* Lines */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-muted-soft text-left">
              <th className="py-1 font-medium text-muted">Item</th>
              <th className="py-1 font-medium text-muted text-right">Price (EUR)</th>
              <th className="py-1 font-medium text-muted text-right">VAT</th>
              <th className="py-1 font-medium text-muted text-right">Line total</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted-soft/60">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-2 text-xs text-muted">
                  No line items yet.
                </td>
              </tr>
            ) : (
              lines.map((li) => {
                const c = calcLine(li);
                return (
                  <tr key={li.id}>
                    <td className="py-1 align-top">
                      <div className="text-charcoal">{li.description}</div>
                      {li.notes && <div className="text-xs text-muted">{li.notes}</div>}
                    </td>
                    <td className="py-1 align-top text-right text-charcoal">
                      {formatEurDetailed(li.price_eur)}
                      <div className="text-[10px] text-muted">
                        {li.vat_inclusive ? "incl. VAT" : "ex VAT"}
                      </div>
                    </td>
                    <td className="py-1 align-top text-right text-muted">
                      {Number(li.vat_pct).toFixed(0)}%
                    </td>
                    <td className="py-1 align-top text-right text-charcoal">
                      {formatEurDetailed(c.total)}
                    </td>
                    <td className="py-1 align-top text-right">
                      <form action={deleteLineItem} className="inline">
                        <input type="hidden" name="id" value={li.id} />
                        <input type="hidden" name="couple_public_id" value={coupleId} />
                        <button type="submit" className="text-xs text-muted hover:text-red-700">
                          ×
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="border-t border-muted-soft text-xs text-muted">
                <td className="py-1">Subtotal ex VAT</td>
                <td colSpan={2}></td>
                <td className="py-1 text-right">{formatEurDetailed(totals.exVat)}</td>
                <td></td>
              </tr>
              <tr className="text-xs text-muted">
                <td className="py-1">VAT</td>
                <td colSpan={2}></td>
                <td className="py-1 text-right">{formatEurDetailed(totals.vatAmount)}</td>
                <td></td>
              </tr>
              <tr className="text-sm">
                <td className="py-1 font-medium text-charcoal">Total</td>
                <td colSpan={2}></td>
                <td className="py-1 text-right font-medium text-charcoal">
                  {formatEurDetailed(totals.total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add line form */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-charcoal hover:underline">
          + Add line item
        </summary>
        <form action={addLineItem} className="mt-2 space-y-2 rounded-md border border-muted-soft bg-white p-3">
          <input type="hidden" name="provider_option_id" value={option.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_80px]">
            <input
              type="text"
              name="description"
              required
              placeholder="Description"
              className={inputCls}
            />
            <input
              type="number"
              name="price_eur"
              step="0.01"
              min="0"
              placeholder="Price (EUR)"
              className={inputCls}
            />
            <input
              type="number"
              name="vat_pct"
              step="0.01"
              min="0"
              max="100"
              defaultValue={21}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-charcoal">
              <input
                type="checkbox"
                name="vat_inclusive"
                className="h-3.5 w-3.5 rounded border-muted-soft"
              />
              Price includes VAT
            </label>
            <button
              type="submit"
              className="ml-auto rounded-md bg-charcoal px-3 py-1 text-xs font-medium text-cream hover:bg-charcoal/90"
            >
              Add line
            </button>
          </div>
        </form>
      </details>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-muted">Payment schedule</div>
          <div className="mt-1 space-y-1">
            {milestones.map((m) => {
              const amount = (totals.total * Number(m.pct)) / 100;
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-muted-soft bg-white px-2 py-1 text-xs"
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`font-medium ${m.paid_at ? "text-green-700" : "text-charcoal"}`}>
                      {m.paid_at ? "✓ " : ""}{m.label}
                    </span>
                    <span className="text-muted">{Number(m.pct).toFixed(0)}%</span>
                    {(m.due_date || m.due_date_text) && (
                      <span className="text-muted">
                        · due {m.due_date
                          ? new Date(m.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : m.due_date_text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-charcoal">{formatEurDetailed(amount)}</span>
                    <form action={deletePaymentMilestone} className="inline">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="couple_public_id" value={coupleId} />
                      <button type="submit" className="text-muted hover:text-red-700">
                        ×
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            {milestoneSummary.pctSum !== 100 && (
              <p className="text-xs text-amber-700">
                Milestone percentages sum to {milestoneSummary.pctSum.toFixed(0)}% (not 100%).
              </p>
            )}
          </div>
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-charcoal hover:underline">
          + Add payment milestone
        </summary>
        <form action={addPaymentMilestone} className="mt-2 space-y-2 rounded-md border border-muted-soft bg-white p-3">
          <input type="hidden" name="provider_option_id" value={option.id} />
          <input type="hidden" name="couple_public_id" value={coupleId} />
          <div className="grid gap-2 sm:grid-cols-[1fr_80px_140px]">
            <input
              type="text"
              name="label"
              required
              placeholder="Label (e.g. Deposit, Balance)"
              className={inputCls}
            />
            <input
              type="number"
              name="pct"
              step="0.01"
              min="0"
              max="100"
              placeholder="%"
              required
              className={inputCls}
            />
            <input
              type="date"
              name="due_date"
              className={inputCls}
            />
          </div>
          <input
            type="text"
            name="due_date_text"
            placeholder="Or text date (e.g. On signature)"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded-md bg-charcoal px-3 py-1 text-xs font-medium text-cream hover:bg-charcoal/90"
          >
            Add milestone
          </button>
        </form>
      </details>
    </div>
  );
}
