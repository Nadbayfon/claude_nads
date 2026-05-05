import { z } from "zod";
import { providerCategorySchema } from "./budget";

export const createProviderSchema = z.object({
  legal_name: z.string().min(1, "Legal name is required"),
  trade_name: z.string().optional(),
  category: providerCategorySchema,
  email: z.string().email().optional().or(z.literal("")),
  phone_e164: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  languages: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_internal_conflict: z.boolean().default(false),
  conflict_team_member_id: z.coerce.number().int().optional(),
  hindu_sikh_experience: z.boolean().default(false),
  jewish_experience: z.boolean().default(false),
  dietary_capabilities: z.array(z.string()).default([]),
});
export type CreateProvider = z.infer<typeof createProviderSchema>;
