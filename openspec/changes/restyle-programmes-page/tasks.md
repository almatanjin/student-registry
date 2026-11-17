# Tasks

## 1. Programme cards

- [x] 1.1 Show the coloured programme code badge, the name, and the "Annual fee" figure on each card in `src/app/staff/programmes/page.tsx`, and verify a Playwright test for "Programme card heading" that also compares each badge's background against the colour settings in `theme.css`
- [x] 1.2 Title the fee plan "Fee plan · N instalments" and add the Total row, update the row count in the existing "Programme fee plan" check in `e2e/student-fees.spec.ts` for the Total row, and verify Playwright tests for "Fee plan total" and "Programme fee plan"
- [x] 1.3 Show the modules as alternating blue and green pills, and verify a Playwright test for "Module pills" that compares each pill's background against the blue and green pill tones
- [x] 1.4 Widen the grid gap and add the section spacing and dividers, and verify Playwright tests for "Wide screen" at 1280 px and "Phone" at 375 px with no sideways scroll
- [x] 1.5 Take screenshots of the page at 1280 px, 768 px, and 375 px, check the spacing, badges, pills, and Total row against the approved mockup, and fix any visual issue found

## 2. Documentation and full check

- [x] 2.1 Update the Programmes part of `docs/manual-testing.md` and the README's Programmes line, and verify every label they mention appears on the page
- [x] 2.2 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` before syncing this change, so the `student-fees` capability exists to add to.
- Sync and archive this change after review.
