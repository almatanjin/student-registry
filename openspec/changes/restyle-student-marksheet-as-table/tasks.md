# Tasks

## 1. Grade bands

- [x] 1.1 Add `CLASSIFICATION_BANDS` to `src/domain/results.ts` and make `classify` read it, and verify the unit test for "Classification boundaries" (39, 40, 59, 60, 69, 70) still passes
- [x] 1.2 Add a pure helper that turns the bands into legend labels, and verify a unit test that it returns "Fail <40", "Pass 40+", "Merit 60+", and "Distinction 70+" in that order
- [x] 1.3 Export the classification-to-tone mapping from `src/components/result-badges.tsx`, build `GradeBandsLegend` in `src/components/grade-bands-legend.tsx`, and verify `npm run lint` and `npm run typecheck` pass

## 2. Marksheet table

- [x] 2.1 Update the module helper in `e2e/student-results.spec.ts` and `e2e/journey.spec.ts` to find a module by its named row group instead of its region, and verify those tests fail against the current card page
- [x] 2.2 Render `src/app/student/marksheet/page.tsx` as one table with a named `<tbody>` per module, the rowspan Module cell from `md` up, and the coloured code badge, and verify Playwright tests for "Released module on a wide screen" and "Modules in code order", plus the updated tests from 2.1
- [x] 2.3 Render unreleased modules as one "Results not yet released" row, and verify Playwright tests for "Pending module row" and the existing "Withheld module" test
- [x] 2.4 Add the phone heading row and hide the Module column below `md`, and verify a Playwright test for "Phone" at 375 px, including no sideways scroll
- [x] 2.5 Colour the module code badges with `cardColour`, and verify a Playwright test for "Two modules" that compares each badge's background against the colour settings in `theme.css`
- [x] 2.6 Keep the "No modules yet" empty state with no table and no legend, and verify a Playwright test for "No modules" (creating a Student with no modules for the test if the seed has none)

## 3. Legend on the page

- [x] 3.1 Show `GradeBandsLegend` as the page header description in place of the old sentence, and verify Playwright tests for "Legend shown" and "Legend matches the table"
- [x] 3.2 Take screenshots of the page at 1280 px, 768 px, and 375 px, check the Module column wraps long names, rows line up, and the legend wraps cleanly on phones, and fix any visual issue found

## 4. Documentation and full check

- [x] 4.1 Update the student marksheet part of `docs/manual-testing.md` for the table, phone layout, and bands legend, and verify every label it mentions appears on the page
- [x] 4.2 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` before syncing this change, so the `student-results` capability exists to add to.
- Sync and archive this change after review.
