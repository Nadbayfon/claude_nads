# Hindu & Sikh weddings — operational checklist

Source of truth for `prompts/hindu-sikh-ceremony-check.md` and the
default value of `wedding_project.is_hindu_sikh`. ~25% of Crystal Events'
portfolio; Jennifer is recognised as a specialist in Catalonia.

## Hindu wedding — common collateral events

| Event | Day(s) before main | Notes |
|---|---|---|
| Welcome dinner | T-2 | Often informal; venue with open kitchen. |
| Haldi | T-1 morning | Turmeric paste applied to bride/groom. Outdoor or open-air. White/yellow attire; **stains** — provider must be briefed on linens. |
| Mehendi | T-1 afternoon | Henna application (2–6 hours). Seated, music, food. Requires Mehendi artist (often flown in). |
| Sangeet | T-1 evening | Music + dance + speeches. Sound, dance floor, open bar. |
| Baraat | Wedding morning | Groom's procession with horse / drums (`dhol`) / dancing. Requires permits in Catalan municipalities — **always check 4 weeks ahead**. |
| Ceremony | Wedding day | Under the **mandap**. **Agni** (sacred fire) may be required — fire-safety clearance with venue. **Pheras** (4 or 7 circles around the fire). |
| Reception | Wedding day | Often follows immediately or after a break. |
| Day-after brunch | T+1 | Often vegetarian; some families observe additional rituals. |

## Sikh wedding — Anand Karaj

- **Gurdwara** preferred for ceremony. If unavailable, the Guru Granth
  Sahib travels to the venue with strict protocols.
- **Granthi** (priest) leads the ceremony.
- **Lavan** — four hymns with circumambulation of the Guru Granth Sahib.
- **Langar** — communal vegetarian meal; often free / not "catered" in
  the conventional sense.
- **Kirtan** — devotional singing.
- Footwear off, heads covered, no smoking/alcohol in the ceremony space.

## Catering rules of thumb

- Default to vegetarian unless the family specifies otherwise.
- Check for Jain dietary needs (no root vegetables) — uncommon but
  catastrophic if missed.
- Halal preparation for Muslim relatives often required even at Hindu
  weddings.
- No beef. No pork at most weddings.
- Indian-trained chef strongly preferred for the cocktail/reception
  station; Catalan cuisine for the welcome dinner is fine and often
  appreciated.

## Music & sound

- Live `dhol` for Baraat (1–2 players, 30–60 min).
- DJ for Sangeet + Reception fluent in Bollywood / Punjabi tracks.
- Sound permits past 23:00 in Catalonia: confirm with venue and
  municipality.

## Décor essentials

- Mandap: 4 pillars + canopy. Florist must have prior experience.
- Stage / `chaupai`.
- Rangoli (often by family member).
- Dance floor (consider weight loading on outdoor venues).

## Logistics that frequently break

- **Baraat permit** — Catalan mossos / municipal police; horses require
  veterinary clearance; some town centres prohibit live animals.
- **Outdoor agni** — many masías have wood-beam ceilings; fire is a
  no-go indoors.
- **Multi-day catering staffing** — same provider must staff Welcome,
  Haldi/Mehendi, Sangeet, Wedding, Brunch unless explicitly split.
- **Hotel block** — Indian weddings often bring 60–150 international
  guests; secure rooms 12+ months out.

## Officiant options

- Couple brings their own pandit / granthi (most common for HNW couples).
- Local referral via Jennifer's network (requires advance notice).
- For symbolic ceremonies in Spain, the religious ceremony is decoupled
  from the civil registration (which is typically done in their home
  country before the trip).

## Required AI checks

Whenever `is_hindu_sikh = true`:

1. Run `prompts/hindu-sikh-ceremony-check.md` against the current brief.
2. Surface any of the following gaps with `CULTURAL` flag in the comm log:
   - Mandap not in budget by T-90 days
   - Vegetarian/halal not confirmed by T-60 days
   - Baraat permit not confirmed by T-30 days
   - Sangeet sound permit not confirmed
   - Dhol player not booked by T-45 days
   - Indian-experienced photographer not confirmed by T-90 days
3. Auto-create `ceremony_checklist` row (`kind='hindu'` or `'sikh'`)
   pre-populated from the items above.
