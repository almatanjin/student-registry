# Design

## Context

`src/app/staff/programmes/page.tsx` loads `listProgrammeDetails()`, which already returns each programme's code, name, annual fee, fee plan (in sequence order), and modules (in code order).
Each programme renders as a `Card` in a `lg:grid-cols-2` grid with `gap-6`, holding a fee plan `<section aria-label="<name> fee plan">` with a table and a modules `<section aria-label="<name> modules">` with a plain list.
`e2e/student-fees.spec.ts` checks the MSc fee plan region and expects 3 rows (header plus 2 instalments).
`cardColour(position)` in `src/components/card-colours.ts` and the `Pill` tones in `src/components/status-badge.tsx` already supply the badge and pill colours.
The approved look is final mockup A from the explore session, with module pills alternating blue and green.

## Goals / Non-Goals

**Goals:**
- Match the approved mockup using only existing colour settings and components.
- Keep the fee plan and modules sections' accessible names, so tests and screen readers can still find them.

**Non-Goals:**
- No change to `listProgrammeDetails` or any data, API, or other page.

## Decisions

### Spacing

The grid gap grows from `gap-6` to `gap-8`.
Inside each card, the annual fee sits under the heading with a clear gap, and the fee plan and modules sections each start with `border-t` and matching top margin and padding, so the three parts read as separate blocks.

### Programme code badge from `cardColour`

The programme at position `i` uses `cardColour(i).badge` for its code badge, the same badge style as the other coloured pages.
The badge sits above the programme name, and the old "code · Annual fee" description line is removed.

### Annual fee figure

"Annual fee" is a small muted label above `money(programme.annualFeeMinor)` in a large, medium-weight figure.

### Fee plan title and Total row

The heading reads "Fee plan · N instalments", with "instalment" for a plan of one.
The table's first column header shows "#" on screen with "Instalment" as its accessible name, so the column stays clear to screen readers while matching the mockup.
The Total row sits in a `TableFooter` and sums the instalment amounts on the page.
It sums the instalments, so the row would show any mismatch with the annual fee figure above it instead of hiding it.

### Module pills

The modules `<ul>` keeps its section and becomes a wrapping row of `<li>` pills.
Each pill is a `Pill` with tone `blue` at even positions and `green` at odd positions within its programme, holding the code in monospace and the title.
The app's existing `blue` and `green` pill tones are used, which are a little lighter than the mockup's shades, so these pills look the same as every other pill in the app.

## Risks / Trade-offs

- [Blue and green pills mean "finished" and "done" elsewhere] → The Programmes page shows no status pills, and every module pill also shows its code and title, so the colour reads as decoration.
- [The Total row changes the fee plan's row count] → The existing test is updated to expect the Total row; the instalment rows are unchanged.
- [The `student-fees` main spec does not exist yet] → This delta only adds requirements; sync and archive it after `build-registry-module` is archived.
