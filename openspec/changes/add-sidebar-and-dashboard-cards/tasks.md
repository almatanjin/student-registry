# Tasks

## 1. Theme and assets

- [x] 1.1 Add the sidebar and tile colour settings to `src/app/theme.css` with a short comment, map them to Tailwind colours in `src/app/globals.css`, and verify `npm run lint` and `npm run typecheck` pass
- [x] 1.2 Create `public/pen-mark.svg` (the logo with `viewBox="-1 -1 66 66"`, paths unchanged) and verify it renders only the coloured circles in a browser and loads with status 200 while signed out

## 2. Theme colours

- [x] 2.1 Set the button settings in `src/app/theme.css` to the logo blue (`#0269AF`, hover `#01568F`, white text), set `--ring` to the same blue and `--destructive` to `#B31B1A` in `src/app/globals.css`, and verify with a screenshot that "Add student" and "Sign in" render in the logo blue
- [x] 2.2 Add the seven tone settings (`--app-tone-*` and `--app-tone-*-text`) to `theme.css`, map them to Tailwind colours, give `Pill` a `tone` prop, and move every badge in `status-badge.tsx`, `assessment-badges.tsx`, `result-badges.tsx`, and `fees.tsx` to the tone table in design.md decision 6, and verify a Playwright test that pills across the student list, an assessment, module results, and a fees page each render the background of their tone setting (comparing against `theme.css` rather than against each other, so the test does not depend on which seeded statuses earlier tests changed)
- [x] 2.3 Switch the late and overdue highlights (assessment late row and count, the student's late notice, the grade-change warning, overdue instalment rows, and the overdue box) to the yellow and red tones, and verify with screenshots of an assessment with a late submission and an overdue student's fees page
- [x] 2.4 Show `public/pen-mark.svg` and "Student Registry" centred above the sign-in card and title the card "Sign in", update existing tests that look for the old title, and verify a Playwright test for "Opening the sign-in page"

## 3. Sidebar shell

- [x] 3.1 Build `SidebarContent` (PEN mark, "Student Registry", role, `Main` navigation with icons by name, footer with email, "Signed in as ...", "Change password", and "Sign out") and the desktop `AppShell` layout, give the staff and student layouts their icon names, and verify Playwright tests for "Staff sidebar", "Student sidebar", "Page inside a section", and "Signed-in footer" at desktop width
- [x] 3.2 Truncate the footer email with a `title` holding the full address, and verify a Playwright test for "Long email" using a newly created student with a long email
- [x] 3.3 Add the phone top bar and the `<dialog>` menu with "Menu" and "Close menu" buttons, closing on Escape and after navigation, and verify Playwright tests for "Opening the menu", "Choosing a page closes the menu", and "Closing without choosing" at a 375 px wide viewport
- [x] 3.4 Run the existing Playwright suite, and verify every test that uses the `Main` navigation, "Change password", or "Sign out" passes without changes
- [x] 3.5 Show the sidebar on the change-password page for a voluntary change (not for a forced one), remove the now redundant "Back to the registry" link, move the sign-in and forced change-password cards up from the exact centre, and verify Playwright tests for "Change password page" and "Forced change has no sidebar"

## 4. Dashboard figures

- [x] 4.1 Implement `getDashboardSummary` in `src/server/dashboard/service.ts` with the students-by-status and overdue counts, and verify integration tests for "Mixed statuses", "Students overdue", and "Nobody overdue"
- [x] 4.2 Add the fees collected figure, and verify integration tests for "Part collected", "Almost fully paid", "Nothing billed", and "After recording a payment"
- [x] 4.3 Add the results to publish figure using `missingGrades()`, and verify integration tests for "Complete and incomplete results", a module with no assessments not being counted, and "Publishing clears the count"

## 5. Dashboard cards

- [x] 5.1 Build `StatTile` and render the four tiles on the staff dashboard above the overdue table (with `id="overdue-balances"` on its card), and verify a Playwright test that the four tiles show the seeded figures: 4 enrolled with "1 deferred, 1 withdrawn, 1 completed", an overdue count equal to the number of rows in the overdue table (which seeded students are overdue depends on the seed date), a fees percentage between 0% and 100%, and a results count matching the complete Pending results on the Results pages
- [x] 5.2 Verify Playwright tests for "Opening the enrolled list", the Overdue balances tile jumping to the table, and the Results to publish tile opening the results page
- [x] 5.3 Take screenshots of every staff and student page and the sign-in page at 1280 px and 375 px wide, check the tiles wrap two per row on phones, every pill and button uses the logo palette, and nothing overflows (including the student payment history table on phones, which runs against its card edge today), and fix any visual issue found

## 6. Documentation and full check

- [x] 6.1 Update the "What it does" section of `README.md` and the navigation, dashboard, and look-and-feel parts of `docs/manual-testing.md` for the sidebar, phone menu, four cards, sign-in brand, and the button and tone settings in `theme.css`, and verify every path and label they mention exists in the code
- [x] 6.2 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` and `add-password-change` before this change, so the main specs exist in order.
- Archive this change after review.
