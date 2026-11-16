# Tasks

## 1. Data model and password rules

- [x] 1.1 Add `mustChangePassword` (default false) and `passwordVersion` (default 0) to `User` in `prisma/schema.prisma`, create the `add-password-change` migration, and verify `npx prisma migrate deploy` runs on a seeded database and `npm run typecheck` passes
- [x] 1.2 Add the shared password schema in `src/domain/schemas/password.ts` (8 to 200 characters, confirmation matches, differs from the current password) and verify unit tests for each rule and its message
- [x] 1.3 Make `createStudent` create the account with `mustChangePassword: true`, and verify an integration test that a new student's account is flagged while seeded accounts are not

## 2. Sessions and enforcement

- [x] 2.1 Store `passwordVersion` and `mustChangePassword` in the JWT at sign-in and expose them on the session, and verify `npm run typecheck` passes
- [x] 2.2 Make `getCurrentUser()` read the user's current version and flag, returning null on a version mismatch, and verify `npm run typecheck` passes (the version check is covered end to end by the Playwright tests in 3.4 and 4.2, because integration tests replace `getCurrentUser()`)
- [x] 2.3 Make the API guards refuse a flagged user with 403 `password_change_required` and "Change your password before you continue", and verify an integration test for the "API call before the change" scenario
- [x] 2.4 Extend `pageRedirect` in `src/domain/access.ts` with the must-change rule, make the page guards redirect flagged users to `/change-password`, add `requireSignedInPage()`, and verify unit tests for `pageRedirect`
- [x] 2.5 Send a flagged person to `/change-password` from the sign-in action, and verify a Playwright test for "First sign-in of a new student" and "Trying to skip the change"

## 3. Changing your own password

- [x] 3.1 Implement `changeOwnPassword` in `src/server/auth/account.ts` (row lock, current-password check, validation, new hash, clear the flag, bump the version), and verify integration tests for "Changing your password", "Wrong current password", "New password too short", "Passwords do not match", and "Same as the current password"
- [x] 3.2 Add `changePasswordAction`, which signs in again with the new password and redirects home after a forced change or to `/change-password?changed=1` otherwise, and verify a Playwright test for "After the change"
- [x] 3.3 Build the `/change-password` page (forced and voluntary variants, field errors, success message, Sign out) and the "Change password" header link, and verify Playwright tests for "Finding the change-password page", "Changing your password", "Signing out instead", and "Seeded demo accounts"
- [x] 3.4 Verify a Playwright test with two browser contexts for "Changing your password with another session open"

## 4. Staff reset

- [x] 4.1 Implement `resetStudentPassword` and `PUT /api/students/[id]/password` (staff-only, 204, no password in the response), and verify integration tests for "Temporary password too short", "Student tries to reset a password", "Unknown student", and "Reset response"
- [x] 4.2 Add the "Reset password" form to the staff student page, and verify Playwright tests for "Resetting a forgotten password" and "Staff reset while the student is signed in"

## 5. Documentation and full check

- [x] 5.1 Update `README.md` (product decisions, API table, out-of-scope list), `docs/database-schema.md`, and `docs/manual-testing.md` with the new behaviour, and verify every path and message they mention exists in the code
- [x] 5.2 Run lint, type checking, and the unit, integration, and Playwright suites, review the Playwright screenshots at desktop and phone widths, and verify all pass with no retries

## Workflow follow-up

- Archive `build-registry-module` before this change, so its `access-control` main spec exists when this change's requirements are merged.
- Archive this change after review.
