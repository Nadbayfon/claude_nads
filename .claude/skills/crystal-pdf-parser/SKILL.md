---
name: crystal-pdf-parser
description: Specialised for provider proposal PDFs in Spanish or Catalan. Uses pdf.js for text extraction and Anthropic vision for layout-aware extraction. Knows Spanish VAT keywords, payment-scheme phrasing, Catalan equivalents. Use when implementing or debugging the translate-proposal feature agent or any provider-PDF input path.
---

# crystal-pdf-parser

## When to invoke

- Implementing `translate-proposal` feature agent.
- Adding support for a new proposal layout.
- Debugging extraction errors on a specific provider's PDF.

## Pipeline

1. **Fetch + render** — Supabase Storage URL → `pdf.js` (sandboxed
   worker on the server). Yields per-page text + bounding boxes.
2. **Triage** — quick heuristic: text-only PDF or scan? If scan,
   route to vision-only path; else, hybrid.
3. **Vision call** — Anthropic Opus 4.7 with the page rendered as
   image + the extracted text as context. Vision catches layouts
   (table cells, line items in two columns, fine print at the
   bottom).
4. **Schema validation** — output validated against
   `translate-proposal` agent's `outputSchema`.

## Spanish / Catalan vocabulary cheat-sheet

The model already knows most of this; the value here is making sure
the prompt and the post-parse normalisation handle the variants.

### VAT (IVA)

| Phrase | Means |
|---|---|
| `IVA incluido` / `IVA inclòs` | line is VAT-inclusive |
| `IVA no incluido` / `IVA no inclòs` / `+ IVA` | line is ex-VAT |
| `21%` / `IVA general` / `tipus general` | standard rate |
| `10%` / `IVA reducido` / `tipus reduït` | reduced (catering, hotels) |
| `0%` / `exento` / `exempt` | exempt (rare) |

Default: if the line says `+ IVA` or doesn't specify, set
`vat_inclusive = false` and `vat_rate = 0.21` (catering and venues
use 0.10 for some scopes; the planner reviews).

### Payment schemes

| Phrase | Means |
|---|---|
| `50% señal` / `50% reserva` / `paga i senyal` | retainer 50% |
| `30% al confirmar` | 30% on signature |
| `saldo` / `restante` / `restant` | remaining balance |
| `previo al evento` / `abans de l'esdeveniment` | due before event |
| `el día del evento` / `el dia de l'esdeveniment` | due on the day |
| `transferencia bancaria` / `transferència` | bank transfer |
| `Bizum` | Spanish instant transfer |

Always extract milestones into discrete `payment_milestone` rows
with explicit due dates.

### Common service phrasing

| Catalan | Spanish | English |
|---|---|---|
| `àpat` | `comida` / `menú` | meal |
| `sopar` | `cena` | dinner |
| `càtering` | `catering` | catering |
| `lloguer` | `alquiler` | rental |
| `pressupost` | `presupuesto` | proposal/quote |
| `florista` | `floristería` | florist |
| `fotògraf` | `fotógrafo` | photographer |
| `videògraf` | `videógrafo` | videographer |
| `sonorització` | `sonorización` | sound system |
| `coberteria` | `cubertería` | cutlery |
| `cristalleria` | `cristalería` | glassware |
| `bany privat` | `aseo privado` | private bathroom |
| `barra lliure` | `barra libre` | open bar |

## Layout patterns to expect

- **Table layout** — two-column line items + total. Most common.
- **Section + lump-sum** — "Cocktail: €X", no line items.
- **Multi-event** — one PDF, two events split by header (welcome
  dinner + reception). Extract per event.
- **Bilingual** — half ES, half EN. Treat as ES primary.
- **Photographer / videographer rate cards** — fixed packages,
  add-ons, travel; extract as a single option with `description`
  containing the package title.

## Output shape (matches `translate-proposal` agent)

```yaml
provider:
  inferred_legal_name: "..."
  inferred_trade_name: "..."
  language_detected: "ca" | "es" | "es-ca-mixed"
event_inferred: "welcome_dinner" | "wedding_day" | "ceremony" | "cocktail" | "reception" | "brunch" | "unknown"
line_items:
  - description: "..."
    quantity: 1
    unit_price: 123.45
    vat_rate: 0.21
    vat_inclusive: false
    currency: "EUR"
    notes: "..."
payment_milestones:
  - amount_pct: 50
    due_phrase: "al confirmar"
    inferred_due: "on_signature"
  - amount_pct: 50
    due_phrase: "previ a l'esdeveniment"
    inferred_due: "before_event"
fine_print:
  - "..."
extraction_confidence: 0.0–1.0
human_review_recommended: true | false
```

`human_review_recommended` is `true` whenever
`extraction_confidence < 0.85`, the PDF is a scan, the language is
mixed, or any line item lacks a clear unit price.

## Don't

- Don't infer a venue rental price from a "menu price × guest count"
  table — those are catering line items, not venue rentals.
- Don't merge two events' line items into one block.
- Don't strip the fine print — it goes in `fine_print[]` so the
  options-comparison prompt can use it.
- Don't translate the description to English at this stage —
  `translate-proposal` keeps source language for the line description
  and emits an English summary separately.
