import { z } from "zod";

export const photoConsentLevelSchema = z.enum([
  "none",
  "internal",
  "web",
  "press",
]);
export type PhotoConsentLevel = z.infer<typeof photoConsentLevelSchema>;

export const coupleSchema = z.object({
  id: z.number().int(),
  public_id: z.string().uuid(),
  org_id: z.number().int(),
  display_name: z.string().min(1),
  partner1_full_name: z.string().nullable(),
  partner2_full_name: z.string().nullable(),
  email_primary: z.string().email().nullable(),
  phone_primary_e164: z.string().nullable(),
  nationality_1: z.string().nullable(),
  nationality_2: z.string().nullable(),
  photo_consent_level: photoConsentLevelSchema,
  gdpr_consent_given_at: z.string().nullable(),
  notes: z.string().nullable(),
  lead_planner_id: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  deleted_at: z.string().nullable(),
});
export type Couple = z.infer<typeof coupleSchema>;

export const createCoupleSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  partner1_full_name: z.string().optional(),
  partner2_full_name: z.string().optional(),
  email_primary: z.string().email().optional().or(z.literal("")),
  phone_primary_e164: z.string().optional(),
  nationality_1: z.string().optional(),
  nationality_2: z.string().optional(),
  photo_consent_level: photoConsentLevelSchema.default("none"),
  gdpr_consent: z.boolean().default(false),
  notes: z.string().optional(),
  // Project fields
  wedding_date: z.string().optional(),
  guest_count_min: z.coerce.number().int().positive().optional(),
  guest_count_max: z.coerce.number().int().positive().optional(),
  budget_eur_min: z.coerce.number().nonnegative().optional(),
  budget_eur_max: z.coerce.number().nonnegative().optional(),
  is_hindu_sikh: z.boolean().default(false),
  is_jewish: z.boolean().default(false),
  is_civil: z.boolean().default(false),
  lead_planner_id: z.coerce.number().int().optional(),
  secondary_planner_id: z.coerce.number().int().optional(),
  venue_primary: z.string().optional(),
  location_city: z.string().default("Barcelona"),
  project_notes: z.string().optional(),
});
export type CreateCouple = z.infer<typeof createCoupleSchema>;
