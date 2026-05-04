// Master AI tool registry. Tools land here from Phase 3.5 onwards.
// See .claude/skills/crystal-master-ai-tool-author for how to add one.

import type { Tool } from "./types";

export const registry: Tool[] = [];

export type { Tool, ToolContext, ToolResult } from "./types";
