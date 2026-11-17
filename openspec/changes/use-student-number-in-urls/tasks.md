# Tasks

## 1. Look up a student by Student ID

- [x] 1.1 Add `getStudentByNumber(studentNumber)` to `src/server/students/service.ts`, returning the same view as `getStudent` and throwing `NotFoundError` for an unknown number or an internal id, and verify with an integration test in `tests/integration/student-records/`

## 2. Pages and links use the Student ID

- [x] 2.1 Write the Playwright spec `e2e/student-urls.spec.ts` with one test per scenario in `specs/student-records/spec.md`, using the scenario names as titles, and confirm it fails
- [x] 2.2 Rename `src/app/staff/students/[id]` to `[studentNumber]`, resolve the student with `getStudentByNumber` in the record, edit and fees pages, and pass `student.id` to services and client forms
- [x] 2.3 Build every link to these pages from `studentNumber`: the student list, the dashboard overdue list, the record's Fees and Edit buttons, the back links, and the `StudentForm` redirect, and verify `e2e/student-urls.spec.ts` passes
- [x] 2.4 Update `e2e/support/students.ts` and `e2e/password-change.spec.ts` so the value read from the URL is named as a Student ID, and verify those tests still pass
- [x] 2.5 Update the route tables and the steps that read a student from the URL in `docs/manual-testing.md`, and verify every path it names exists

## 3. Verify

- [x] 3.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration` and `npm run test:e2e`, review the screenshots of the student pages, and confirm all pass
