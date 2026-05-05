// Placeholder Database type — replaced by `pnpm --filter db codegen`
// once a Supabase project exists. Follows the exact format that
// `supabase gen types typescript` produces so Supabase's TypeScript
// client resolves insert/update types correctly.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      org: {
        Row: {
          created_at: string
          id: number
          name: string
          public_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          public_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          public_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_member: {
        Row: {
          auth_user_id: string | null
          coi_disclosure_acknowledged_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_name: string
          email: string
          id: number
          is_active: boolean
          org_id: number
          phone_e164: string | null
          public_id: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          coi_disclosure_acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name: string
          email: string
          id?: number
          is_active?: boolean
          org_id: number
          phone_e164?: string | null
          public_id?: string
          role: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          coi_disclosure_acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string
          email?: string
          id?: number
          is_active?: boolean
          org_id?: number
          phone_e164?: string | null
          public_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      couple: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_name: string
          email_primary: string | null
          gdpr_consent_given_at: string | null
          id: number
          lead_planner_id: number | null
          nationality_1: string | null
          nationality_2: string | null
          notes: string | null
          org_id: number
          partner1_full_name: string | null
          partner2_full_name: string | null
          phone_primary_e164: string | null
          photo_consent_level: Database["public"]["Enums"]["photo_consent_level"]
          public_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name: string
          email_primary?: string | null
          gdpr_consent_given_at?: string | null
          id?: number
          lead_planner_id?: number | null
          nationality_1?: string | null
          nationality_2?: string | null
          notes?: string | null
          org_id: number
          partner1_full_name?: string | null
          partner2_full_name?: string | null
          phone_primary_e164?: string | null
          photo_consent_level?: Database["public"]["Enums"]["photo_consent_level"]
          public_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string
          email_primary?: string | null
          gdpr_consent_given_at?: string | null
          id?: number
          lead_planner_id?: number | null
          nationality_1?: string | null
          nationality_2?: string | null
          notes?: string | null
          org_id?: number
          partner1_full_name?: string | null
          partner2_full_name?: string | null
          phone_primary_e164?: string | null
          photo_consent_level?: Database["public"]["Enums"]["photo_consent_level"]
          public_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_lead_planner_id_fkey"
            columns: ["lead_planner_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_project: {
        Row: {
          budget_eur_max: number | null
          budget_eur_min: number | null
          couple_id: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_count_max: number | null
          guest_count_min: number | null
          id: number
          is_civil: boolean
          is_hindu_sikh: boolean
          is_jewish: boolean
          lead_planner_id: number | null
          location_city: string
          name: string
          notes: string | null
          org_id: number
          public_id: string
          secondary_planner_id: number | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          venue_primary: string | null
          wedding_date: string | null
        }
        Insert: {
          budget_eur_max?: number | null
          budget_eur_min?: number | null
          couple_id: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          guest_count_max?: number | null
          guest_count_min?: number | null
          id?: number
          is_civil?: boolean
          is_hindu_sikh?: boolean
          is_jewish?: boolean
          lead_planner_id?: number | null
          location_city?: string
          name: string
          notes?: string | null
          org_id: number
          public_id?: string
          secondary_planner_id?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          venue_primary?: string | null
          wedding_date?: string | null
        }
        Update: {
          budget_eur_max?: number | null
          budget_eur_min?: number | null
          couple_id?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          guest_count_max?: number | null
          guest_count_min?: number | null
          id?: number
          is_civil?: boolean
          is_hindu_sikh?: boolean
          is_jewish?: boolean
          lead_planner_id?: number | null
          location_city?: string
          name?: string
          notes?: string | null
          org_id?: number
          public_id?: string
          secondary_planner_id?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          venue_primary?: string | null
          wedding_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_project_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couple"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_project_lead_planner_id_fkey"
            columns: ["lead_planner_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_project_secondary_planner_id_fkey"
            columns: ["secondary_planner_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string | null
          event_date: string | null
          guest_count: number | null
          id: number
          kind: Database["public"]["Enums"]["event_kind"]
          name: string
          notes: string | null
          phase: Database["public"]["Enums"]["event_phase"]
          public_id: string
          sort_order: number
          start_time: string | null
          updated_at: string
          venue: string | null
          wedding_project_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: number
          kind: Database["public"]["Enums"]["event_kind"]
          name: string
          notes?: string | null
          phase: Database["public"]["Enums"]["event_phase"]
          public_id?: string
          sort_order?: number
          start_time?: string | null
          updated_at?: string
          venue?: string | null
          wedding_project_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: number
          kind?: Database["public"]["Enums"]["event_kind"]
          name?: string
          notes?: string | null
          phase?: Database["public"]["Enums"]["event_phase"]
          public_id?: string
          sort_order?: number
          start_time?: string | null
          updated_at?: string
          venue?: string | null
          wedding_project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_wedding_project_id_fkey"
            columns: ["wedding_project_id"]
            isOneToOne: false
            referencedRelation: "wedding_project"
            referencedColumns: ["id"]
          },
        ]
      }
      provider: {
        Row: {
          category: Database["public"]["Enums"]["provider_category"]
          conflict_team_member_id: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dietary_capabilities: string[]
          email: string | null
          hindu_sikh_experience: boolean
          id: number
          is_internal_conflict: boolean
          jewish_experience: boolean
          languages: string[]
          legal_name: string
          notes: string | null
          org_id: number
          phone_e164: string | null
          public_id: string
          trade_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["provider_category"]
          conflict_team_member_id?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dietary_capabilities?: string[]
          email?: string | null
          hindu_sikh_experience?: boolean
          id?: number
          is_internal_conflict?: boolean
          jewish_experience?: boolean
          languages?: string[]
          legal_name: string
          notes?: string | null
          org_id: number
          phone_e164?: string | null
          public_id?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["provider_category"]
          conflict_team_member_id?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dietary_capabilities?: string[]
          email?: string | null
          hindu_sikh_experience?: boolean
          id?: number
          is_internal_conflict?: boolean
          jewish_experience?: boolean
          languages?: string[]
          legal_name?: string
          notes?: string | null
          org_id?: number
          phone_e164?: string | null
          public_id?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      budget_service: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: number
          id: number
          name: string
          notes: string | null
          public_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: number
          id?: number
          name: string
          notes?: string | null
          public_id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: number
          id?: number
          name?: string
          notes?: string | null
          public_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      budget_provider_option: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          id: number
          notes: string | null
          provider_id: number | null
          public_id: string
          service_id: number
          sort_order: number
          status: Database["public"]["Enums"]["provider_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: number
          notes?: string | null
          provider_id?: number | null
          public_id?: string
          service_id: number
          sort_order?: number
          status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: number
          notes?: string | null
          provider_id?: number | null
          public_id?: string
          service_id?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Relationships: []
      }
      budget_line_item: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: number
          notes: string | null
          price_eur: number
          provider_option_id: number
          public_id: string
          sort_order: number
          updated_at: string
          vat_inclusive: boolean
          vat_pct: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: number
          notes?: string | null
          price_eur?: number
          provider_option_id: number
          public_id?: string
          sort_order?: number
          updated_at?: string
          vat_inclusive?: boolean
          vat_pct?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: number
          notes?: string | null
          price_eur?: number
          provider_option_id?: number
          public_id?: string
          sort_order?: number
          updated_at?: string
          vat_inclusive?: boolean
          vat_pct?: number
        }
        Relationships: []
      }
      payment_milestone: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          due_date_text: string | null
          id: number
          label: string
          notes: string | null
          paid_at: string | null
          pct: number
          provider_option_id: number
          public_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          due_date_text?: string | null
          id?: number
          label: string
          notes?: string | null
          paid_at?: string | null
          pct: number
          provider_option_id: number
          public_id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          due_date_text?: string | null
          id?: number
          label?: string
          notes?: string | null
          paid_at?: string | null
          pct?: number
          provider_option_id?: number
          public_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      budget_version: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          is_sandbox: boolean
          label: string
          notes: string | null
          public_id: string
          snapshot_blob: Json
          total_eur: number | null
          wedding_project_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          is_sandbox?: boolean
          label: string
          notes?: string | null
          public_id?: string
          snapshot_blob: Json
          total_eur?: number | null
          wedding_project_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          is_sandbox?: boolean
          label?: string
          notes?: string | null
          public_id?: string
          snapshot_blob?: Json
          total_eur?: number | null
          wedding_project_id?: number
        }
        Relationships: []
      }
      currency_fx_snapshot: {
        Row: {
          base_ccy: string
          fetched_at: string
          id: number
          rate: number
          source: string
          target_ccy: string
        }
        Insert: {
          base_ccy: string
          fetched_at?: string
          id?: number
          rate: number
          source?: string
          target_ccy: string
        }
        Update: {
          base_ccy?: string
          fetched_at?: string
          id?: number
          rate?: number
          source?: string
          target_ccy?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      uid_team_member: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      team_role: "owner" | "planner" | "stylist" | "admin" | "external_assistant"
      photo_consent_level: "none" | "internal" | "web" | "press"
      project_status: "enquiry" | "confirmed" | "in_progress" | "completed" | "cancelled"
      event_phase: "pre" | "wedding_day" | "post"
      event_kind:
        | "welcome_dinner"
        | "haldi"
        | "mehendi"
        | "sangeet"
        | "baraat"
        | "civil_ceremony"
        | "religious_ceremony"
        | "interfaith_ceremony"
        | "cocktail"
        | "reception"
        | "brunch"
        | "other"
      provider_status: "pending" | "confirmed" | "declined"
      provider_category:
        | "venue"
        | "catering"
        | "photography"
        | "videography"
        | "florals"
        | "music_dj"
        | "music_band"
        | "lighting"
        | "decor"
        | "transport"
        | "hair_makeup"
        | "attire"
        | "stationery"
        | "cake"
        | "priest_officiant"
        | "planner_external"
        | "rentals"
        | "other"
    }
    CompositeTypes: Record<string, never>
  }
}

// ---- Convenience type aliases derived from Database -------------------
// These match what `supabase gen types` would produce.

export type TeamRole = Database["public"]["Enums"]["team_role"]
export type PhotoConsentLevel = Database["public"]["Enums"]["photo_consent_level"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]
export type EventPhase = Database["public"]["Enums"]["event_phase"]
export type EventKind = Database["public"]["Enums"]["event_kind"]
export type ProviderStatus = Database["public"]["Enums"]["provider_status"]
export type ProviderCategory = Database["public"]["Enums"]["provider_category"]

export type OrgRow = Database["public"]["Tables"]["org"]["Row"]
export type TeamMemberRow = Database["public"]["Tables"]["team_member"]["Row"]
export type CoupleRow = Database["public"]["Tables"]["couple"]["Row"]
export type WeddingProjectRow = Database["public"]["Tables"]["wedding_project"]["Row"]
export type EventRow = Database["public"]["Tables"]["event"]["Row"]
export type ProviderRow = Database["public"]["Tables"]["provider"]["Row"]
export type BudgetServiceRow = Database["public"]["Tables"]["budget_service"]["Row"]
export type BudgetProviderOptionRow = Database["public"]["Tables"]["budget_provider_option"]["Row"]
export type BudgetLineItemRow = Database["public"]["Tables"]["budget_line_item"]["Row"]
export type PaymentMilestoneRow = Database["public"]["Tables"]["payment_milestone"]["Row"]
export type BudgetVersionRow = Database["public"]["Tables"]["budget_version"]["Row"]
export type CurrencyFxSnapshotRow = Database["public"]["Tables"]["currency_fx_snapshot"]["Row"]
