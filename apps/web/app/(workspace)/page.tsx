import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Welcome</h1>
        <p className="mt-2 text-muted">
          Phase 3 — couples, projects, events, and tree budgets are live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/couples">
          <Card title="Couples" body="Manage couples, wedding projects, and sub-events." live />
        </Link>
        <Card title="Budgets" body="Phase 3 — tree budgets, VAT, milestones (open from a couple's page)." live />
        <Card title="Master AI" body="Phase 3.5 — in-app chat panel." />
        <Card title="Comms log" body="Phase 4 — email-to-AI + per-planner Gmail/M365." />
        <Card title="Seating" body="Phase 5 — port from the HTML tool." />
        <Card title="RFQ + WhatsApp" body="Phase 6 — provider DB and Meta integration." />
      </div>
    </div>
  );
}

function Card({ title, body, live }: { title: string; body: string; live?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm transition-colors ${live ? "border-gold/40 hover:border-gold" : "border-muted-soft"}`}>
      <div className="flex items-center gap-2">
        <span className="font-display text-lg text-charcoal">{title}</span>
        {live && (
          <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-xs font-medium text-gold-dark">
            live
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
