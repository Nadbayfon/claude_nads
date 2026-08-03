import { z } from "zod";

// ---- Enums --------------------------------------------------------------

export const providerStatusSchema = z.enum(["pending", "confirmed", "declined"]);
export type ProviderStatus = z.infer<typeof providerStatusSchema>;

export const providerCategorySchema = z.enum([
  "venue",
  "catering",
  "photography",
  "videography",
  "florals",
  "music_dj",
  "music_band",
  "lighting",
  "decor",
  "transport",
  "hair_makeup",
  "attire",
  "stationery",
  "cake",
  "priest_officiant",
  "planner_external",
  "rentals",
  "other",
]);
export type ProviderCategory = z.infer<typeof providerCategorySchema>;

export const PROVIDER_CATEGORY_LABELS: Record<ProviderCategory, string> = {
  venue: "Venue",
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  florals: "Florals",
  music_dj: "Music · DJ",
  music_band: "Music · Band",
  lighting: "Lighting",
  decor: "Décor",
  transport: "Transport",
  hair_makeup: "Hair & Makeup",
  attire: "Attire",
  stationery: "Stationery",
  cake: "Cake",
  priest_officiant: "Priest / Officiant",
  planner_external: "Planner (external)",
  rentals: "Rentals",
  other: "Other",
};

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
};

// ---- Action schemas (for server actions) --------------------------------

export const addBudgetServiceSchema = z.object({
  event_id: z.coerce.number().int(),
  name: z.string().min(1, "Service name is required"),
  notes: z.string().optional(),
});
export type AddBudgetService = z.infer<typeof addBudgetServiceSchema>;

export const addProviderOptionSchema = z.object({
  service_id: z.coerce.number().int(),
  display_name: z.string().min(1, "Provider name is required"),
  provider_id: z.coerce.number().int().optional(),
  notes: z.string().optional(),
});
export type AddProviderOption = z.infer<typeof addProviderOptionSchema>;

export const addLineItemSchema = z.object({
  provider_option_id: z.coerce.number().int(),
  description: z.string().min(1, "Description is required"),
  price_eur: z.coerce.number().nonnegative().default(0),
  vat_pct: z.coerce.number().min(0).max(100).default(21),
  vat_inclusive: z.boolean().default(false),
  notes: z.string().optional(),
});
export type AddLineItem = z.infer<typeof addLineItemSchema>;

export const addPaymentMilestoneSchema = z.object({
  provider_option_id: z.coerce.number().int(),
  label: z.string().min(1, "Label is required"),
  pct: z.coerce.number().min(0).max(100),
  due_date: z.string().optional(),
  due_date_text: z.string().optional(),
  notes: z.string().optional(),
});
export type AddPaymentMilestone = z.infer<typeof addPaymentMilestoneSchema>;

export const setProviderStatusSchema = z.object({
  provider_option_id: z.coerce.number().int(),
  status: providerStatusSchema,
});
export type SetProviderStatus = z.infer<typeof setProviderStatusSchema>;
