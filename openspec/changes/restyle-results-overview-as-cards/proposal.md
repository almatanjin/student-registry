# Proposal

## Why

The staff Results page lists modules as plain bordered rows, so staff must open each module to find out whether anything needs publishing.
A simple coloured card per module, with one pill that says what the module needs next, makes the page match the student Assessments cards and shows where to act at a glance.

## What Changes

- Show each module on `/staff/results` as a coloured card in a grid: 2 per row on wider screens, 1 on phones.
- Cards take the same light colours as the student Assessments cards (yellow, purple, sky, blue, green) in turn down the list, with the deep shade for the code badge and "View results".
- Each card shows the module code, the module title, the programme name, the number of assessments, one status pill, and "View results".
- The status pill shows the first of these that applies:
  - "No assessments yet" (grey) when the module has no assessments
  - "No students yet" (grey) when the programme has no students
  - "N ready to publish" (blue) when N results are Pending and complete
  - "Waiting for grades" (grey) when some Pending results still miss a grade
  - "N withheld" (purple) when nothing is left to publish and N results are Withheld
  - "All published" (green) when every result is Published
- The whole card stays a link to the module's results page, and the list keeps its name "Modules".
- No doodles, no counts boxes, no progress bar, and no grouping by programme.

Out of scope: restyling the module results page (`/staff/results/[moduleId]`), filters or sorting on the overview, and any change to how results are published.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-results`: adds a requirement for the staff results overview cards and their status pill.

## Impact

- **UI:** `src/app/staff/results/page.tsx` renders cards; a new `ModuleResultCard` component under `src/components/`.
  The card colour list moves out of `assessment-card.tsx` into a shared module so both cards use one list.
- **Domain:** a pure function picks the pill text and tone from a module's counts.
- **Server:** a new results service function returns each module with its counts of ready, waiting, withheld, and published results.
  The dashboard's "Results to publish" count is rebuilt on the same counting, so the card total and the dashboard always agree.
- **Tests:** unit tests for the pill rules, integration tests for the counts and the dashboard total, and a Playwright spec for the cards.
- **Docs:** `docs/manual-testing.md` Results section.
- **No database or API changes.**
