import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROMPT_PATH = resolve(
  process.cwd(),
  process.env.CRYSTAL_PROMPTS_DIR ?? "prompts",
  "00-context-company.md",
);

let cached: string | null = null;

export function systemPrompt(): string {
  if (cached === null) {
    cached = readFileSync(PROMPT_PATH, "utf8");
    if (Buffer.byteLength(cached, "utf8") > 50_000) {
      throw new Error(
        `prompts/00-context-company.md exceeds 50 KB; review before shipping`,
      );
    }
  }
  return cached;
}

export function reloadSystemPrompt(): void {
  cached = null;
}
