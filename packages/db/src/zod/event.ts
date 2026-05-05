import { z } from "zod";

export const eventPhaseSchema = z.enum(["pre", "wedding_day", "post"]);
export type EventPhase = z.infer<typeof eventPhaseSchema>;

export const eventKindSchema = z.enum([
  "welcome_dinner",
  "haldi",
  "mehendi",
  "sangeet",
  "baraat",
  "civil_ceremony",
  "religious_ceremony",
  "interfaith_ceremony",
  "cocktail",
  "reception",
  "brunch",
  "other",
]);
export type EventKind = z.infer<typeof eventKindSchema>;

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  welcome_dinner: "Welcome Dinner",
  haldi: "Haldi",
  mehendi: "Mehendi",
  sangeet: "Sangeet",
  baraat: "Baraat",
  civil_ceremony: "Civil Ceremony",
  religious_ceremony: "Religious Ceremony",
  interfaith_ceremony: "Interfaith Ceremony",
  cocktail: "Cocktail",
  reception: "Reception",
  brunch: "Brunch",
  other: "Other",
};

export const PHASE_KINDS: Record<EventPhase, EventKind[]> = {
  pre: ["welcome_dinner", "haldi", "mehendi", "sangeet", "baraat"],
  wedding_day: [
    "civil_ceremony",
    "religious_ceremony",
    "interfaith_ceremony",
    "cocktail",
    "reception",
  ],
  post: ["brunch", "other"],
};

export const PHASE_LABELS: Record<EventPhase, string> = {
  pre: "Pre-Wedding",
  wedding_day: "Wedding Day",
  post: "Post-Wedding",
};

export const eventSchema = z.object({
  id: z.number().int(),
  public_id: z.string().uuid(),
  wedding_project_id: z.number().int(),
  kind: eventKindSchema,
  phase: eventPhaseSchema,
  name: z.string().min(1),
  event_date: z.string().nullable(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  venue: z.string().nullable(),
  guest_count: z.number().int().nullable(),
  sort_order: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
});
export type Event = z.infer<typeof eventSchema>;

export const addEventSchema = z.object({
  wedding_project_id: z.coerce.number().int(),
  kind: eventKindSchema,
  phase: eventPhaseSchema,
  name: z.string().min(1, "Name is required"),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  guest_count: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});
export type AddEvent = z.infer<typeof addEventSchema>;
