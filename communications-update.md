# Communications Update

**When to use:** Every time new information arrives about a wedding —
an email from a provider, a WhatsApp message, a call transcript, a
meeting summary, a couple's reply. Run this prompt to extract what
matters and log it in the couple's communications file.

**Goal:** Turn any incoming communication into a structured, searchable
log entry in `01-couples/[name]/communications.md`. Every other prompt
for this couple reads from this file — it is the single source of truth
for everything that has happened on the wedding.

**Time to run:** 2–3 minutes per communication
**Output:** A formatted entry ready to append to `communications.md`

**Always read first:** `00-context/company.md` and the couple's
`brief.md` and existing `communications.md`

---

## Phase 2 note — this prompt becomes an automation

This prompt is currently run manually. In Phase 2 it will be triggered
automatically by:
- Gmail / Outlook API detecting a new email from a known contact
- A call transcription tool (Whisper, Fireflies, Otter.ai) sending
  the transcript at the end of a call
- A WhatsApp integration detecting a new message from a known number

The output format is designed to be identical whether run manually
or automatically. The habit you build now becomes the automation later.

---

## Prompt

You are the AI assistant for Crystal Events, a luxury destination wedding
planning company in Barcelona. A new communication has arrived relating
to one of our weddings. Your job is to:

1. Read and understand the full communication
2. Extract everything relevant — confirmations, timings, prices,
   decisions, requests, open questions
3. Identify which areas of the wedding are affected
4. Produce a structured log entry ready to append to the couple's
   communications.md file
5. Flag anything that needs immediate attention or action

---

### Variables (fill in before running)

- **Couple:** [NAMES]
- **Source type:** [EMAIL / WHATSAPP / CALL TRANSCRIPT / MEETING NOTES /
  VOICEMAIL / OTHER]
- **From:** [provider name / couple / other — first name or company]
- **Date received:** [DATE]
- **Subject / context:** [e.g. "Catering proposal follow-up" / "Call re venue access"]

---

### Communication input

[PASTE EMAIL BODY / WHATSAPP TEXT / CALL TRANSCRIPT / MEETING NOTES]

---

### Instructions for Claude

#### Step 1 — Read fully

Read the entire communication before extracting anything. Do not
extract from the first paragraph only. Providers often bury critical
conditions (VAT exclusions, minimum numbers, cancellation terms,
deadline dates) at the end of an email or late in a call.

#### Step 2 — Cross-reference existing context

Before writing the entry, check:
- `brief.md` — does anything contradict or update what was agreed?
- `communications.md` — has this topic come up before? Is this a
  change from a previous position?
- `budget.json` — does any new price information affect the budget?
- `timeline-notes.md` — do any confirmed timings affect the timeline?

Note any contradictions or changes explicitly.

#### Step 3 — Produce the log entry

Use this exact format:

---

```markdown
## [DATE] | [SOURCE TYPE] | [FROM]
**Subject:** [brief description — max 10 words]
**Affects:** [budget / timeline / brief / decisions / none]
**Action required:** [YES — see flags below / NO]

### Key points extracted

- [Bullet point for each confirmed fact, timing, price, or decision]
- [Be specific — include exact figures, times, names, quantities]
- [Flag any conditions attached to a confirmation]

### Changes from previous position
<!-- Only include this section if something has changed -->
- Previously: [what was agreed or assumed before]
- Now: [what has changed]
- Impact: [what this affects]

### Open questions / [TO CONFIRM]
<!-- Items mentioned but not yet resolved -->
- [TO CONFIRM] [item] — [who needs to confirm this]

### ⚑ Flags for Jennifer
<!-- Only include items needing immediate attention -->
- [BUDGET] [description of budget impact]
- [TIMELINE] [description of timeline impact]
- [DECISION NEEDED] [what needs to be decided and by when]
- [DEADLINE] [date / what happens if missed]
- [CONFLICT] [e.g. Roc 35 / Núria Font conflict of interest if relevant]
- [CULTURAL] [any cultural or dietary requirement affected]

### Raw source
<!-- Paste or reference the original communication here for the record -->
[PASTE ORIGINAL TEXT or note "Filed separately"]
```

---

#### Step 4 — Update summary

After the log entry, produce a short update block for Jennifer:

```
COMMUNICATIONS UPDATE — [COUPLE] — [DATE]

New entry added: [FROM] / [SUBJECT]
Affects: [list areas affected]
Budget impact: [None / +€X / -€X / Updated proposal — check budget tool]
Timeline impact: [None / [specific change]]
Decisions triggered: [None / [what needs deciding]]
Urgent flags: [None / [list]]
Suggested next action: [one sentence — what Jennifer should do next]
```

---

## Flags reference

Use these flags consistently so they can be searched and filtered
across all couple folders in Phase 2:

| Flag | Meaning |
|------|---------|
| `[BUDGET]` | Price confirmed, changed, or new proposal received |
| `[TIMELINE]` | Timing confirmed, changed, or constraint identified |
| `[DECISION NEEDED]` | Couple or Jennifer must make a choice |
| `[DEADLINE]` | Something must be done by a specific date |
| `[TO CONFIRM]` | Information expected but not yet received |
| `[CONFLICT]` | Roc 35 / Núria Font conflict of interest |
| `[CULTURAL]` | Hindu, Sikh, Jewish, halal, kosher requirement affected |
| `[LEGAL]` | Contract, payment, cancellation clause |
| `[URGENT]` | Needs attention within 24 hours |

---

## The `communications.md` file structure

The file for each couple follows this structure:

```markdown
# Communications Log — [COUPLE NAMES]

**Wedding date:** [DATE]
**Venue:** [VENUE]
**Lead planner:** [NAME]
**Last updated:** [DATE]

---

## Index
<!-- Auto-updated list of all entries, most recent first -->
- [DATE] [FROM] — [SUBJECT] [FLAGS]
- [DATE] [FROM] — [SUBJECT] [FLAGS]

---

<!-- Log entries below, most recent first -->

## [DATE] | [SOURCE] | [FROM]
[entry content]

---

## [DATE] | [SOURCE] | [FROM]
[entry content]
```

When appending a new entry, always:
1. Add it at the **top** of the log (most recent first)
2. Update the **index** at the top of the file
3. Update the **Last updated** date

---

## Example runs

### Example 1 — Email from caterer

**Variables:**
- Couple: Priya & James
- Source type: EMAIL
- From: Marta (Catering Sensacions)
- Date: 14 November 2024
- Subject: Revised catering proposal + payment scheme

**Input:**
> Hola Jennifer, te mando la propuesta revisada con los cambios que
> hablamos. El menú de cóctel queda en €42 por persona (antes €45),
> confirmamos que podemos hacer los 6 menús halal sin problema.
> Para el banquete, el precio por persona es €95 con IVA incluido (10%).
> El esquema de pago sería: 30% al confirmar, 40% en julio, 30% final
> en septiembre. Necesitamos confirmación antes del 30 de noviembre
> para bloquear la fecha. Un saludo, Marta

---

### Example 2 — Call transcript

**Variables:**
- Couple: Emma & David
- Source type: CALL TRANSCRIPT
- From: Bride Emma
- Date: 20 November 2024
- Subject: Weekly check-in call

**Input:**
> [transcript from call transcription tool — paste in full]
> Key topics discussed: first dance song confirmed, venue visit
> scheduled for 5 December, florist shortlist down to two options,
> Emma's mother joining for venue visit

---

### Example 3 — WhatsApp from DJ

**Variables:**
- Couple: Aisha & Tom
- Source type: WHATSAPP
- From: DJ Jordi
- Date: 21 November 2024
- Subject: Setup time and equipment

**Input:**
> Hola Jen! Confirmo que para esta boda necesito llegar a las 9 de la
> mañana mínimo. Voy a llevar el equipo de luces nuevo, va a quedar
> genial. El precio sigue igual, te mando factura proforma la semana
> que viene. Ah, y el primer baile que me dijeron era una canción en
> árabe, ¿me puedes pasar el título?

---

## Output checklist

Before saving the entry, verify:
- [ ] Date and source clearly labelled
- [ ] All confirmed facts extracted (not just the headline)
- [ ] Exact figures included (prices, times, quantities, percentages)
- [ ] Conditions and deadlines noted
- [ ] Changes from previous position flagged explicitly
- [ ] All [TO CONFIRM] items listed
- [ ] Flags applied correctly
- [ ] Update summary produced for Jennifer
- [ ] Entry placed at TOP of communications.md
- [ ] Index updated
- [ ] Roc 35 conflict checked if Núria or Roc 35 is mentioned
