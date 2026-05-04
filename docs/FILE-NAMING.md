# File naming and Storage paths

The prompt library uses a folder convention like
`01-couples/[COUPLE-NAME]/brief.md`. The app translates this convention
to Supabase Storage paths so exports remain compatible with planner
mental models.

## Storage bucket layout

```
crystal-events/
├─ couples/
│  └─ <couple_public_id>/
│     ├─ brief.md
│     ├─ contract/
│     │  └─ v<n>-EN.pdf, v<n>-ES.pdf
│     ├─ master-budget/
│     │  └─ v<n>.xlsx, v<n>.json
│     ├─ visit-agendas/
│     │  └─ <date>.pdf
│     ├─ proposals-from-providers/
│     │  └─ <provider_slug>/<received_date>.pdf
│     ├─ rfqs/
│     │  └─ <provider_slug>/<sent_date>.{txt,md}
│     ├─ guest-list/
│     │  └─ v<n>.xlsx
│     ├─ seating-plan/
│     │  └─ v<n>.json, v<n>.pdf
│     ├─ day-of-timeline/
│     │  └─ v<n>.{xlsx,pdf}
│     ├─ collateral-timelines/
│     │  └─ <event_kind>-v<n>.{xlsx,pdf}
│     ├─ passports/  (encrypted; deleted T+30)
│     ├─ payment-proofs/
│     │  └─ <milestone_public_id>.pdf
│     └─ correspondence/
│        └─ <comm_log_public_id>.{eml,txt}
│
├─ providers/
│  └─ <provider_public_id>/
│     ├─ portfolio/
│     ├─ contracts-with-us/
│     └─ documents/
│
├─ voice-notes/
│  └─ <uuid>.{mp3,m4a,ogg}    (purged 90d post-wedding)
│
├─ exports/
│  └─ <team_member_public_id>/<yyyy-mm-dd>/<file>
│
└─ ai-runs/
   └─ <ai_run_public_id>.json   (input/output snapshot for audit; 13mo)
```

## File name rules

- ASCII only; spaces become `-`. The `slugify` helper in
  `packages/ui/src/format.ts` is the single source.
- **No surnames** in any path that may be exported or shared with a
  provider. `<couple_public_id>` (UUID) is the directory, not
  `Smith-Jones`.
- Versioned files use `v<n>` (`v1`, `v2`); the `n` is the
  `document_version.version_number`.
- Date-stamped files use ISO `YYYY-MM-DD`.

## Display name vs file name

- **Display name** (what planners see in the UI): "Master Budget — v3
  (12 May 2026)".
- **File name** (what's stored / downloaded): `master-budget-v3.xlsx`.
- The mapping is owned by the export layer, not by the user.

## Migration from the prompt library

Old prompt instruction:

```
01-couples/Sham-Shwan/brief.md
```

Becomes:

```
crystal-events/couples/<sham-shwan-uuid>/brief.md
```

The folder convention is preserved logically (couple → documents) but
made surname-free for storage. Display still shows "Sham & Shwan".
