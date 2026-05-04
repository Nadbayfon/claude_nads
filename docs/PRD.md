# Product Requirements — Crystal Events App

> Audience: Jennifer May (owner) and the four planners. Read alongside
> `prompts/00-context-company.md` for domain context.

## Why this app exists

Crystal Events delivers ~25 luxury weddings a year for foreign couples in
Catalonia. The work today lives across a prompt library, two standalone
HTML tools, email, WhatsApp, and Google Drive. Information is duplicated,
hand-offs between planners drop context, and AI assistance only happens
when someone manually pastes into Claude. The app brings the work into one
place and makes the AI assistant always-available without changing the way
Jennifer's team naturally works (laptop, email, WhatsApp).

## Jobs to be done

### Jennifer (owner / lead planner)
1. **See the state of every wedding at a glance** — phase, blockers,
   deadlines, money in/out, conflicts.
2. **Triage incoming comms** — couple emails, provider replies, WhatsApp
   threads — without losing anything.
3. **Generate provider RFQs in CA/ES** that don't leak couple PII.
4. **Extract and translate provider proposals** (mostly PDF, ES/CA) into
   the master budget.
5. **Produce day-of timelines** in EN, branded XLSX + PDF, with
   provider-filtered exports.
6. **Run a Hindu/Sikh wedding without forgetting cultural elements**.
7. **Hand a wedding to Núria for a day** without a 30-minute briefing call.

### Núria, Róisín, Jackie (planners / stylist / admin)
1. **See only the weddings I'm assigned to** with the same triage view.
2. **Ask the AI quick questions on WhatsApp** while running errands.
3. **See COI flags** (Roc 35) before recommending a provider.
4. **Get the next 2 hours of the wedding-day timeline pushed to my phone**
   on the day of the wedding.

### Master AI (the agent itself)
1. **Have a private conversation with each planner** that survives across
   in-app, email, and WhatsApp.
2. **Promote a chat to the team** when the planner says so.
3. **Only act on what's allowed** — RLS is honoured for every tool call.

## Top user stories (v1)

| ID | Story | Phase |
|---|---|---|
| US-01 | As Jennifer, I sign in with Google SSO and see my dashboard. | 1 |
| US-02 | As Jennifer, I create a couple project and add 5 sub-events. | 2 |
| US-03 | As Jennifer, I import a budget from `budget-tool.html` JSON and the totals match to the cent. | 3 |
| US-04 | As Jennifer, I paste a provider PDF and the AI extracts line items into the budget at ≥90% accuracy. | 3 |
| US-05 | As Jennifer, I open the in-app Master AI panel and ask "what's Sham & Shwan's next deadline?" — get a correct answer from live DB. | 3.5 |
| US-06 | As Jennifer, I connect my Gmail and replies to couples appear as drafts in my own sent folder. | 4 |
| US-07 | As Jennifer, I forward a couple email to `ai@crystalevents.eu` and the AI files it to the correct comm log. | 4 |
| US-08 | As Núria, I import a seating plan JSON from `seating-planner.html` and the visual diff is zero. | 5 |
| US-09 | As Jennifer, I generate three RFQs (catering CA, photo ES, florist CA) and the PII-leakage check is green. | 6 |
| US-10 | As Jennifer, I send a WhatsApp message to the CE business number from my own phone — the AI treats it as a private command, not a couple comm. | 6 |
| US-11 | As Jennifer, I tell the AI on WhatsApp "schedule venue visit Wednesday PM" — the event appears in my Google Calendar within 30 seconds. | 6.5 |
| US-12 | As Jennifer, I regenerate the Sham & Shwan day-of timeline and ≥90% of cells match the golden xlsx. | 7 |
| US-13 | As Jackie, on wedding day at 09:00 I receive a WhatsApp digest of the next 2 hours with my contacts. | 7 |
| US-14 | As Jennifer, an external GDPR reviewer signs off on the data map and retention. | 8 |

## Success metrics

- Time from "couple's first email" to "structured brief saved" ≤ 5 min
  (was 30+ min manually).
- ≥90% line-item accuracy on AI proposal extraction (vs Sham & Shwan
  golden fixture).
- ≥85% precision on automated comm-log flag tagging.
- 0 PII-leakage incidents in provider-facing AI output (CI gate).
- ≥1 real wedding run end-to-end through workspace + email + WhatsApp
  before v1 sign-off.

## Out of scope for v1

- Couple-facing portal
- E-signature (DocuSign/HelloSign integration)
- Telegram bot
- Inbound ingestion from Slack
- Automatic cross-system FX hedging
- Mobile native apps (PWA only)

## Non-goals

- Replacing planner judgement. AI proposes; planner reviews and confirms.
- Becoming a generic event-planning SaaS. The app encodes Crystal Events'
  way of working — including its restrictions (no posting without consent,
  COI flags, Hindu/Sikh defaults).
