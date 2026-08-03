// JSON shape used by tools/budget-tool.html (localStorage key `ce_budget1`).
// Match this byte-for-byte so an export from the app round-trips back through
// the standalone HTML tool and vice versa.

import { z } from "zod";

export interface HtmlLineItem {
  id: number;
  description: string;
  price: number;
  vatPct: number;
  vatShown: boolean;
}

export interface HtmlPaymentMilestone {
  id: number;
  label: string;
  pct: number;
  date: string;
  note: string;
}

export interface HtmlVersionSnapshot {
  date: string;
  note: string;
  total: number;
  items: HtmlLineItem[];
  payments: HtmlPaymentMilestone[];
}

export interface HtmlProvider {
  id: number;
  name: string;
  open?: boolean;
  notes: string;
  status: "pending" | "confirmed" | "declined";
  items: HtmlLineItem[];
  payments: HtmlPaymentMilestone[];
  versions?: HtmlVersionSnapshot[];
}

export interface HtmlService {
  id: number;
  name: string;
  open?: boolean;
  providers: HtmlProvider[];
}

export interface HtmlEvent {
  id: number;
  name: string;
  date: string;
  open?: boolean;
  services: HtmlService[];
}

export interface HtmlBudgetState {
  coupleName: string;
  coupleDate: string;
  coupleEmail: string;
  coupleNotes: string;
  ceFee: number;
  events: HtmlEvent[];
  sandbox?: boolean;
}

export interface HtmlBudgetJson {
  S: HtmlBudgetState;
  eId?: number;
  sId?: number;
  pId?: number;
  iId?: number;
  pmId?: number;
}

// ---- Validation schemas (lenient — many fields default to safe values) ----

export const htmlLineItemSchema = z.object({
  id: z.number().optional().default(0),
  description: z.string().default(""),
  price: z.coerce.number().default(0),
  vatPct: z.coerce.number().default(21),
  vatShown: z.boolean().default(false),
});

export const htmlPaymentSchema = z.object({
  id: z.number().optional().default(0),
  label: z.string().default(""),
  pct: z.coerce.number().default(0),
  date: z.string().default(""),
  note: z.string().default(""),
});

export const htmlProviderSchema = z.object({
  id: z.number().optional().default(0),
  name: z.string().default(""),
  notes: z.string().default(""),
  status: z.enum(["pending", "confirmed", "declined"]).default("pending"),
  items: z.array(htmlLineItemSchema).default([]),
  payments: z.array(htmlPaymentSchema).default([]),
});

export const htmlServiceSchema = z.object({
  id: z.number().optional().default(0),
  name: z.string().default(""),
  providers: z.array(htmlProviderSchema).default([]),
});

export const htmlEventSchema = z.object({
  id: z.number().optional().default(0),
  name: z.string().default(""),
  date: z.string().default(""),
  services: z.array(htmlServiceSchema).default([]),
});

export const htmlBudgetJsonSchema = z.object({
  S: z.object({
    coupleName: z.string().optional().default(""),
    coupleDate: z.string().optional().default(""),
    coupleEmail: z.string().optional().default(""),
    coupleNotes: z.string().optional().default(""),
    ceFee: z.coerce.number().optional().default(0),
    events: z.array(htmlEventSchema).default([]),
    sandbox: z.boolean().optional(),
  }),
});
