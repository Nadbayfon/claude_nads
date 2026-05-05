"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import {
  addBudgetServiceSchema,
  addProviderOptionSchema,
  addLineItemSchema,
  addPaymentMilestoneSchema,
  setProviderStatusSchema,
} from "@crystal/db/zod";
import type { Database } from "@crystal/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ServiceInsert = Database["public"]["Tables"]["budget_service"]["Insert"];
type OptionInsert = Database["public"]["Tables"]["budget_provider_option"]["Insert"];
type LineInsert = Database["public"]["Tables"]["budget_line_item"]["Insert"];
type MilestoneInsert = Database["public"]["Tables"]["payment_milestone"]["Insert"];

async function authedSupabase() {
  const supabase = await getServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");
  return { supabase, userId: authData.user.id };
}

export async function addBudgetService(formData: FormData) {
  const parsed = addBudgetServiceSchema.safeParse({
    event_id: formData.get("event_id"),
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const { supabase, userId } = await authedSupabase();
  const payload: ServiceInsert = {
    event_id: parsed.data.event_id,
    name: parsed.data.name,
    notes: parsed.data.notes ?? null,
    sort_order: Date.now(),
    created_by: userId,
  };
  await supabase.from("budget_service").insert(payload as never);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function addProviderOption(formData: FormData) {
  const parsed = addProviderOptionSchema.safeParse({
    service_id: formData.get("service_id"),
    display_name: formData.get("display_name"),
    provider_id: formData.get("provider_id") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const { supabase, userId } = await authedSupabase();
  const payload: OptionInsert = {
    service_id: parsed.data.service_id,
    display_name: parsed.data.display_name,
    provider_id: parsed.data.provider_id ?? null,
    notes: parsed.data.notes ?? null,
    status: "pending",
    sort_order: Date.now(),
    created_by: userId,
  };
  await supabase.from("budget_provider_option").insert(payload as never);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function addLineItem(formData: FormData) {
  const parsed = addLineItemSchema.safeParse({
    provider_option_id: formData.get("provider_option_id"),
    description: formData.get("description"),
    price_eur: formData.get("price_eur"),
    vat_pct: formData.get("vat_pct"),
    vat_inclusive: formData.get("vat_inclusive") === "on",
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const { supabase, userId } = await authedSupabase();
  const payload: LineInsert = {
    provider_option_id: parsed.data.provider_option_id,
    description: parsed.data.description,
    price_eur: parsed.data.price_eur,
    vat_pct: parsed.data.vat_pct,
    vat_inclusive: parsed.data.vat_inclusive,
    notes: parsed.data.notes ?? null,
    sort_order: Date.now(),
    created_by: userId,
  };
  await supabase.from("budget_line_item").insert(payload as never);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function addPaymentMilestone(formData: FormData) {
  const parsed = addPaymentMilestoneSchema.safeParse({
    provider_option_id: formData.get("provider_option_id"),
    label: formData.get("label"),
    pct: formData.get("pct"),
    due_date: formData.get("due_date") || undefined,
    due_date_text: formData.get("due_date_text") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const { supabase, userId } = await authedSupabase();
  const payload: MilestoneInsert = {
    provider_option_id: parsed.data.provider_option_id,
    label: parsed.data.label,
    pct: parsed.data.pct,
    due_date: parsed.data.due_date ?? null,
    due_date_text: parsed.data.due_date_text ?? null,
    notes: parsed.data.notes ?? null,
    sort_order: Date.now(),
    created_by: userId,
  };
  await supabase.from("payment_milestone").insert(payload as never);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function setProviderStatus(formData: FormData) {
  const parsed = setProviderStatusSchema.safeParse({
    provider_option_id: formData.get("provider_option_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { supabase } = await authedSupabase();
  // The DB trigger tg_cascade_confirm_provider_option auto-declines siblings on confirm.
  await supabase
    .from("budget_provider_option")
    .update({ status: parsed.data.status } as never)
    .eq("id", parsed.data.provider_option_id);

  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function deleteLineItem(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  const { supabase } = await authedSupabase();
  await supabase.from("budget_line_item").delete().eq("id", id);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function deletePaymentMilestone(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  const { supabase } = await authedSupabase();
  await supabase.from("payment_milestone").delete().eq("id", id);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function deleteProviderOption(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  const { supabase } = await authedSupabase();
  await supabase.from("budget_provider_option").delete().eq("id", id);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}

export async function deleteBudgetService(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  const { supabase } = await authedSupabase();
  await supabase.from("budget_service").delete().eq("id", id);
  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}/budget`);
}
