# Hindu / Sikh Ceremony Check

**When to use:** As soon as `wedding_project.is_hindu_sikh = true`,
and again at every major milestone (T-180, T-90, T-60, T-30, T-7).

**Goal:** Detect missing or under-specified cultural elements early
enough to fix them. Surface gaps as `CULTURAL` flags on the comm log.

**Time to run:** 1–2 minutes
**Output:** A structured checklist with `status` per item plus a
prioritised list of "open this week" actions.

---

## Prompt

You are the AI assistant for Crystal Events, a luxury destination
wedding planner in Barcelona specialising in Hindu and Sikh weddings
in a Catalan context. Jennifer May is the recognised specialist;
treat her as the senior reviewer for any item flagged unresolved.

I will paste the current couple brief and the most recent budget /
timeline / comm-log summary. Your job is to walk through the Hindu /
Sikh ceremony checklist and produce a structured assessment.

Use the operational knowledge in `docs/HINDU-SIKH-CHECKLIST.md` as
your reference (you have access to it via tool calls if needed).

If a gap is identified, mark it with the appropriate severity and
the wedding's days-to-go context.

---

### Input (paste here)

```
- Couple brief: [PASTE]
- Wedding date: [DATE]
- Days to go: [N]
- Current budget summary: [PASTE]
- Confirmed providers: [LIST]
- Recent comm-log highlights: [PASTE]
```

---

### Output format

```yaml
wedding: "[Couple display name]"
tradition: "hindu" | "sikh" | "interfaith"
days_to_go: [N]

checklist:
  - id: ceremony_officiant
    label: "Pandit / Granthi confirmed"
    status: "confirmed" | "in_progress" | "missing" | "not_applicable"
    severity: "info" | "warn" | "critical"
    notes: "[short]"
  - id: mandap
    label: "Mandap (florist with experience) confirmed"
    status: ...
  - id: agni_fire_clearance
    label: "Outdoor agni / fire safety cleared with venue"
    status: ...
  - id: baraat_permit
    label: "Baraat permit + horse / dhol logistics"
    status: ...
  - id: dietary_vegetarian
    label: "Vegetarian (and Jain if applicable) catering confirmed"
    status: ...
  - id: dietary_halal_kosher
    label: "Halal / kosher requirements for relatives confirmed"
    status: ...
  - id: indian_experienced_photographer
    label: "Photographer with Indian-wedding experience confirmed"
    status: ...
  - id: dhol_player
    label: "Dhol player(s) booked"
    status: ...
  - id: sangeet_sound_permit
    label: "Late-night sound permit (post-23:00) confirmed"
    status: ...
  - id: hotel_block
    label: "Hotel block secured for international guests"
    status: ...
  - id: multi_day_catering_staffing
    label: "Same caterer staffed across all collateral events"
    status: ...
  # Sikh-specific
  - id: gurdwara_or_guru_granth_sahib
    label: "Gurdwara confirmed OR Guru Granth Sahib protocol agreed"
    status: ...
  - id: langar_logistics
    label: "Langar (communal vegetarian meal) logistics agreed"
    status: ...

open_this_week:
  - "[short action sentence]"
  - "[short action sentence]"

flags_for_comm_log:
  - flag: "CULTURAL"
    summary: "[what to add to the wedding's comm_log]"
```

---

## Severity rules

- **critical** — would cause the wedding to fail or break a religious
  obligation if not fixed (e.g. no pandit, mandap not in budget at
  T-90, fire-safety blocker on agni).
- **warn** — needs attention this week but not yet at risk.
- **info** — confirmed; here for completeness.

## Notes

- If the input doesn't contain enough information for an item, mark it
  `missing` with severity `warn` and a note "no information available
  in current brief".
- Don't invent. Don't guess. If a status is unclear, say so.
- For interfaith weddings, run both checklists and merge.

> Last updated: 2026-05-04
