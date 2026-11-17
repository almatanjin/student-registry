# Proposal

## Why

The staff Programmes page shows each programme as a plain white card, with the annual fee in small grey text next to the code and the modules as a bare list, so the key figures are hard to spot.
The cards also sit close together, and the page does not match the coloured badges now used on the Assessments, Results, and Marksheet pages.
A light tidy makes the annual fee and the fee plan easy to read at a glance, without changing what the page shows.

## What Changes

- Add more space between the two programme cards, and inside each card between the programme heading, the annual fee, the fee plan, and the modules, with a thin divider above the fee plan and above the modules.
- Show the programme code as a coloured badge above the programme name, taking yellow, purple, sky, blue, and green in turn down the page.
- Show the annual fee as its own large figure under an "Annual fee" label.
- Title the fee plan "Fee plan · N instalments" and end its table with a "Total" row that adds up the instalment amounts.
- Show each module as a pill holding its code and title, alternating blue and green within each programme (first blue, second green, and so on).
- Keep the page title, its description, the order of programmes, the fee plan columns, and the read-only nature of the page.

Out of scope: student counts or other figures that need new data, editing programmes, fee plans, or modules, a fee plan timeline, and changes to any other page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-fees`: adds a requirement for how the staff Programmes page presents each programme's annual fee, fee plan total, and modules.
  The existing "Programmes define an annual fee in instalments" requirement, defined in the `build-registry-module` change, stays as it is.

## Impact

- **UI:** `src/app/staff/programmes/page.tsx` only; it reuses `cardColour`, `Pill`, and the shared table parts.
- **Tests:** Playwright tests for the new scenarios.
  The existing "Programme fee plan" check in `e2e/student-fees.spec.ts` counts the MSc fee plan's rows, so it is updated for the new Total row.
- **Docs:** `docs/manual-testing.md` and the README's Programmes line are updated.
- **No database, API, or data-loading changes.**
