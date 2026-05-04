export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Welcome</h1>
        <p className="mt-2 text-muted">
          The workspace is bare today — Phase 2 brings couples and projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Couples" body="Phase 2 — create-couple wizard, sub-events." />
        <Card title="Budgets" body="Phase 3 — tree budgets with AI proposal extraction." />
        <Card title="Master AI" body="Phase 3.5 — in-app chat panel." />
        <Card title="Comms log" body="Phase 4 — email-to-AI + per-planner Gmail/M365." />
        <Card title="Seating" body="Phase 5 — port from the HTML tool." />
        <Card title="RFQ + WhatsApp" body="Phase 6 — provider DB and Meta integration." />
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-muted-soft bg-white p-4 shadow-sm">
      <div className="font-display text-lg text-charcoal">{title}</div>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
