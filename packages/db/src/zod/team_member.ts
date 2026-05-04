import { z } from "zod";

export const teamRoleSchema = z.enum([
  "owner",
  "planner",
  "stylist",
  "admin",
  "external_assistant",
]);
export type TeamRole = z.infer<typeof teamRoleSchema>;

export const teamMemberSchema = z.object({
  id: z.number().int(),
  public_id: z.string().uuid(),
  org_id: z.number().int(),
  auth_user_id: z.string().uuid().nullable(),
  display_name: z.string(),
  email: z.string().email(),
  phone_e164: z.string().nullable(),
  role: teamRoleSchema,
  is_active: z.boolean(),
  coi_disclosure_acknowledged_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;
