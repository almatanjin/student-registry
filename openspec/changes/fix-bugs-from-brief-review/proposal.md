# Proposal

## Why

A full review of the project against the assessment brief found three bugs.
Adding an assessment to a module whose results are already Published leaves those results Published but incomplete, so the student's marksheet looks complete while it silently leaves out the new assessment, and its grade later appears without anyone publishing it.
The student list reads "1 student match these filters".
At 1024 px wide, a common laptop width, several staff tables cut off their last column because the sidebar takes part of the width.

## What Changes

- When staff create an assessment in a module, every Published result for that module returns to Pending in the same step.
  Withheld and Pending results stay as they are.
  Students then see "Results not yet released" for that module until staff grade the new assessment and publish again.
- The new-assessment form warns staff, once they choose a module with Published results, how many of them will return to Pending.
- The student list count uses "matches" for one student: "1 student matches these filters".
- Pages beside the sidebar fit their content area at 1024 px wide and above, with no table cutting off a column:
  - the dashboard's overdue balances table,
  - the staff fees page's instalments table,
  - a module's results table, including its Actions column.
- Submitted file names on an assessment's submissions table wrap between words or at hyphens, never in the middle of a word.

Out of scope: moving assessments between modules (the module cannot be edited today), deleting assessments, and the product questions raised in the same review (mid-year billing, counting withdrawn students as missing).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-results`: adds a requirement that adding an assessment returns the module's Published results to Pending, with a warning first.
- `student-records`: adds a requirement for the wording of the student list's count.
- `app-navigation`: adds a requirement that pages beside the sidebar fit their content area at 1024 px and above.

All three capabilities are defined in changes that are not archived yet (`build-registry-module` and `add-sidebar-and-dashboard-cards`), so these deltas only add requirements.

## Impact

- **Server:** `createAssessment` in `src/server/assessments/service.ts` runs in a transaction that locks the programme's student rows, as publishing does, creates the assessment, and returns the module's Published results to Pending.
  A small query gives the number of Published results per module for the form.
- **UI:** `src/app/staff/assessments/assessment-form.tsx` shows the warning; `src/app/staff/students/page.tsx` fixes the wording; the app shell's content area becomes a CSS container so the dashboard, staff fees, module results, and assessment pages change layout by the space they actually have.
- **Tests:** integration tests for the results reset and the lock; Playwright tests that first reproduce each bug.
- **Docs:** README publishing rules and `docs/manual-testing.md`.
- **No database schema or API shape changes.**
