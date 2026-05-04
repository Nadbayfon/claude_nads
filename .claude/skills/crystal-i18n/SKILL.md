---
name: crystal-i18n
description: Catalan / Spanish / English locale catalogues, glossary, and CI lints. Enforces the rule that couple-facing strings are EN, provider-facing are CA/ES, planner UI is EN. Use when adding strings, reviewing translations, or debugging locale-leak bugs.
---

# crystal-i18n

## When to invoke

- New planner UI string lands.
- New couple-facing or provider-facing AI output template.
- A CI failure citing locale rules.
- Updating the glossary.

## Locale rules (recap from `docs/I18N.md`)

| Audience | Locale |
|---|---|
| Planner UI | `en` |
| Couple-facing AI output (briefs, weekly status, contracts EN half) | `en` |
| Provider-facing AI output (RFQs, follow-ups, contracts ES half) | `ca` (default) or `es` |
| Internal docs | `en` |

## Catalogues

`apps/web/locales/en.json` is the source. Other locales aren't
shipped for the UI in v1 (planners speak EN), but the structure is
ready.

```json
{
  "common.save": "Save",
  "common.cancel": "Cancel",
  "couple.brief.title": "Couple brief",
  "...": "..."
}
```

## ESLint rule — `crystal/no-bare-strings`

Forbids JSX text literals in components under `apps/web/app/**`.
Strings must come from `t("key")`. Exceptions for technical labels
(SQL keywords, log messages) are tagged with a `// i18n-ignore`
comment.

## Glossary (`packages/ai/src/glossary.ts`)

```ts
export const glossary = {
  // English → Catalan, Spanish
  "wedding planner": { ca: "wedding planner", es: "wedding planner" },
  "welcome dinner":   { ca: "sopar de benvinguda", es: "cena de bienvenida" },
  "provider proposal":{ ca: "pressupost del proveïdor", es: "presupuesto del proveedor" },
  "payment milestone":{ ca: "fita de pagament", es: "hito de pago" },
  "VAT":              { ca: "IVA", es: "IVA" },
  "wedding day":      { ca: "dia de la boda", es: "día de la boda" },
  "site visit":       { ca: "visita al lloc", es: "visita al lugar" },
  "open bar":         { ca: "barra lliure", es: "barra libre" },
  "florist":          { ca: "florista", es: "floristería" },
  "photographer":     { ca: "fotògraf", es: "fotógrafo" },
};
```

The `translate-brief` and `translate-proposal` agents are told (in
their prompts) to consult the glossary before paraphrasing. The
glossary is small on purpose — it captures the terms where Crystal
Events has a house preference; everything else is general translation.

## CI lints

### Couple-facing locale check

For files matched by:

```
apps/web/server/ai/(couple-intake|initial-proposal|weekly-status-email|translate-proposal).ts
```

…and any output file rendered into a couple-facing route:

- Check the output (when run on a fixture) is in EN. Heuristic: a
  language-detection library returns `en` with confidence ≥ 0.85.

### Provider-facing locale check

For files matched by:

```
apps/web/server/ai/(translate-brief|provider-followup).ts
```

…and any output destined for a provider:

- Output is in CA or ES, matching the provider's
  `provider.languages[]` preference.
- LanguageTool returns no major errors.
- Glossary terms appear in their CA/ES form, not EN.

### Surname leak (Phase 6 critical)

Run a pattern scan on every provider-facing output: any token
appearing in `couple.surnames_confidential` triggers a CI failure.

## Catalan vs Spanish — disambiguation

Default Catalan when:
- Provider has `ca` in `provider.languages[]`.
- Region is Catalonia (almost always for our scope).

Use Spanish when:
- Provider's only language is `es`.
- Couple explicitly requested Spanish documents.
- Document is the Spanish half of a bilingual contract.

The model must not silently switch to Spanish because it's
"easier" — that's a trust signal with Catalan providers.

## Don't

- Don't hand a Catalan-speaking provider a Spanish RFQ.
- Don't translate brand names, venue names, or proper nouns.
- Don't ship JSX text literals — use `t()`.
- Don't bypass the glossary for the listed terms.
