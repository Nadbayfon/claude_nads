# ADR 0006 — Per-planner private Master AI conversations

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

When the user confirmed how the Master AI should be scoped, they
chose **per-planner private assistants** over a shared "Crystal AI"
identity. This is a deliberate trade against ease of team handover —
in exchange for privacy, individual workflow style, and reduced
cross-pollination of half-formed thoughts.

## Decision

- `agent_conversation` rows are owner-scoped. RLS denies read access
  to anyone except the owner unless `is_shared_to_team = true`.
- "Promote to team" is a deliberate planner action (button in
  in-app, `/share` on WhatsApp, `share` reply on email). Promotion
  requires a linked `wedding_project`.
- Sharing exposes the conversation read-only to other planners
  assigned to that wedding. The owner can flip back to private at
  any time.
- "Convert to comm log" creates a separate `comm_log` entry (visible
  per the wedding's normal RLS) summarising the relevant exchange.
  The original messages stay private.
- Shared business data (couples, providers, budgets, timelines) is
  governed by the existing RBAC and is unaffected by conversation
  privacy.

## Alternatives considered

- **One shared assistant for the company** — explicitly rejected by
  the user. Would have eased handover and made cross-planner
  context cheaper, but the team prefers private working space.
- **Per-couple assistant** — rejected; planners juggle many
  couples in parallel and would face a switching cost on every turn.
- **No sharing at all** — rejected; Crystal Events does need team
  visibility for handovers and absences. Promote-to-team is the
  controlled valve.

## Consequences

- Every Master AI tool that returns conversation data must filter
  by ownership. The `crystal-gdpr-reviewer` skill checks this at
  PR review.
- Team handover requires an active step: when Jennifer is on
  holiday and Núria covers a wedding, Jennifer must promote
  relevant conversations beforehand. We surface this in the daily
  digest ("you have 3 unshared conversations on weddings where
  another planner is on duty this week").
- The dialog eval suite includes a cross-planner privacy test
  (Núria asks about a Jennifer-only thread → AI denies).
- Shared business data continues to be the primary handover
  surface — the comm log, budget, timeline — not the AI chat.
  This keeps the per-planner private model honest.
