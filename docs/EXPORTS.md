# Exports — XLSX & PDF brand spec

Source of truth: the Sham & Shwan reference at
`samples/sham-shwan/day-of-timeline.{xlsx,pdf}`.

## Brand tokens (extracted from `tools/budget-tool.html`)

```
charcoal:    #2B2B2B
gold:        #C9A96E
cream:       #F5EFE6
soft-black:  #1A1A1A
white:       #FFFFFF
muted:       #6B6B6B
amber-flag:  #E8A33D    (COI banner)
ok-green:    #2E7D32
error-red:   #B00020
```

These live in `packages/ui/src/tokens.ts` and are imported by both web
UI and the export layer.

## Section colour codes (timeline)

| Section | Colour |
|---|---|
| Pre-event setup | gold @ 30% |
| Welcome / Haldi / Mehendi / Sangeet | cream |
| Wedding ceremony | gold |
| Cocktail | charcoal text on cream |
| Reception | charcoal |
| Late night | soft-black |
| Brunch / post-event | cream @ 50% |

## XLSX (`exceljs`)

- **Layout**: A4 landscape, narrow margins.
- **Header row**: Crystal Events wordmark left-aligned; couple display
  name centred; date right-aligned.
- **Footer**: page X of Y, planner name, generation timestamp
  (`Europe/Madrid`).
- **Columns** (day-of timeline):
  1. Time (HH:MM, 24h)
  2. Section (colour-coded fill)
  3. Title
  4. Description
  5. Contact (planner or provider name only — never surnames)
  6. Phone (E.164 → local-format render)
- **Filters** (provider-specific export): hide rows whose `contact_*`
  doesn't match the provider; preserve section colour fills.

## PDF

- Generated from the XLSX via `exceljs` → HTML → `puppeteer` (headless
  Chromium on Vercel) → PDF, OR via direct PDF rendering with
  `@react-pdf/renderer`. Default to `@react-pdf/renderer` for the
  timeline (faster cold start; no Chromium).
- Fonts: **Inter** (UI) and **Crimson Pro** (display). Embedded in
  `packages/ui/src/fonts/`.
- Watermark: none (clean, elegant — see brand tone in
  `prompts/00-context-company.md`).

## Validation against golden fixture

`packages/ai/evals/exports/timeline.eval.ts`:

1. Loads `samples/sham-shwan/day-of-timeline.xlsx`, parses cells.
2. Generates the same wedding from current DB state.
3. Compares cell-by-cell:
   - Time, Section, Title, Contact must match.
   - Description: fuzzy match (≥0.85 similarity).
4. Threshold: ≥90% cell match passes; below → CI fail.

## Master budget export

Mirrors the JSON shape of `tools/budget-tool.html`. One sheet per event
+ one summary sheet.

- Numbers: `numeric(14,2)` displayed with thousand separators.
- Currency code in column header.
- VAT rate column shows `21%` / `10%` / `0%` (no rounding).
- Payment milestones: separate sheet with due date, amount, status.

## Provider proposal extraction (PDF in)

Not strictly an export, but uses the same brand tokens for the
"Proposal extracted by Crystal Events AI — please review before
sending to couple" intermediate document.

## Internationalisation in exports

- Couple-facing exports: EN headers, EN dates (`5 June 2026`).
- Provider-facing exports: CA or ES per `provider.languages[]`.
- Internal exports: EN.

The export layer uses the same locale rules as the rest of the app
(`docs/I18N.md`).
