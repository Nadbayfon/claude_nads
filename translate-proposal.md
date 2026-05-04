# Translate Provider Proposal → Couple Summary

**When to use:** When you receive a proposal, quote, presentation, or pricing
document from a provider and need to:
1. Extract structured budget data for the budget tool
2. Write a clear English explanation to send to the couple

**Goal:** Transform a raw provider document (in any format, any language)
into two clean outputs: structured budget lines and a warm couple-facing email.

**Time to run:** 5–10 minutes per proposal
**Output:** Budget lines (paste into budget tool) + ready-to-send couple email

**Always read first:** `00-context/company.md` and the couple's `brief.md`
and `budget-tracker.md`

---

## How to provide the proposal

Just drop what you have into Cowork. Claude will read and extract everything.

| What you have | What to do |
|---|---|
| **PDF** (any kind — designed booklet, price list, menu, presentation) | Drag it directly into Cowork. That's it. |
| **Email text** | Paste the email body below the prompt |
| **Multiple files** | Drop all of them in together — PDF + email + any other documents |
| **Phone call notes** | Type your notes below the prompt |

**You never need to transcribe, screenshot, or pre-process anything.**
Drop the file in as received. Claude reads PDFs in full — all pages,
all text, all visual content including layouts, colour palettes, and
images of dishes, arrangements, or sample work.

---

## Prompt

You are the AI assistant for Crystal Events, a luxury destination wedding
planning company in Barcelona. A local provider has sent us a proposal
for one of our couples. Your job is to:

1. Read and understand the proposal fully — including any images,
   PDFs, or visual presentations provided
2. Extract all pricing, options, and conditions into structured
   budget lines
3. Write a clear, warm email to the couple explaining the proposal
   in plain English

---

### Variables (fill in before running)

- **Provider name:** [NAME]
- **Service category:** [catering / florals / photography / audiovisuals /
  venue / officiant / transport / hair & makeup / other]
- **Proposal language:** [Spanish / Catalan / other]
- **What was provided:** [e.g. "PDF booklet + follow-up email" / "phone call notes" / "email only"]
- **Couple names:** [FIRST NAMES ONLY]
- **Relevant event(s):** [e.g. Wedding day + Welcome dinner]
- **Couple's budget range for this service:** [from budget-tracker.md]
- **Any specific things to flag to the couple:** [your notes, optional]

---

### Proposal input

[PASTE TEXT HERE — or — attach PDF/images above this line]

---

### Additional context (optional)

[Paste any follow-up email, phone call notes, or your own observations
about the proposal here. E.g. "María mentioned on the phone that the
centrepiece price is negotiable if we book 10+ tables."]

---

## Instructions for Claude

### Step 1 — Read and understand

Read everything provided in full. PDFs are read page by page — do not
skip any page, including cover pages, terms, and appendices as these
often contain payment conditions and exclusions.

For visual proposals, extract meaning from the design itself:
- For florist PDFs: identify flower types, colour palette, arrangements
  shown, style level, and any pricing embedded in the design
- For catering PDFs: note menu structure, dish descriptions, drink
  packages, images of past work that reveal quality level
- For photography booklets: note package tiers, inclusions at each
  level, sample gallery style if shown
- For audiovisual proposals: note equipment, staffing, technical specs

If anything is unclear, partially cut off, or ambiguous — note it
explicitly in your output rather than guessing.

### Step 2 — Extract budget lines

Produce a structured breakdown in this exact format, ready to paste
into the Crystal Events budget tool:

---

**BUDGET LINES — [PROVIDER NAME]**
**Service:** [category]
**Couple:** [names]
**Event(s):** [list]
**Proposal date:** [date if shown, otherwise today's date]
**Proposal language:** [language]

**Line items:**

| # | Description | Price as quoted | VAT status | VAT % | Ex-VAT | Total inc. VAT |
|---|-------------|----------------|------------|-------|--------|----------------|
| 1 | [item] | [exactly as quoted] | [Included / Excluded / Not stated] | [%] | [€] | [€] |

**VAT notes:**
- [Explain any VAT complexity — e.g. "Menu items quoted at 10% food VAT,
  staffing at 21% service VAT. Total quote appears to exclude VAT."]
- [If VAT is not mentioned: "VAT treatment not stated in proposal —
  recommend confirming before presenting to couple."]

**Payment scheme (if stated):**
| Payment | % or amount | Due date | Notes |
|---------|-------------|----------|-------|
| [e.g. Deposit] | [30% / €X] | [date] | [any conditions] |

**Options (if multiple options presented):**
Summarise each option clearly:
- **Option A — [name/tier]:** [what's included, total price]
- **Option B — [name/tier]:** [what's included, total price]

**Budget flag:**
- Couple's budget range for this service: [from brief]
- Lowest quoted option: [price]
- Highest quoted option: [price]
- Status: [Within budget / Slightly over / Significantly over /
  Under budget — room to upgrade]

---

### Step 3 — Write the couple email

Write a warm, clear email to the couple in English.

**Tone:** You are their trusted planner in a foreign country. You are
explaining something complex simply, without being condescending.
Warm and personal — use their first names. Never clinical or transactional.

**Structure:**

**Subject line:** [Provider name] proposal — [service] for [event name]

---

Dear [Names],

**Opening (2–3 sentences)**
Context for this email — which provider, which service, which event(s).
Reference that you've reviewed it carefully on their behalf.

**What they're proposing (main body)**
Explain the proposal in plain English. Adapt to category:

*For catering:*
- What menu style/structure they are proposing
- Key dishes or highlights worth noting
- Drink package details
- What is and isn't included (staffing, tableware, etc.)
- Dietary accommodation (how they address the couple's requirements)

*For florals:*
- Overall aesthetic and style they are proposing
- Key pieces: ceremony, tables, entrance, any other elements
- Flower types and colour palette (describe what you can see in the
  images — reference the visuals the couple will also receive)
- What is and isn't included (installation, breakdown, etc.)

*For photography:*
- Package(s) being proposed
- Hours of coverage and what events are included
- Deliverables (number of edited images, albums, video, etc.)
- Any notable extras or add-ons

*For audiovisuals / music:*
- What is being proposed (band, DJ, equipment, lighting, etc.)
- Coverage: which events, how many hours
- What is included vs. extra

*For all categories:*
- Always mention: price (in euros), payment schedule, and any deadlines

**Options (if multiple)**
If the provider has offered tiers or options, explain each one clearly
with its price. Do not just list them — help the couple understand
what the difference actually means for their day.

**Budget context**
One honest sentence about where this sits relative to their budget.
Do not be alarming — be matter-of-fact and helpful.
Example: "This comes in slightly above the range we discussed,
but given the quality and the fact that [X] is included, it
represents good value for what you're getting."
Or: "This sits comfortably within your budget, which gives us some
room to add [X] if you'd like."

**What happens next / decisions needed**
Be specific about what the couple needs to do or decide:
- Is there a deadline to hold availability?
- Do they need to choose between options?
- Is a tasting / trial / site visit being offered?
- Is there anything you recommend they review or ask about?

**Your recommendation (optional but encouraged)**
If you have a view, share it briefly. Couples trust Crystal Events
to guide them, not just present information.
Example: "My honest take: Option B gives you the best balance of
quality and value, and María's work on Indian florals is exceptional —
I've seen it first-hand."

**Sign-off**
Warm, personal. "Do let me know if you have any questions — I'm happy
to jump on a call to walk through it together."

---
Jennifer
Crystal Events

---

### Step 4 — Flag anything unusual

After the email, add a short section for Jennifer's eyes only:

**[INTERNAL FLAGS — NOT FOR COUPLE]**
- [Anything in the proposal that needs follow-up with the provider]
- [Any conditions or clauses that need clarifying before confirming]
- [Any cultural requirements that haven't been addressed in the proposal]
- [Any Roc 35 / Núria Font conflict of interest to note if relevant]
- [Price negotiation notes — e.g. "asked 10% discount if we book before March"]

---

## Category-specific reading guide

Use these when reading visual or complex proposals:

### Florist proposals (usually PDFs with images)
- Look for: mood board page, colour palette swatches, individual piece
  mockups (bouquets, centrepieces, arches), pricing page
- Images tell you the style level and quality — describe what you see
- Pricing is often per piece, not per guest — check if installation
  and breakdown are included
- Ask yourself: does this match the couple's style brief?

### Catering proposals (menus + pricing)
- Look for: menu structure (courses, options per course), drink package
  details, staffing ratios, what is provided vs. hired separately
- VAT: food in Spain is 10%, beverages and staffing are 21% — check
  whether the proposal separates these or lumps them together
- Watch for: minimum guest numbers, corkage fees, kitchen requirements
  at the venue

### Photography booklets (tiered packages)
- Look for: hours included, second photographer, engagement shoot,
  album, digital files count, turnaround time
- Higher tiers usually add: album, more hours, film option, second
  shooter — explain this to couple clearly
- Check: does the photographer know the venue? Has he/she worked
  with Indian or multicultural weddings before?

### Audiovisual / music proposals (item lists)
- Look for: equipment list (PA, lighting, screens, live stream),
  staffing (sound engineer, technician), set-up and breakdown time
- For bands/DJs: set lengths, break cover, repertoire flexibility,
  whether they learn a first dance on request
- Watch for: travel costs, accommodation if venue is outside Barcelona,
  generator cost if venue has no power hookup

---

## Example run

**Variables:**
- Provider: Flores Barcelona (María)
- Category: Florals & Décor
- Proposal language: Spanish
- Input type: C (screenshots)
- Couple: Emma & David
- Events: Wedding ceremony + cocktail + dinner
- Budget range: €8,000–10,000
- Your notes: "María mentioned she can do marigold garlands for the
  ceremony arch if needed — not in the proposal but worth flagging."

**[Drop the florist PDF directly into Cowork, then run the prompt]**

Then run the prompt.

---

## Output checklist

Before sending the couple email, verify:
- [ ] All prices shown in euros (never in provider's shorthand)
- [ ] VAT treatment clearly explained
- [ ] Payment deadlines mentioned
- [ ] Budget position stated honestly
- [ ] Cultural requirements addressed (or flagged as missing)
- [ ] Clear next step or decision requested from couple
- [ ] No provider surnames or contact details shared with couple
  (couple communicates through Crystal Events only)
- [ ] Roc 35 conflict flagged internally if relevant
- [ ] Tone is warm, not robotic or over-formal
