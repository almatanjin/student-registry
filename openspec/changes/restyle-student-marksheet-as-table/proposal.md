# Proposal

## Why

The student Marksheet page shows each module as a separate plain white card with its own small table, so students cannot read all their results in one place.
It is also the last student page still in the old plain style, now that Assessments uses coloured cards.
Students should see their marksheet as one compact transcript that reads like a real record of their results.

## What Changes

- Show every module on `/student/marksheet` in one table with the columns Module, Assessment, Grade, and Classification.
- On wider screens, the Module cell spans all of that module's assessment rows and shows the module code above the module name.
- On phones, the Module column is not shown; instead each module starts with a full-width heading row holding its code and name, and its assessment rows follow underneath with Assessment, Grade, and Classification.
- Give each module code a coloured badge, taking yellow, purple, sky, blue, and green in turn down the table, using the existing card colour settings.
- A module whose results are not released shows one row reading "Results not yet released" in place of its assessments.
- Replace the description under the page title with a grade bands legend: "Fail <40", "Pass 40+", "Merit 60+", and "Distinction 70+", each coloured like the matching classification pill in the table.
- Keep the page title "Your marksheet", the module order (by module code), and the empty state when the Student has no modules.

Out of scope: module averages or overall marks, the Student's name, student number, or programme on this page, a print button, and any change to the staff results or marksheet pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-results`: adds requirements for how the student marksheet is laid out at each screen width and for the grade bands legend.
  The existing "Students see only published results" and "Grades are classified" requirements, defined in the `build-registry-module` change, stay as they are.

## Impact

- **UI:** `src/app/student/marksheet/page.tsx` renders one table instead of a card per module; a small grade bands legend component is added under `src/components/`.
- **Domain:** the classification thresholds in `src/domain/results.ts` become one named list that both `classify` and the legend read, so the legend can never disagree with the grades.
- **Badges:** `src/components/result-badges.tsx` shares its classification-to-colour mapping with the legend.
- **Tests:** a unit test that the legend bands match `classify`; Playwright tests for the desktop table, the phone layout, the legend, and unreleased modules.
  The existing marksheet tests in `e2e/student-results.spec.ts` and `e2e/journey.spec.ts` find each module by its region today, so their helper is updated to find the module's group of rows in the table instead.
- **Docs:** `docs/manual-testing.md` is updated for the new page.
- **No database or API changes**, and the page loads the same data as today.
