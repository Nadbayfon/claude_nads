export type ModelTier = "heavy" | "default" | "light";

export const MODEL_IDS = {
  heavy: "claude-opus-4-7",
  default: "claude-sonnet-4-6",
  light: "claude-haiku-4-5-20251001",
} as const satisfies Record<ModelTier, string>;

export function selectModel(tier: ModelTier): string {
  return MODEL_IDS[tier];
}

export interface AnthropicCallOptions {
  tier: ModelTier;
  mayContainPII: boolean;
}

export function buildHeaders(opts: AnthropicCallOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  if (opts.mayContainPII) {
    headers["anthropic-beta"] = "zero-retention-2024-01-01";
  }
  return headers;
}

const QUICK_LOOKUP_RE = /^\s*(what|when|who|where)\s+(is|are)\b/i;

export function suggestMasterAITier(
  latestPlannerMessage: string,
  toolsCalledLastTurn: number,
  forceHeavy: boolean,
): ModelTier {
  if (forceHeavy) return "heavy";
  if (QUICK_LOOKUP_RE.test(latestPlannerMessage)) return "light";
  if (toolsCalledLastTurn >= 3) return "heavy";
  return "default";
}
