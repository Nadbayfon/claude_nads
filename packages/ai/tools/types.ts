import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodTypeAny, infer as zInfer } from "zod";
import type { Database } from "@crystal/db";

export interface ToolContext {
  supabase: SupabaseClient<Database>;
  team_member_id: number;
}

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "denied_by_rls" | "not_found" | "validation"; detail?: string };

export interface Tool<TIn extends ZodTypeAny = ZodTypeAny, TOut extends ZodTypeAny = ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TIn;
  outputSchema: TOut;
  run: (input: zInfer<TIn>, ctx: ToolContext) => Promise<ToolResult<zInfer<TOut>>>;
  /**
   * Outbound tools (compose_email_draft, send_whatsapp_template, etc.)
   * require an explicit confirmation step in the conversation before
   * the runtime invokes them.
   */
  requiresConfirmation?: boolean;
}
