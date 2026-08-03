// Budget VAT and total calculations.
// Mirrors the formulas in tools/budget-tool.html so JSON round-trip stays exact.

export interface LineItemForCalc {
  price_eur: number;
  vat_pct: number;
  vat_inclusive: boolean;
}

export interface LineCalc {
  exVat: number;
  vatAmount: number;
  total: number;
}

export function calcLine(item: LineItemForCalc): LineCalc {
  const price = Number(item.price_eur) || 0;
  const vat = Number(item.vat_pct) || 0;
  if (item.vat_inclusive) {
    const exVat = price / (1 + vat / 100);
    return { exVat, vatAmount: price - exVat, total: price };
  }
  const vatAmount = price * (vat / 100);
  return { exVat: price, vatAmount, total: price + vatAmount };
}

export function sumLineTotals(items: LineItemForCalc[]): LineCalc {
  return items.reduce<LineCalc>(
    (acc, item) => {
      const { exVat, vatAmount, total } = calcLine(item);
      return {
        exVat: acc.exVat + exVat,
        vatAmount: acc.vatAmount + vatAmount,
        total: acc.total + total,
      };
    },
    { exVat: 0, vatAmount: 0, total: 0 },
  );
}

export interface MilestoneForCalc {
  pct: number;
  paid_at: string | null;
}

export interface MilestoneCalc {
  paidEur: number;
  outstandingEur: number;
  pctSum: number;
}

export function summariseMilestones(
  providerTotal: number,
  milestones: MilestoneForCalc[],
): MilestoneCalc {
  let paid = 0;
  let outstanding = 0;
  let pctSum = 0;
  for (const m of milestones) {
    const pct = Number(m.pct) || 0;
    pctSum += pct;
    const amount = (providerTotal * pct) / 100;
    if (m.paid_at) paid += amount;
    else outstanding += amount;
  }
  return { paidEur: paid, outstandingEur: outstanding, pctSum };
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatEurDetailed(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
