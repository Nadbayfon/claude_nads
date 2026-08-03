# ADR 0005 — Master AI as one runtime behind three fronts

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

Planners work across three surfaces every day: the workspace (laptop),
email, and WhatsApp. The original choice was between (a) building
chat into the workspace only and asking planners to come to it,
(b) building separate AI surfaces per channel, or (c) one runtime
that all three fronts share.

(a) loses the on-the-go use case; planners run errands and visit
venues all afternoon. (b) creates context fragmentation — a thought
started on WhatsApp can't be continued at the laptop. (c) requires
extra plumbing but matches how the team actually thinks.

## Decision

One Master AI runtime. Three fronts feed into it:

- **In-app chat panel** — Phase 3.5
- **Email-to-AI** with per-planner Gmail/M365 OAuth — Phase 4
- **WhatsApp Business** with one verified CE number — Phase 6

A single `agent_conversation` row can have messages with mixed
`front` values; the conversation continues regardless of where the
planner is. Identity binding: `team_member` row carries
`auth_user_id` (in-app), `email` (mail), `phone_e164` (WhatsApp).

## Alternatives considered

- **One front (in-app only)** — rejected; loses 60–80% of the
  utility. WhatsApp is where Jennifer spends most of her mobile time.
- **One agent per surface, no shared state** — rejected; explicitly
  what we're trying to avoid.
- **Federate via Slack as the single agent surface** — rejected;
  the team doesn't use Slack and adoption would lag.

## Consequences

- The runtime's identity-resolution layer is a critical component.
  Failure modes: unregistered phone, OAuth-revoked mailbox, in-app
  session expiry. Each front has a dedicated "I can't tell who you
  are" branch.
- Per-front message persistence is uniform (`agent_message` rows).
  No front-specific tables for messages — only the channel's raw
  payload mirror (`whatsapp_message`) for audit.
- Cross-front continuity must be tested; dialog evals include
  scenarios where the front changes mid-conversation.
- Outbound from any front is gated on planner confirmation. We
  don't auto-send anything to the outside world without an explicit
  "send" turn.
