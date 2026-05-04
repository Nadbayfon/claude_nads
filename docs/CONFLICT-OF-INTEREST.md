# Conflict of interest — Roc 35 / Núria

Núria Font is both a Crystal Events planner and an external provider
through **Roc 35** (catering / venue). When Roc 35 is offered as an
option on a wedding where Núria is not the lead planner — or where
Núria *is* the lead planner and Roc 35 is being chosen — there is a
financial conflict that must be disclosed and acknowledged.

## How the system enforces it

1. **`provider.is_internal_conflict = true`** for the Roc 35 row.
2. **`team_member_external_provider_link`** ties Núria → Roc 35.
3. **`v_coi_flags` view** surfaces every wedding where a
   `budget_provider_option` references Roc 35 *and* the wedding's lead
   planner / assigned planners include Núria. Returned rows render an
   amber banner in the workspace.
4. **Confirming** a `budget_provider_option` for a flagged scenario is
   blocked at the database level. The trigger checks for a row in
   `coi_acknowledgement` matching `(team_member_id=Núria,
   provider_id=roc_35, wedding_project_id)` signed by the `owner` role
   (Jennifer).

## Acknowledgement flow

1. Banner appears with text:
   > Roc 35 (Núria's external venture) is in this wedding's options.
   > Confirming requires the owner's acknowledgement of the disclosed
   > conflict before payment milestones can be created.

2. Jennifer clicks "acknowledge" → opens a dialog:
   > I confirm that Núria's role in Roc 35 has been disclosed to the
   > couple, and that this option was selected on its own merits.

3. On confirm, a `coi_acknowledgement` row is written with
   `acknowledged_by = Jennifer's team_member_id`,
   `acknowledged_at = now()`.

4. The blocking trigger now allows the option to be confirmed.

## Reverse case

When Núria *is* the lead planner and someone else is choosing Roc 35
inside her wedding, the same flow applies — Jennifer still
acknowledges. We don't allow Núria to acknowledge her own conflict.

## Audit

`coi_acknowledgement` is append-only; the audit log additionally records
every banner display and every acknowledgement.

## What this is not

- It is not a moral judgement. Roc 35 is often the right choice on
  merit. The system records the disclosure so it's defensible later.
- It is not a soft guard. The DB trigger refuses to confirm without an
  acknowledgement; a planner cannot "skip" it from the UI.
- It is not a one-off. Every new wedding that lists Roc 35 needs its
  own acknowledgement; we don't carry forward.

## Communication to the couple

Crystal Events discloses the conflict in the proposal stage — the
`initial-proposal.md` prompt includes a clause when Roc 35 is in the
options shortlist. Wording:

> Crystal Events would like to disclose that Roc 35, listed as one of
> the options for [service category], is co-owned by Núria Font, who
> is also part of our planning team. Núria has no involvement in your
> planning if she is not your lead planner, and the option is offered
> on its own merits alongside two other independent options.
