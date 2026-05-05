"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { createCoupleSchema } from "@crystal/db/zod";
import type { Database } from "@crystal/db";
import { redirect } from "next/navigation";

// Payloads are typed explicitly so TS validates each field before the insert call.
// The `as never` cast is needed because insert() generic inference falls through
// to `never[]` with placeholder types; it resolves correctly once real codegen runs.
type CoupleInsert = Database["public"]["Tables"]["couple"]["Insert"];
type ProjectInsert = Database["public"]["Tables"]["wedding_project"]["Insert"];

export async function createCouple(formData: FormData) {
  const raw = {
    display_name: formData.get("display_name"),
    partner1_full_name: formData.get("partner1_full_name") || undefined,
    partner2_full_name: formData.get("partner2_full_name") || undefined,
    email_primary: formData.get("email_primary") || undefined,
    phone_primary_e164: formData.get("phone_primary_e164") || undefined,
    nationality_1: formData.get("nationality_1") || undefined,
    nationality_2: formData.get("nationality_2") || undefined,
    photo_consent_level: formData.get("photo_consent_level") ?? "none",
    gdpr_consent: formData.get("gdpr_consent") === "on",
    notes: formData.get("notes") || undefined,
    wedding_date: formData.get("wedding_date") || undefined,
    guest_count_min: formData.get("guest_count_min") || undefined,
    guest_count_max: formData.get("guest_count_max") || undefined,
    budget_eur_min: formData.get("budget_eur_min") || undefined,
    budget_eur_max: formData.get("budget_eur_max") || undefined,
    is_hindu_sikh: formData.get("is_hindu_sikh") === "on",
    is_jewish: formData.get("is_jewish") === "on",
    is_civil: formData.get("is_civil") === "on",
    lead_planner_id: formData.get("lead_planner_id") || undefined,
    secondary_planner_id: formData.get("secondary_planner_id") || undefined,
    venue_primary: formData.get("venue_primary") || undefined,
    location_city: formData.get("location_city") || "Barcelona",
    project_notes: formData.get("project_notes") || undefined,
  };

  const parsed = createCoupleSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/couples/new?error=validation");
  }

  const data = parsed.data;
  const supabase = await getServerSupabase();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { data: member } = await supabase
    .from("team_member")
    .select("id, org_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle<{ id: number; org_id: number }>();

  if (!member) redirect("/login");

  const couplePayload: CoupleInsert = {
    org_id: member.org_id,
    display_name: data.display_name,
    partner1_full_name: data.partner1_full_name ?? null,
    partner2_full_name: data.partner2_full_name ?? null,
    email_primary: data.email_primary || null,
    phone_primary_e164: data.phone_primary_e164 ?? null,
    nationality_1: data.nationality_1 ?? null,
    nationality_2: data.nationality_2 ?? null,
    photo_consent_level: data.photo_consent_level,
    gdpr_consent_given_at: data.gdpr_consent ? new Date().toISOString() : null,
    notes: data.notes ?? null,
    lead_planner_id: data.lead_planner_id ?? member.id,
    created_by: authData.user.id,
  };

  const { data: couple, error: coupleErr } = await supabase
    .from("couple")
    .insert(couplePayload as never)
    .select("id, public_id")
    .single<{ id: number; public_id: string }>();

  if (coupleErr || !couple) {
    redirect("/couples/new?error=db");
  }

  const year = data.wedding_date
    ? new Date(data.wedding_date).getFullYear()
    : new Date().getFullYear();
  const projectName = `${data.display_name} · ${year}`;

  const projectPayload: ProjectInsert = {
    org_id: member.org_id,
    couple_id: couple.id,
    name: projectName,
    wedding_date: data.wedding_date ?? null,
    status: "enquiry",
    guest_count_min: data.guest_count_min ?? null,
    guest_count_max: data.guest_count_max ?? null,
    budget_eur_min: data.budget_eur_min ?? null,
    budget_eur_max: data.budget_eur_max ?? null,
    is_hindu_sikh: data.is_hindu_sikh,
    is_jewish: data.is_jewish,
    is_civil: data.is_civil,
    lead_planner_id: data.lead_planner_id ?? member.id,
    secondary_planner_id: data.secondary_planner_id ?? null,
    venue_primary: data.venue_primary ?? null,
    location_city: data.location_city,
    notes: data.project_notes ?? null,
    created_by: authData.user.id,
  };

  await supabase.from("wedding_project").insert(projectPayload as never);

  redirect(`/couples/${couple.public_id}`);
}
