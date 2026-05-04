# Day-of Timeline

**When to use:** When you have a confirmed wedding plan and need to produce
the step-by-step timeline for the wedding day or any collateral event
(welcome dinner, Mehendi, brunch, etc.).

**Goal:** Produce two deliverables from a structured brief:
1. A formatted **Excel file** — master working document, editable
2. A formatted **PDF** — clean, print-ready, sent to each provider

Both documents are designed to be printed and used on the day by every
provider, assistant, and Crystal Events team member.

**Time to run:** 10–15 minutes per event
**Output:** `[couple-name]-[event]-timeline.xlsx` + `.pdf`

**Always read first:** `00-context/company.md` and the couple's `brief.md`

---

## How this prompt works — two modes

### Mode 1 — Learning (ongoing, throughout planning)

The timeline is not written in one go. It is built gradually from
information that arrives from different sources over weeks or months:

- Emails and WhatsApp messages with providers confirming timings
- Venue requirements and access rules
- Meetings with the couple about their preferences
- Calls with the officiant, DJ, caterer, florist
- Logistics confirmed with transport providers
- Cultural or family requirements added late

**As each piece of information arrives, feed it to Claude:**

> "Add to the Sham & Shwan timeline: DJ Jordi confirmed he needs
> 2 hours to set up sound. Venue access from 09:00."

> "From today's call with Sensacions: cocktail hour starts at 17:45,
> dinner at 20:30. They need 45 min to clear cocktail and reset."

> "From bride's email: she wants the first dance immediately after
> the cake cut, not at the start of the party."

Claude will store these as timeline notes in the couple's folder,
building up a picture of the day event by event.

The example timeline included in this prompt (Sham & Shwan) is a
**reference example only** — it shows the format and level of detail
expected. Use it to teach Claude what a complete Crystal Events
timeline looks like. Feed more real examples over time to improve
the quality of future drafts.

### Mode 2 — First draft (triggered when ready)

When enough information has been gathered — typically 2–4 weeks
before the event — trigger the first draft:

> "I have enough information for the Sham & Shwan wedding day
> timeline. Build the first draft now."

Claude will synthesise everything collected across all sources,
fill confirmed timings, flag anything still missing as [TO CONFIRM],
and produce both the Excel and PDF files.

You review, correct, and re-run as needed until the timeline
is finalised and ready to send to providers.

---

---

## Prompt

You are the AI assistant for Crystal Events, a luxury destination wedding
planning company in Barcelona. You are building the day-of timeline for
an event. Your job is to produce two files:

1. A formatted Excel (.xlsx) — landscape A4, print-ready, colour-coded
   by section, with frozen header row
2. A formatted PDF — landscape A4, print-ready, same structure,
   designed to be sent to providers and printed on the day

Both files must be professional enough to hand to any provider or
assistant on the day of the wedding.

---

### Variables (fill in before running)

- **Couple names:** [NAMES]
- **Event name:** [e.g. Wedding Day / Welcome Dinner / Mehendi Evening]
- **Date:** [DATE]
- **Venue:** [VENUE]
- **Guest count:** [NUMBER]
- **Lead planner:** [JENNIFER / NÚRIA]
- **Abbreviations used:** [e.g. CE = Crystal Events / CSM = Castell de Sant Marçal]

---

### Timeline input

This can come from any combination of sources — paste them all in
together. Claude will extract, reconcile, and structure them:

- Emails from providers (copy/paste the relevant paragraphs)
- Your own notes from calls or meetings
- WhatsApp messages confirming timings
- Venue access rules and supplier schedules
- Previous timeline drafts being updated
- Couple's preferences from brief.md

**Format for structured rows (when you have confirmed timings):**
```
TIME | DESCRIPTION | CONTACT | PHONE
```

**Format for unstructured notes (emails, call notes, etc.):**
Just paste the raw text. Claude will extract what's relevant and
flag anything ambiguous.

Use [NOTE] at the start of a line for contextual information that
belongs in the timeline but is not a timed action (setup details,
menu items, song lists, special instructions).

**Missing information:** Any timing or detail not yet confirmed
will appear as [TO CONFIRM] in the draft. These are your checklist
for the final weeks before the event.

---

### Sections to include

Every timeline must include the relevant sections from this list.
Omit sections that don't apply to the specific event.

**For a full wedding day:**
1. PREPARATION — GETTING READY
2. FINAL SET-UP — VENUE
3. WEDDING CEREMONY
4. COCKTAIL HOUR
5. DINNER
6. PARTY / DANCING

**For a welcome dinner:**
1. FINAL SET-UP — VENUE
2. GUEST ARRIVAL
3. DINNER
4. CLOSE

**For a Mehendi / Haldi / Sangeet:**
1. PREPARATION
2. SET-UP
3. EVENT
4. CLOSE

**For a day-after brunch:**
1. SET-UP
2. BRUNCH SERVICE
3. CLOSE

---

### Output format

#### EXCEL FILE

Column structure:
| TIME | DUR. | DESCRIPTION | CONTACT | PHONE |

- Landscape A4, fit to one page wide
- Print headers (column labels) repeat on every page
- Row heights auto-adjust to content (wrap text on)
- Colour-coded section headers (one colour per section type)
- Notes rows have a lighter background and italic text
- Crystal Events branding: charcoal header with gold title
- Header and footer: couple name, venue, page numbers, planner name
- Freeze panes below column headers

Section header colours:
- Preparation / Set-up: deep green (#3D6B52)
- Ceremony: deep blue (#3D5A7A)
- Cocktail hour: amber (#7A5E2A)
- Dinner / Party: deep wine (#7A3D52)
- Any other section: charcoal (#2C2825)

#### PDF FILE

Same structure as Excel. Additional requirements:
- A4 landscape
- Margins: 1.5cm all sides
- Font: Helvetica (body 8pt, section headers 9pt bold, notes 7.5pt italic)
- Title block: charcoal background, gold couple name, grey metadata line
- Section headers: full-width coloured bar with white text
- Note rows: warm cream background, italic text
- Data rows: alternating cream/white
- Page footer: venue name (left) · page number (centre) · planner name (right)
- No interactive elements — static, print-only

---

### Crystal Events style rules

1. **Never show the couple's surname** in any provider-facing document
2. **Contact column** shows the provider/team member responsible for
   that action — not the couple's contact details
3. **Notes rows** are for contextual information, setup details, menu
   items, song lists, special instructions. They are not timed actions.
4. **CE** = Crystal Events in all timeline documents
5. **Times** are always shown in 24h format (17:00, not 5:00pm)
6. **Durations** are optional — only fill in when meaningful
   (e.g. ceremony duration, dinner service)
7. All documents are **confidential** — footer must include
   "Confidential — Crystal Events"

---

### Provider-specific versions

After producing the master timeline, Claude can produce a
**filtered version for each provider** that shows:
- Only the rows relevant to that provider
- All section headers retained for context
- The provider's own actions highlighted
- Crystal Events actions shown but dimmed

To request a provider version, add at the end:

> "Also produce a filtered version for: [PROVIDER NAME]"

---

## Reference example

This is a real Crystal Events timeline (Sham & Shwan, September 2024).
It is included here so Claude understands the expected format, level of
detail, and tone. It is **not a template to copy** — every wedding's
timeline will be different. Feed more real examples over time to improve
the quality of future drafts.

---

**Variables:**
- Couple: Sham & Shwan
- Event: Wedding Day
- Date: Saturday 14 September 2024
- Venue: Castell de Sant Marçal (CSM)
- Guests: 186
- Planner: Jennifer May
- Abbreviations: CE = Crystal Events / CSM = Castell de Sant Marçal

**Timeline:**

PREPARATION — GETTING READY
11:00 | Hotel SH Glow — Bride Sham begins hair & makeup (Room xx) | Chiqui (hairdresser) |
11:00 | Hotel SH Glow — Groom Shwan begins preparations (Room xx) | |
[NOTE] Hair & makeup: Chiqui arrives at SH Glow. 4 ladies: bride + sister (hair & makeup); 2 mothers + 1 girl aged 13 (hair only)
14:00 | Photographer Miriam + Videographer Andrea arrive at hotel | Miriam / Andrea |
14:45 | Couple travel to Castell de Sant Marçal by taxi | |

FINAL SET-UP — VENUE
09:00 | CSM opens doors for supplier access | CSM team |
09:00 | Catering Sensacions arrives and begins set-up | Sensacions |
[NOTE] Ceremony: 184 white folding chairs · 10 rows · 92 per side · left of staircase
09:30 | DJ arrives and sets up sound system for ceremony | DJ Jordi |
13:00 | CE verifies all set-up: catering, DJ, florist ✓ | CE |

CEREMONY
16:00 | Couple arrives from Barcelona with families | |
17:00 | Ceremony begins — approx. 30–35 min | Kunal Patel |
17:35 | Ceremony ends — Kunal announces couple married | Kunal Patel |
17:36 | Couple exit to: 'Roj Karim Mubarak' (USB) | DJ Jordi |

---

## Output checklist

Before delivering the files, verify:
- [ ] All times in 24h format
- [ ] All section headers colour-coded correctly
- [ ] Notes rows italic and clearly distinct from action rows
- [ ] Contact column populated for all key actions
- [ ] Crystal Events fee not shown (internal document)
- [ ] No couple surnames in document
- [ ] Venue name and planner name in footer
- [ ] "Confidential — Crystal Events" in footer
- [ ] PDF fits cleanly on A4 landscape without truncation
- [ ] Excel prints cleanly on A4 landscape (fit to width)
