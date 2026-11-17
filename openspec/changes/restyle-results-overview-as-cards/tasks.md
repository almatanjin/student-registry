# Tasks

## 1. Count results per module

- [x] 1.1 Add `moduleResultStatus` to `src/domain/results.ts` with unit tests for every pill rule and their order, and verify `npm test` passes
- [x] 1.2 Add `listModuleResultSummaries` to `src/server/results/service.ts`, with integration tests for ready, waiting, withheld, published, no students, and no assessments, and verify they pass
- [x] 1.3 Rebuild the dashboard's `countResultsToPublish` on `listModuleResultSummaries`, and verify `tests/integration/registry-dashboard/summary.test.ts` still passes unchanged

## 2. Module cards on the results overview

- [x] 2.1 Write the Playwright spec `e2e/results-overview.spec.ts` with one test per scenario in `specs/student-results/spec.md`, using the scenario names as titles, and confirm it fails
- [x] 2.2 Move `CARD_COLOURS` into `src/components/card-colours.ts`, use it in `AssessmentCard`, and verify `e2e/student-assessment-cards.spec.ts` still passes
- [x] 2.3 Add `ModuleResultCard` and render it from `src/app/staff/results/page.tsx` in a 2-column grid named "Modules", and verify `e2e/results-overview.spec.ts`, `e2e/student-results.spec.ts`, and `e2e/dashboard.spec.ts` pass
- [x] 2.4 Update the Results section of `docs/manual-testing.md` with the card layout, the pill rules, and the new files, and verify every path it names exists

## 3. Verify

- [x] 3.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration`, and `npm run test:e2e`, review the screenshots of the results overview on desktop and phone, and confirm all pass
