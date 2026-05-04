# Jewish weddings — operational checklist

Source of truth for `prompts/jewish-ceremony-check.md` and
`wedding_project.is_jewish`.

## Pre-wedding events

| Event | When | Notes |
|---|---|---|
| Aufruf | Shabbat before | Bridegroom called to Torah; usually at the couple's home synagogue, not in Spain. |
| Mikveh | Days before | Bride visits ritual bath. Requires kosher mikveh access — limited in Catalonia; couples often handle pre-trip. |
| Tisch | Wedding day, before ceremony | Groom's gathering; food and singing. |
| Bedeken | Just before chuppah | Veiling of the bride. |

## Ceremony essentials

- **Chuppah** — canopy on four poles. Florist must have prior experience.
- **Ketubah** — marriage contract. Either brought by couple or
  hand-calligraphed pre-trip.
- **Rabbi** — usually couple's home rabbi travels; if local, refer via
  Barcelona Jewish community (very small — book early).
- **Glass breaking** — at the end. Provide a wrapped glass / bulb;
  outdoor surface that won't damage shoes.
- **Seven blessings (Sheva B'rachot)** — sometimes split among
  significant guests; requires planning and printed cards.
- **Yichud room** — private room for couple immediately after ceremony
  (10–15 min).

## Catering — kosher levels

Three tiers in order of strictness:

1. **Strict kosher with rabbinical supervision (`hashgacha`)** —
   requires Mashgiach on-site, kosher kitchen or full koshering, kosher
   meat brought in. Very few Catalan caterers can deliver this; budget
   accordingly.
2. **Kosher-style** — no pork, no shellfish, no mixing dairy and meat,
   but no rabbinical certification. Most common at HNW destination
   weddings.
3. **Mostly observant guests, less observant catering** — catering staff
   briefed; clear labelling of dairy/meat; vegetarian fall-back for
   strictly-observant guests.

The couple decides; the AI must not assume tier 2 by default — ask.

## Shabbat constraints

- Wedding cannot start before three stars after sundown on Saturday in
  Catalan summer (~22:30 in June). Plan reception start accordingly.
- Friday weddings end before sundown — uncommon but possible.
- Observant guests don't travel by car / use electronics on Shabbat;
  accommodation must be walking distance from the venue if any guests
  are observant.

## Logistics that frequently break

- **Kosher meat** — typically imported from Madrid or Marseille;
  4-week lead time.
- **Mashgiach** — often flown in; accommodation + flights additional cost.
- **Sheva B'rachot dinners** — for the week after the wedding; usually
  back home, but some couples want one in Barcelona.
- **Sound** — observant guests may not use a band on Shabbat; if the
  reception is Saturday night, music starts after Havdalah.

## Required AI checks

Whenever `is_jewish = true`:

1. Run `prompts/jewish-ceremony-check.md` against the current brief.
2. Surface gaps with `CULTURAL` flag:
   - Kosher tier not confirmed by T-90 days
   - Rabbi not confirmed by T-90 days
   - Chuppah florist with experience not confirmed by T-60 days
   - Ketubah arrangement not confirmed by T-60 days
   - Shabbat-compatible scheduling not validated
3. Auto-create `ceremony_checklist` (`kind='jewish'`) pre-populated.

## What we don't try to do

- We don't mediate religious decisions. If the couple says "kosher-style
  is fine", that's their call; we don't advise otherwise.
- We don't accept "we'll figure out the rabbi closer to the date" past
  T-60 days; the AI must escalate to Jennifer at T-90.
