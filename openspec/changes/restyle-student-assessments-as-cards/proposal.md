# Proposal

## Why

The student Assessments page lists every assessment as a plain white row, one per line, so it looks bare and makes students read each row to find what is due next.
Students should be able to see their assessments at a glance, in a page that feels friendly, the way the staff dashboard does with its coloured tiles.

## What Changes

- Show each assessment on `/student/assessments` as a coloured card in a grid: 3 cards per row on wide screens, 2 on tablets, and 1 on phones.
- Give each card one light background colour, taking yellow, purple, sky, blue, and green in turn down the list.
  The deep shade of the same colour is used only for small accents: the module code badge, the calendar icon, the "View" link, and the doodle.
- Add a faint student-themed line doodle (pencil, book, light bulb, paper plane, flask, star) in the top-right corner of each card.
  The doodles are decoration only and hidden from screen readers.
- Each card shows the module code, the assessment title, the module name, the deadline with a countdown ("In 10 days", "Due today", "Due tomorrow", "7 days ago"), the submission pill, the Open or Closed pill, and "View".
- The "Not submitted" pill turns red once the deadline has passed, so a missed deadline stands out.
- The whole card is a link to the assessment, as each row is today.
- Add a sky colour (light and deep) to the theme settings, taken from the logo's light blue.
- Keep the page title, its description, the earliest-deadline-first order, and the empty state as they are.

Out of scope: summary cards or other figures above the list, grouping into "Coming up" and "Past deadline", filters or search, choosing card colours by module, and restyling the staff assessment pages or any other page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `assessment-submissions`: adds requirements for how the student assessment list is laid out and what each card shows.
  The existing "Students see their assessments" requirement, defined in the `build-registry-module` change, stays as it is.

## Impact

- **UI:** `src/app/student/assessments/page.tsx` renders a card grid instead of rows; a new card component and a small set of doodle drawings are added under `src/components/`.
- **Theme:** new card colour settings in `src/app/theme.css` and `src/app/globals.css` for the five colours, including the new sky colour.
  The existing tile colours used by the staff dashboard are not changed.
- **Badges:** `src/components/assessment-badges.tsx` gains a way to show "Not submitted" in red after the deadline.
- **Domain:** a small pure function works out the countdown text from the deadline and today's date in the app time zone.
- **Tests:** unit tests for the countdown text; Playwright tests for the card grid, card contents, the red missed-deadline pill, and the phone layout.
  Existing tests that open an assessment from the "Your assessments" list keep working because the list name and links stay.
- **Docs:** `docs/manual-testing.md` is updated for the new page.
- **No database or API changes.**
