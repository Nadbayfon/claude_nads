import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import type { HtmlBudgetJson } from "@/lib/budget/json";

type LineItem = {
  id: number;
  description: string;
  price_eur: number;
  vat_pct: number;
  vat_inclusive: boolean;
  sort_order: number;
};

type Milestone = {
  id: number;
  label: string;
  pct: number;
  due_date: string | null;
  due_date_text: string | null;
  notes: string | null;
  sort_order: number;
};

type Option = {
  id: number;
  display_name: string;
  status: "pending" | "confirmed" | "declined";
  notes: string | null;
  sort_order: number;
  budget_line_item: LineItem[];
  payment_milestone: Milestone[];
};

type Service = {
  id: number;
  name: string;
  sort_order: number;
  budget_provider_option: Option[];
};

type EventNode = {
  id: number;
  name: string;
  event_date: string | null;
  sort_order: number;
  budget_service: Service[];
};

type CoupleNode = {
  display_name: string;
  email_primary: string | null;
  notes: string | null;
  wedding_project: Array<{
    wedding_date: string | null;
    event: EventNode[];
  }>;
};

function bySortOrder<T extends { sort_order: number }>(a: T, b: T) {
  return a.sort_order - b.sort_order;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ coupleId: string }> },
) {
  const { coupleId } = await params;
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("couple")
    .select(
      `
      display_name, email_primary, notes,
      wedding_project(
        wedding_date,
        event(
          id, name, event_date, sort_order,
          budget_service(
            id, name, sort_order,
            budget_provider_option(
              id, display_name, status, notes, sort_order,
              budget_line_item(id, description, price_eur, vat_pct, vat_inclusive, sort_order),
              payment_milestone(id, label, pct, due_date, due_date_text, notes, sort_order)
            )
          )
        )
      )
      `,
    )
    .eq("public_id", coupleId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const couple = data as unknown as CoupleNode;
  const project = couple.wedding_project[0];
  const events = (project?.event ?? []).slice().sort(bySortOrder);

  const json: HtmlBudgetJson = {
    S: {
      coupleName: couple.display_name,
      coupleDate: project?.wedding_date ?? "",
      coupleEmail: couple.email_primary ?? "",
      coupleNotes: couple.notes ?? "",
      ceFee: 0,
      events: events.map((ev) => ({
        id: ev.id,
        name: ev.name,
        date: ev.event_date ?? "",
        open: true,
        services: (ev.budget_service ?? []).slice().sort(bySortOrder).map((svc) => ({
          id: svc.id,
          name: svc.name,
          open: true,
          providers: (svc.budget_provider_option ?? []).slice().sort(bySortOrder).map((opt) => ({
            id: opt.id,
            name: opt.display_name,
            open: true,
            notes: opt.notes ?? "",
            status: opt.status,
            items: (opt.budget_line_item ?? []).slice().sort(bySortOrder).map((li) => ({
              id: li.id,
              description: li.description,
              price: Number(li.price_eur),
              vatPct: Number(li.vat_pct),
              vatShown: li.vat_inclusive,
            })),
            payments: (opt.payment_milestone ?? []).slice().sort(bySortOrder).map((m) => ({
              id: m.id,
              label: m.label,
              pct: Number(m.pct),
              date: m.due_date_text ?? m.due_date ?? "",
              note: m.notes ?? "",
            })),
            versions: [],
          })),
        })),
      })),
      sandbox: false,
    },
  };

  const slug =
    couple.display_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "") ||
    "budget";

  return new NextResponse(JSON.stringify(json, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${slug}-budget.json"`,
    },
  });
}
