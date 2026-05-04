// Placeholder Database type — replaced by `pnpm --filter db codegen`
// once a Supabase project exists. Tables here mirror what the
// migrations under packages/db/migrations/ create.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TeamRole =
  | "owner"
  | "planner"
  | "stylist"
  | "admin"
  | "external_assistant";

export interface TeamMemberRow {
  id: number;
  public_id: string;
  org_id: number;
  auth_user_id: string | null;
  display_name: string;
  email: string;
  phone_e164: string | null;
  role: TeamRole;
  is_active: boolean;
  coi_disclosure_acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface OrgRow {
  id: number;
  public_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      team_member: {
        Row: TeamMemberRow;
        Insert: Partial<TeamMemberRow> & {
          org_id: number;
          display_name: string;
          email: string;
          role: TeamRole;
        };
        Update: Partial<TeamMemberRow>;
        Relationships: [];
      };
      org: {
        Row: OrgRow;
        Insert: Partial<OrgRow> & { name: string };
        Update: Partial<OrgRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      team_role: TeamRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
