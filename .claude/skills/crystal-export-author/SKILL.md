---
name: crystal-export-author
description: Generates XLSX and PDF exporters per the Crystal Events brand spec. Bundles brand tokens, the Sham & Shwan reference fixture, and validates output against a golden cell map. Use when implementing or modifying the day-of timeline, master budget, or any other export.
---

# crystal-export-author

## When to invoke

- Implementing a new export (timeline, budget, RFQ pack, guest list).
- Updating brand styling.
- Debugging "the regenerated timeline doesn't match Sham & Shwan"
  CI failures.

## Reference

- `docs/EXPORTS.md` — brand spec.
- `samples/sham-shwan/day-of-timeline.{xlsx,pdf}` — golden fixture.
- `packages/ui/src/tokens.ts` — brand colour tokens.

## Brand tokens

```ts
export const tokens = {
  charcoal:    "#2B2B2B",
  gold:        "#C9A96E",
  cream:       "#F5EFE6",
  softBlack:   "#1A1A1A",
  white:       "#FFFFFF",
  muted:       "#6B6B6B",
  amberFlag:   "#E8A33D",
  okGreen:     "#2E7D32",
  errorRed:    "#B00020",
} as const;
```

Section colour codes (timeline) — see `docs/EXPORTS.md`.

## XLSX (`exceljs`)

```ts
import ExcelJS from "exceljs";
import { tokens } from "@crystal/ui/tokens";

export async function buildTimelineXlsx(timeline: Timeline) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Crystal Events";
  const ws = wb.addWorksheet("Timeline", {
    pageSetup: { paperSize: 9, orientation: "landscape", margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
  });

  ws.columns = [
    { header: "Time", key: "time", width: 8 },
    { header: "Section", key: "section", width: 14 },
    { header: "Title", key: "title", width: 36 },
    { header: "Description", key: "description", width: 50 },
    { header: "Contact", key: "contact", width: 22 },
    { header: "Phone", key: "phone", width: 18 },
  ];

  for (const block of timeline.blocks) {
    const row = ws.addRow({
      time: format24h(block.start_time),
      section: block.section_label,
      title: block.title,
      description: block.description,
      contact: block.contact_name,    // first name only, never surname
      phone: formatLocalPhone(block.phone),
    });
    row.getCell("section").fill = sectionFill(block.section);
  }

  return wb;
}
```

## PDF (`@react-pdf/renderer`)

Default for the timeline (faster cold start than headless Chromium):

```tsx
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { tokens } from "@crystal/ui/tokens";

Font.register({ family: "Inter", src: "/fonts/Inter.ttf" });
Font.register({ family: "CrimsonPro", src: "/fonts/CrimsonPro.ttf" });

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Inter", color: tokens.charcoal },
  h1: { fontFamily: "CrimsonPro", fontSize: 22, marginBottom: 12 },
  table: { display: "flex", flexDirection: "column" },
  row: { display: "flex", flexDirection: "row", borderBottom: `1pt solid ${tokens.muted}` },
  cell: { padding: 6, fontSize: 9 },
});

export function TimelinePdf({ timeline }: { timeline: Timeline }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.h1}>{timeline.couple_display_name} — {timeline.event_label}</Text>
        <View style={styles.table}>
          {timeline.blocks.map(b => (
            <View key={b.id} style={styles.row}>
              <Text style={[styles.cell, { width: 60 }]}>{format24h(b.start_time)}</Text>
              <Text style={[styles.cell, { width: 90, backgroundColor: sectionColor(b.section) }]}>{b.section_label}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{b.title}</Text>
              <Text style={[styles.cell, { width: 200 }]}>{b.description}</Text>
              <Text style={[styles.cell, { width: 120 }]}>{b.contact_name}</Text>
              <Text style={[styles.cell, { width: 100 }]}>{formatLocalPhone(b.phone)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
```

## Provider-filtered exports

When a planner wants an export limited to one provider's blocks:

```ts
const filtered = timeline.blocks.filter(b =>
  b.contact_provider_id === providerId
);
return buildTimelineXlsx({ ...timeline, blocks: filtered });
```

Section colour fills are preserved on filtered exports.

## Golden-fixture validation

`packages/ai/evals/exports/timeline.eval.ts`:

```ts
import ExcelJS from "exceljs";
import { buildTimelineXlsx } from "@/server/exports/timeline";
import { loadSham } from "@/evals/fixtures/sham-shwan";

test("Sham & Shwan timeline matches golden ≥90% cells", async () => {
  const timeline = await loadSham();
  const generated = await buildTimelineXlsx(timeline);
  const goldenWb = new ExcelJS.Workbook();
  await goldenWb.xlsx.readFile("samples/sham-shwan/day-of-timeline.xlsx");

  const matches = compareCells(generated, goldenWb, {
    columns: ["time", "section", "title", "contact"],
    fuzzy: ["description"],
  });
  expect(matches.percent).toBeGreaterThanOrEqual(0.9);
});
```

## House rules

- **No surnames in any export cell.** A unit test scans the
  generated workbook for any string matching the wedding's
  `surnames_confidential` and fails the build.
- **24h time format** everywhere.
- **Local phone format** in display columns; the underlying value
  remains E.164.
- **Currency**: thousand separator `.`, decimal `,` for CA/ES;
  reverse for EN. The locale is determined by the export audience
  (couple-facing → EN; provider-facing → CA/ES).
- **Footer** on every page: "page X of Y", planner name,
  generation timestamp (`Europe/Madrid`).

## Don't

- Don't introduce a new export without a golden fixture.
- Don't switch fonts. Inter (UI) + Crimson Pro (display) are
  registered.
- Don't use raw colour hex codes — pull from `packages/ui/tokens`.
- Don't use `puppeteer` for the timeline — `@react-pdf/renderer`
  is the default. Reserve `puppeteer` for the master budget,
  which has complex table behaviour.
