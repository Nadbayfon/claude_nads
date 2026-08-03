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
import { htmlBudgetJsonSchema } from "@/lib/budget/json";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ServiceInsert = Database["public"]["Tables"]["budget_service"]["Insert"];
type OptionInsert = Database["public"]["Tables"]["budget_provider_option"]["Insert"];
type LineInsert = Database["public"]["Tables"]["budget_line_item"]["Insert"];
type MilestoneInsert = Database["public"]["Tables"]["payment_milestone"]["Insert"];
type EventInsert = Database["public"]["Tables"]["event"]["Insert"];

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

// ---- JSON import (round-trip with tools/budget-tool.html) ---------------
// Strategy: APPEND. Existing services/providers/lines stay; imported data is
// added under matching events (matched case-insensitively by name; created if
// missing). Per-provider `versions[]` arrays from the HTML tool are ignored
// — our DB models snapshots at the whole-budget level in budget_version.

export async function importBudgetJson(formData: FormData) {
  const coupleId = formData.get("couple_public_id") as string;
  const jsonText = (formData.get("json") as string) ?? "";

  if (!jsonText.trim()) {
    redirect(`/couples/${coupleId}/budget?import=empty`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    redirect(`/couples/${coupleId}/budget?import=invalid-json`);
  }

  const parsed = htmlBudgetJsonSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/couples/${coupleId}/budget?import=schema-mismatch`);
  }
  const html = parsed.data.S;

  const { supabase, userId } = await authedSupabase();

  const { data: coupleData, error: coupleErr } = await supabase
    .from("couple")
    .select("org_id, wedding_project(id, event(id, name))")
    .eq("public_id", coupleId)
    .is("deleted_at", null)
    .single<{
      org_id: number;
      wedding_project: Array<{
        id: number;
        event: Array<{ id: number; name: string }>;
      }>;
    }>();

  if (coupleErr || !coupleData) {
    redirect(`/couples/${coupleId}/budget?import=couple-not-found`);
  }

  const project = coupleData.wedding_project[0];
  if (!project) {
    redirect(`/couples/${coupleId}/budget?import=no-project`);
  }

  const existingByName = new Map<string, number>();
  for (const ev of project.event ?? []) {
    existingByName.set(ev.name.trim().toLowerCase(), ev.id);
  }

  let importedEvents = 0;
  let importedServices = 0;
  let importedOptions = 0;
  let importedLines = 0;
  let importedMilestones = 0;

  for (let evIdx = 0; evIdx < html.events.length; evIdx++) {
    const htmlEv = html.events[evIdx];
    if (!htmlEv) continue;
    const evName = htmlEv.name.trim();
    if (!evName) continue;

    let dbEventId = existingByName.get(evName.toLowerCase());
    if (!dbEventId) {
      const eventPayload: EventInsert = {
        wedding_project_id: project.id,
        kind: "other",
        phase: "wedding_day",
        name: evName,
        sort_order: Date.now() + evIdx,
        created_by: userId,
      };
      const { data: newEv } = await supabase
        .from("event")
        .insert(eventPayload as never)
        .select("id")
        .single<{ id: number }>();
      if (!newEv) continue;
      dbEventId = newEv.id;
      existingByName.set(evName.toLowerCase(), newEv.id);
      importedEvents++;
    }

    for (let svcIdx = 0; svcIdx < htmlEv.services.length; svcIdx++) {
      const htmlSvc = htmlEv.services[svcIdx];
      if (!htmlSvc?.name?.trim()) continue;

      const servicePayload: ServiceInsert = {
        event_id: dbEventId,
        name: htmlSvc.name.trim(),
        sort_order: Date.now() + svcIdx,
        created_by: userId,
      };
      const { data: svcRow } = await supabase
        .from("budget_service")
        .insert(servicePayload as never)
        .select("id")
        .single<{ id: number }>();
      if (!svcRow) continue;
      importedServices++;

      for (let provIdx = 0; provIdx < htmlSvc.providers.length; provIdx++) {
        const htmlProv = htmlSvc.providers[provIdx];
        if (!htmlProv?.name?.trim()) continue;

        const optionPayload: OptionInsert = {
          service_id: svcRow.id,
          display_name: htmlProv.name.trim(),
          status: htmlProv.status,
          notes: htmlProv.notes || null,
          sort_order: Date.now() + provIdx,
          created_by: userId,
        };
        const { data: optRow } = await supabase
          .from("budget_provider_option")
          .insert(optionPayload as never)
          .select("id")
          .single<{ id: number }>();
        if (!optRow) continue;
        importedOptions++;

        for (let liIdx = 0; liIdx < htmlProv.items.length; liIdx++) {
          const item = htmlProv.items[liIdx];
          if (!item?.description?.trim()) continue;
          const linePayload: LineInsert = {
            provider_option_id: optRow.id,
            description: item.description.trim(),
            price_eur: item.price,
            vat_pct: item.vatPct,
            vat_inclusive: item.vatShown,
            sort_order: Date.now() + liIdx,
            created_by: userId,
          };
          await supabase.from("budget_line_item").insert(linePayload as never);
          importedLines++;
        }

        for (let pmIdx = 0; pmIdx < htmlProv.payments.length; pmIdx++) {
          const pay = htmlProv.payments[pmIdx];
          if (!pay?.label?.trim()) continue;
          const milestonePayload: MilestoneInsert = {
            provider_option_id: optRow.id,
            label: pay.label.trim(),
            pct: pay.pct,
            due_date_text: pay.date || null,
            notes: pay.note || null,
            sort_order: Date.now() + pmIdx,
            created_by: userId,
          };
          await supabase
            .from("payment_milestone")
            .insert(milestonePayload as never);
          importedMilestones++;
        }
      }
    }
  }

  revalidatePath(`/couples/${coupleId}/budget`);
  const summary = `e=${importedEvents}&s=${importedServices}&p=${importedOptions}&l=${importedLines}&m=${importedMilestones}`;
  redirect(`/couples/${coupleId}/budget?import=ok&${summary}`);
}
