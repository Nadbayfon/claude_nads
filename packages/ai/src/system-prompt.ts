import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROMPT_PATH = resolve(
  process.cwd(),
  process.env.CRYSTAL_PROMPTS_DIR ?? "prompts",
  "00-context-company.md",
);

let cached: string | undefined;

export function systemPrompt(): string {
  if (cached === undefined) {
    const contents = readFileSync(PROMPT_PATH, "utf8");
    if (Buffer.byteLength(contents, "utf8") > 50_000) {
      throw new Error(
        `prompts/00-context-company.md exceeds 50 KB; review before shipping`,
      );
    }
    cached = contents;
  }
  return cached;
}

export function reloadSystemPrompt(): void {
  cached = undefined;
}
