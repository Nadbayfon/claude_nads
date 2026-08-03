import { z } from "zod";

export const projectStatusSchema = z.enum([
  "enquiry",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const weddingProjectSchema = z.object({
  id: z.number().int(),
  public_id: z.string().uuid(),
  org_id: z.number().int(),
  couple_id: z.number().int(),
  name: z.string().min(1),
  wedding_date: z.string().nullable(),
  status: projectStatusSchema,
  guest_count_min: z.number().int().nullable(),
  guest_count_max: z.number().int().nullable(),
  budget_eur_min: z.number().nullable(),
  budget_eur_max: z.number().nullable(),
  is_hindu_sikh: z.boolean(),
  is_jewish: z.boolean(),
  is_civil: z.boolean(),
  lead_planner_id: z.number().int().nullable(),
  secondary_planner_id: z.number().int().nullable(),
  venue_primary: z.string().nullable(),
  location_city: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  deleted_at: z.string().nullable(),
});
export type WeddingProject = z.infer<typeof weddingProjectSchema>;
