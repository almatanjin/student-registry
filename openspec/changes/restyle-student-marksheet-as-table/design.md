# Design

## Context

`src/app/student/marksheet/page.tsx` loads `getStudentResults(studentId)`, which already returns every module in code order with `released`, and for released modules each assessment's title, grade, and classification.
Today each module is a `Card` with `role="region"` named by its code and title, holding its own `Table`.
The Playwright helpers in `e2e/student-results.spec.ts` (`moduleCard`) and `e2e/journey.spec.ts` find a module with `getByRole("region", { name: /^CODE / })` and then its rows by name.
Card colours already live in `src/components/card-colours.ts` (`cardColour(position)`), and `ClassificationBadge` in `src/components/result-badges.tsx` maps each classification to a `Pill` tone.
The approved look is mockup C from the explore session: one transcript table, a coloured module code badge, and a bands legend under the title.

## Goals / Non-Goals

**Goals:**
- One table markup that gives the module-column layout on wider screens and the heading-row layout on phones, switched by CSS only.
- Each module stays a named group, so tests and screen readers can still scope rows to a module.
- The legend's thresholds and colours come from the same source as the grades and pills in the table.

**Non-Goals:**
- No change to `getStudentResults` or the data the page loads.
- No change to the staff marksheet or results pages, or to `ClassificationBadge`'s look.

## Decisions

### One `<tbody>` per module, named by the module

The table has one `<thead>` and one `<tbody>` per module, with `aria-label` set to the module's code and title, for example "CS101 Programming Fundamentals".
A named `<tbody>` exposes the `rowgroup` role with that name, so the test helper becomes `getByRole("rowgroup", { name: /^CS101 / })` and the rest of each test (rows by name, "Results not yet released") stays the same.

Alternative considered: keeping a `region` per module by wrapping each module in its own table.
Rejected because separate tables cannot share column widths, which breaks the transcript look.

### Both layouts in the same rows, switched at `md`

Each module's `<tbody>` holds:

1. A heading row with one `<th scope="rowgroup" colSpan={3}>` showing the code badge and module name, shown below `md` and hidden from `md` up (`md:hidden`).
2. Its assessment rows.
   The first assessment row also starts with a `<th scope="rowgroup" rowSpan={n}>` holding the code badge above the module name, hidden below `md` (`hidden md:table-cell`).
3. For an unreleased module, a single row in place of the assessment rows: the same rowspan module cell (with `rowSpan={1}`), then one cell with `colSpan={3}` reading "Results not yet released" with the clock icon.

The `<thead>` "Module" header cell is also `hidden md:table-cell`.
`display: none` removes the hidden cells from the accessibility tree too, so each width exposes exactly one copy of the module name.
`md` (768px) matches where the student assessment card grid already changes from one column to two.

Alternative considered: rendering two tables and hiding one per breakpoint.
Rejected because it duplicates every grade in the page source and in tests that read the HTML.

### Module code badge uses `cardColour`

The module at position `i` in the table takes `cardColour(i).badge` for its code badge, the same badge style as the assessment and staff result cards.
Only the badge is coloured; rows stay on the page background so the grades are easy to scan.

### One list of grade bands in the domain

`src/domain/results.ts` gains `CLASSIFICATION_BANDS`, ordered from lowest to highest, each with a classification and its lowest grade: Fail 0, Pass 40, Merit 60, Distinction 70.
`classify` reads the list instead of its hard-coded numbers, and a unit test checks the existing boundary scenario still holds.
The legend label is built from the list: the lowest band reads "Fail <40" (the next band's minimum), and the others read "Pass 40+", "Merit 60+", "Distinction 70+".

### Legend component reuses the classification tones

`result-badges.tsx` exports its classification-to-tone mapping.
A new `GradeBandsLegend` in `src/components/grade-bands-legend.tsx` renders "Bands:" followed by a `<ul aria-label="Grade bands">` with one `Pill` per band in that tone.
The page passes it as the `PageHeader` `description`, which replaces the old sentence and keeps the existing header spacing.
The legend is shown whenever the table is shown, and is left out with the "No modules yet" empty state.

## Risks / Trade-offs

- [The "Results appear once released" sentence is removed] → Each unreleased module still reads "Results not yet released" in its own row, so students still learn why grades are missing.
- [Long module names in the Module column could squeeze the other columns] → The Module column wraps text and has a set share of the width; a Playwright check at 768px and 1280px with the longest seeded module name confirms nothing overflows.
- [Colour alone links legend and pills] → Each pill and legend item also shows its classification name as text.
- [The `student-results` main spec does not exist yet] → This delta only adds requirements; sync and archive it after `build-registry-module` is archived, so the capability already exists.
