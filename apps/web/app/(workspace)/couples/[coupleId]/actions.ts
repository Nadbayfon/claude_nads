"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { addEventSchema, PHASE_KINDS } from "@crystal/db/zod";
import type { Database } from "@crystal/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Payload typed explicitly so TS validates each field before the insert call.
// The `as never` cast is needed because insert() generic inference falls through
// to `never[]` with placeholder types; it resolves correctly once real codegen runs.
type EventInsert = Database["public"]["Tables"]["event"]["Insert"];

export async function addEvent(formData: FormData) {
  const raw = {
    wedding_project_id: formData.get("wedding_project_id"),
    kind: formData.get("kind"),
    phase: formData.get("phase"),
    name: formData.get("name"),
    event_date: formData.get("event_date") || undefined,
    start_time: formData.get("start_time") || undefined,
    end_time: formData.get("end_time") || undefined,
    venue: formData.get("venue") || undefined,
    guest_count: formData.get("guest_count") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = addEventSchema.safeParse(raw);
  if (!parsed.success) return;

  const data = parsed.data;

  const validKinds = PHASE_KINDS[data.phase];
  if (!validKinds.includes(data.kind)) return;

  const supabase = await getServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const eventPayload: EventInsert = {
    wedding_project_id: data.wedding_project_id,
    kind: data.kind,
    phase: data.phase,
    name: data.name,
    event_date: data.event_date ?? null,
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    venue: data.venue ?? null,
    guest_count: data.guest_count ?? null,
    notes: data.notes ?? null,
    sort_order: Date.now(),
    created_by: authData.user.id,
  };

  await supabase.from("event").insert(eventPayload as never);

  const coupleId = formData.get("couple_public_id") as string;
  revalidatePath(`/couples/${coupleId}`);
  redirect(`/couples/${coupleId}?phase=${data.phase}`);
}
