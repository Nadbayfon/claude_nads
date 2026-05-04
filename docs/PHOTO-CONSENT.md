# Photo & content consent

Crystal Events does **not** post client images, behind-the-scenes
content, or wedding submissions without explicit written authorisation
from the couple. This is a defining feature of the brand and overrides
default-on social-media behaviours.

## `photo_consent_level` enum

Stored on `couple`. The AI reads this flag and refuses to produce
content that exceeds it.

| Level | Meaning | What's allowed |
|---|---|---|
| `none` | No reuse of any wedding imagery. | Internal records only. |
| `internal` | Internal team reference only (training, internal portfolio). | Team-only Drive folder. No website, social, blog, press. |
| `web` | Allowed on the Crystal Events website (`crystalevents.eu`). | Selected images for the public portfolio. No social. No blog submissions. |
| `press` | Allowed for editorial submissions (blogs, magazines). | Selected images submitted to specific publications named in the consent form. |

The `internal` level is **not the default**. The default is `none` until
the couple actively opts in via signed consent.

## What the AI is allowed to draft

| Task | `none` | `internal` | `web` | `press` |
|---|---|---|---|---|
| Draft a private internal review | ✅ | ✅ | ✅ | ✅ |
| Caption images for the planner's offline reference | ✅ | ✅ | ✅ | ✅ |
| Draft Instagram caption | ❌ | ❌ | ❌ | ❌ — Crystal Events policy is no Instagram for weddings unless specifically requested |
| Draft a website portfolio entry | ❌ | ❌ | ✅ | ✅ |
| Draft a wedding-blog submission | ❌ | ❌ | ❌ | ✅ |
| Draft a press release | ❌ | ❌ | ❌ | ✅ |
| Use surnames in any draft above | ❌ in all cases | ❌ | ❌ | ❌ |

The AI's tool registry **does not expose** a "post to Instagram" tool.
Adding one in v1 would require an ADR and a separate consent capture
flow.

## Consent capture

Captured at contract signing via a tickbox set on `couple_brief.cultural_flags`
and persisted to `couple.photo_consent_level`. Consent can be revoked
at any time; revocation triggers:

1. `photo_consent_level` set to `none`.
2. AI immediately refuses any new content drafts above `none`.
3. Already-published content reviewed manually by Jennifer for takedown
   where feasible.

## Audit

Every change to `photo_consent_level` writes an `audit_log` row with
`action='photo_consent_change'` and the previous + new value.

## Reading this from prompts

Prompts that may produce shareable content (`weekly-status-email.md`,
hypothetical future blog/social prompts) must include a guard line:

> If the input includes `photo_consent_level`, refuse any social,
> press, or blog draft if the level is `none` or `internal` and emit a
> `[CONSENT BLOCKED]` marker explaining which level would be required.

Code-side, the feature agent enforces the same rule before persisting.
