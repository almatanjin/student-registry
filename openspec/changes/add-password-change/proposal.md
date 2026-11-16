# Proposal

## Why

Staff choose a student's initial password when they create the record, so staff know it and the student keeps using it forever.
A student who forgets their password also has no way back in, because the module has no password change or reset of any kind.

## What Changes

- A student created by staff in the app must choose a new password the first time they sign in, before they can use any other page.
- Every signed-in person, Staff or Student, can change their own password at any time by giving their current password and a new one.
- Staff can reset a student's password from the student's record by setting a new temporary password, which the student must change at their next sign-in.
  This is how a student who has forgotten their password gets back in.
- A password reset by staff ends the student's existing sessions, and changing your own password ends your other sessions.
- Seeded demo accounts keep working with `SEED_USER_PASSWORD` and are not asked to change it, so the demo stays one step to try.
- **BREAKING (behaviour):** a student created in the app no longer lands on their assessments after the first sign-in; they land on the change-password page first.
- The README's "Out of scope" list drops "password reset", and the README, the manual testing guide, and the database diagram describe the new behaviour.

Out of scope: a self-service "Forgot password?" email link (it needs an email service), resetting staff passwords, password strength rules beyond a minimum length, and sign-in rate limiting.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `access-control`: adds requirements for changing your own password, the forced change after an initial or reset password, staff resetting a student's password, and ending sessions when a password changes.
  The capability is currently defined in the in-flight change `build-registry-module` and has no main spec under `openspec/specs/` yet, so this change adds its requirements as ADDED requirements.

## Impact

- **Data model:** `User` gains a flag for "must change password" and the time the password last changed, with a Prisma migration.
- **Auth:** the credential check and `getCurrentUser()` read the new fields, so the forced change and session ending are enforced on the server for every page and API route.
- **Pages:** a new change-password page shared by both roles, a "Change password" link in the header, and a "Reset password" action on the staff student page.
- **API:** a new staff-only route to reset a student's password.
  Other API routes refuse requests with 403 while the signed-in person must change their password.
- **Seed and tests:** seeded accounts stay as they are; new integration and Playwright tests cover each scenario.
- **Docs:** `README.md`, `docs/manual-testing.md`, and `docs/database-schema.md`.
