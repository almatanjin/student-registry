# Tasks

## 1. Adding an assessment reopens published results

- [x] 1.1 Write a failing integration test at `createAssessment` for "New assessment in a published module" and "Withheld result stays withheld", then run `createAssessment` in a transaction that locks the programme's students, creates the assessment, and returns the module's Published results to Pending, and verify the tests pass
- [x] 1.2 Write a failing integration test for "Publishing at the same moment" that runs a publish and a create concurrently many times, then confirm the lock order makes it pass, and verify no run leaves a Published result with a missing grade
- [x] 1.3 Write a failing Playwright test for "New assessment in a published module" that creates a CS101 assessment as staff and checks Alma's marksheet shows "Results not yet released" for CS101, and verify it passes after 1.1
- [x] 1.4 Load the Published count per module on the new-assessment page and show the warning on the form, and verify Playwright tests for "Warning before creating" and "No warning without published results"

## 2. Student list count

- [x] 2.1 Write failing Playwright tests for "One match" and "Several matches", fix the count wording in `src/app/staff/students/page.tsx`, and verify they pass

## 3. Pages fit beside the sidebar

- [x] 3.1 Write failing Playwright tests at a 1024 × 800 window for "Dashboard overdue table", "Staff fees page", "Module results table", and "Submitted file names", and verify each fails on the current pages
- [x] 3.2 Make `<main>` in `AppShell` a container and switch the dashboard overdue table to container sizes, and verify "Dashboard overdue table" passes
- [x] 3.3 Switch the staff fees page's two-column layout to a container size, and verify "Staff fees page" passes
- [x] 3.4 Switch the module results table's column toggles to container sizes and keep the Student ID on one line, and verify "Module results table" passes
- [x] 3.5 Make submitted file names wrap at hyphens or spaces only, and verify "Submitted file names" passes
- [x] 3.6 Take screenshots of the dashboard, a staff fees page, CS101 results, and Lab report 1 at 1024 px, 1280 px, and 375 px, check nothing is cut off and phone layouts are unchanged, and fix any visual issue found

## 4. Documentation and full check

- [x] 4.1 Add the reopening rule to the README's publishing assumptions and to `docs/manual-testing.md`, and verify the wording matches the form's warning
- [x] 4.2 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` and `add-sidebar-and-dashboard-cards` before syncing this change, so the `student-results`, `student-records`, and `app-navigation` capabilities exist to add to.
- Sync and archive this change after review.
