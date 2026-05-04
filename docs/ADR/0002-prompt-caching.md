# ADR 0002 — Prompt caching as the loading mechanism for company context

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

`prompts/00-context-company.md` is ~9 KB of always-relevant context
(team, languages, geography, clients, Hindu/Sikh defaults, budget
hierarchy, what we don't do, prompt index). Every feature agent and
the Master AI need this loaded. Sending it on every API call would
cost ~2,500 input tokens × every call.

## Decision

Use Anthropic's prompt caching with `cache_control: { type: "ephemeral" }`
on the system prompt. Cache hits cost ~10% of full input tokens.

- The system prompt is loaded from disk at module init (Next.js server
  startup); the file's contents are passed verbatim to the API.
- For dev, file changes hot-reload (Next.js fast refresh on the
  server module). For prod, edits land in the next deploy or via a
  short server bounce.
- We deliberately **do not** include couple-specific facts in the
  cached system prompt. Couple context is per-request and lives in
  the conversation messages or tool results.

## Alternatives considered

- **Embed and retrieve** — RAG over `prompts/00-context-company.md`.
  Rejected: the file is small enough that retrieving fragments hurts
  context quality more than it saves tokens.
- **Stuff into every message** — simplest, most expensive. Rejected
  on cost.
- **Anthropic's Files API** — useful for long PDFs, not for a stable
  system prompt that changes weekly.

## Consequences

- The `system-prompt.ts` loader becomes a critical-path module;
  unit-tested for "loads without throwing" and "size under 50 KB".
- Editing `prompts/00-context-company.md` invalidates the cache; the
  first call after an edit is full price. We accept this — edits are
  rare relative to call volume.
- We must avoid putting time-varying content in the cached prompt
  (no "today is X"). Time-varying context is added per-message.
- A failure mode: if the cache breakers (cache control headers,
  message ordering) are wrong, we silently pay full cost. The
  `ai_run` table records `cache_hit_tokens` per call so we can
  alert on a sudden cost spike.
