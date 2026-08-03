# ADR 0004 — HTML prototypes coexist with the app

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

The repo includes two functional standalone HTML tools:
`tools/budget-tool.html` and `tools/seating-planner.html`. They
encode real planning logic Jennifer uses today and have a vanilla-JS
+ localStorage data shape that we want to preserve as a canonical
JSON format for round-trip with the new app.

Migration risk: if we delete the HTML tools and the new app misses an
edge case (FX rounding, sandbox snapshots, dietary tags), the team
has no fall-back during phase development.

## Decision

- Keep the HTML tools under `tools/` indefinitely. They are not
  part of the build; they're openable as local files (no server
  needed).
- Treat their JSON shapes as the canonical import/export format for
  the equivalent new modules:
  - `tools/budget-tool.html` ↔ `budget_version.snapshot_blob`
  - `tools/seating-planner.html` ↔ `seating_plan.floorplan_svg`
- Add round-trip tests in the eval harness that load JSON exported
  from the HTML tool and assert the new app produces a byte-for-byte
  equivalent (post-normalisation) export.
- No automated detection / migration in v1. Planners do an explicit
  "import" via the workspace UI.

## Alternatives considered

- **Delete the HTML tools** — rejected; the team needs a stable
  tool while modules are being built. Also useful as an offline
  fall-back if the workspace is unreachable.
- **Rebuild the HTML tools as web components inside the app** —
  rejected; they're prototypes, and the app's React versions can
  diverge for better UX without breaking the HTML originals.
- **Auto-migrate from localStorage** — rejected; localStorage isn't
  shareable across devices, and the user explicitly preferred JSON
  export/import.

## Consequences

- Slightly larger repo footprint (~80 KB of HTML retained).
- We must maintain JSON-shape compatibility on both sides until we
  decide to retire the HTML tools (post-v1 decision).
- Round-trip tests catch regressions early; if the new module's JSON
  drifts from the HTML's, CI fails until either is updated
  intentionally.
