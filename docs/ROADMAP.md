# Roadmap

| Phase | Title | Status | Target weeks |
|---|---|---|---|
| 0 | Specs (no code) | done (PR #1) | 1 |
| 1 | Scaffold + auth + design system | **in progress** | 1 |
| 2 | Couples / projects / events | not started | 1 |
| 3 | Budget module + AI proposal extraction | not started | 2 |
| 3.5 | Master AI v1 — in-app chat panel | not started | 1.5 |
| 4 | Couple intake + comms log + email-to-AI | not started | 2 |
| 5 | Seating planner module | not started | 1.5 |
| 6 | RFQ / provider DB + WhatsApp Business | not started | 2.5 |
| 6.5 | Calendar sync | not started | 1 |
| 7 | Day-of timeline + wedding-day push | not started | 2 |
| 8 | Hardening + GDPR + PWA + distribution | not started | 1.5 |

Total ~16 weeks to v1.0.

Post-v1: couple portal, e-signature, Telegram bot.

## Sequencing rationale

- **Phase 3 first** validates the AI loop on a high-value, structured
  feature (budget extraction). Every later module copies that pattern.
- **Phase 3.5 before Phase 4** because the in-app chat panel is the
  cheapest place to debug the Master AI runtime; once that's stable,
  layering email + WhatsApp on top is plumbing rather than design.
- **Phase 6 ships RFQ + WhatsApp together** because both touch the
  outbound-to-providers surface area; PII guardrails apply equally.
- **Phase 8 is hardening, not feature work** — explicit budget for
  fixing what real usage exposed.

## Per-phase acceptance

See `docs/PRD.md` for the user-story-level acceptance criteria.

## Risk-driven slippage

The two phases most likely to slip:

- **Phase 6** — Meta WhatsApp template approval can take 1–4 weeks
  unpredictably. Submit templates at the start of Phase 5 to absorb
  variance.
- **Phase 7** — golden-fixture matching for the day-of timeline depends
  on faithful round-trip of the Sham & Shwan xlsx; budget +0.5w for
  cell-format fidelity.

## Decision points

- After Phase 3.5: confirm whether the in-app chat is the primary
  surface (vs WhatsApp). May reorder Phase 4 vs Phase 6.
- After Phase 6: decide whether Telegram is on the v1.1 list based on
  whether the team is using WhatsApp consistently.
- After Phase 8: external GDPR review + decision to invite couples
  (post-v1).
