# Tasks

## 1. Countdown and missed-deadline pill

- [x] 1.1 Add `deadlineCountdown(deadline, today, timeZone)` in `src/domain/deadlines.ts`, and verify unit tests for "Future deadline", "Deadline tomorrow", "Deadline today" (both later today and earlier today), "Deadline yesterday", and "Past deadline", plus a deadline late in the evening UTC that falls on the next calendar day in the app time zone
- [x] 1.2 Give `SubmissionBadge` an optional `deadlinePassed` prop that shows "Not submitted" in the red tone once the deadline has passed, and verify the assessment detail and staff pages still render the grey pill (they do not pass the prop)

## 2. Card colours and doodles

- [x] 2.1 Add the five card colour settings (light, accent, badge background, badge text) from the design table to `src/app/theme.css` with a short comment, map them to Tailwind colours in `src/app/globals.css`, and verify `npm run lint` and `npm run typecheck` pass and the staff dashboard tiles look unchanged in a screenshot
- [x] 2.2 Add the six doodle components (pencil, book, light bulb, paper plane, flask, star) in `src/components/doodles.tsx`, drawn with `currentColor` and rendered `aria-hidden`, and verify each renders in a screenshot

## 3. Assessment cards

- [x] 3.1 Build `AssessmentCard` in `src/components/assessment-card.tsx` and render the list on `src/app/student/assessments/page.tsx` as a `md:grid-cols-2 xl:grid-cols-3` grid, keeping the `Your assessments` list, the page title, description, and empty state, and verify Playwright tests for "Open assessment not yet submitted" and "Opening an assessment"
- [x] 3.2 Colour the cards yellow, purple, sky, blue, green in list order, and verify a Playwright test for "Six assessments" that compares each card's background against the colour settings in `theme.css` (creating a sixth assessment for the test if the seed has fewer)
- [x] 3.3 Verify Playwright tests for "Deadline passed without a submission" and "Deadline still ahead" using the seeded "Databases coursework" and "Normalisation exercise"
- [x] 3.4 Verify a Playwright test for "Screen reader" that the card link's accessible name contains only the card text, and that every doodle is hidden from the accessibility tree
- [x] 3.5 Verify Playwright tests for "Wide screen" (3 cards in the first row at 1280 px) and "Phone" (one card per row at 375 px with no sideways scroll)
- [x] 3.6 Run the existing Playwright tests that open an assessment from "Your assessments" (`assessment-submissions`, `journey`, `navigation`), and verify they pass without changes
- [x] 3.7 Take screenshots of the page at 1280 px, 900 px, and 375 px, check that long titles do not run under the doodle, every card in a row has the same height, and hover and keyboard focus are visible, and fix any visual issue found

## 4. Documentation and full check

- [x] 4.1 Update the student assessments part of `docs/manual-testing.md` for the card grid, colours, countdown, and red "Not submitted" pill, and verify every label it mentions appears on the page
- [x] 4.2 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` before syncing this change, so the `assessment-submissions` capability exists to add to.
- Sync and archive this change after review.
