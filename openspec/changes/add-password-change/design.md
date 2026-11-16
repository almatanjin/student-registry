# Design

## Context

See proposal.md for why.
Sign-in uses Auth.js with the Credentials provider and a signed JWT cookie that holds the user ID, role, and student ID (`src/auth.ts`, `src/auth.config.ts`).
The JWT is never checked against the database after sign-in, so today nothing can end a session early or carry account state that changes after sign-in.
`src/proxy.ts` runs before every request with the database-free config and makes optimistic redirects.
The authoritative checks are `getCurrentUser()` (`src/server/auth/current-user.ts`), the API guards in `src/server/auth/guards.ts`, and the page guards in `src/server/auth/pages.ts`.
Every page and API route already goes through one of these guards.
Sign-in is a server action (`src/app/sign-in/actions.ts`), because only a server action can set the Auth.js cookie.
Other forms call Route Handlers through `src/lib/api-client.ts`.
The `access-control` spec lives in the in-flight change `build-registry-module`, which has not been archived yet.

## Goals / Non-Goals

**Goals:**

- Enforce the forced change and the ending of old sessions on the server, for every page and API route, not just in the proxy.
- Keep the proxy free of database access.
- Reuse the existing sign-in path to issue the new session after a password change.

**Non-Goals:**

- A general account settings area, or editing the email address.
- Revoking sessions for reasons other than a password change.

## Decisions

### 1. Two new fields on `User`

- `mustChangePassword Boolean @default(false)`: set to true when staff create a student or reset a student's password, and set to false when the person changes their own password.
- `passwordVersion Int @default(0)`: incremented on every password change or reset.

Existing and seeded accounts get the defaults, so the seed needs no change and demo accounts are never forced.
Alternative: a `passwordChangedAt` timestamp compared with the JWT's issue time.
Rejected because JWT times are in whole seconds, so a session started in the same second as a change would survive; a counter has no clock edge cases.

### 2. The session carries the password version, and `getCurrentUser()` checks it

At sign-in the JWT stores `passwordVersion` and `mustChangePassword` alongside the role.
`getCurrentUser()` reads the user's current `passwordVersion` and `mustChangePassword` with one primary-key query.
If the versions differ, it returns null, so the request is treated as signed out: API routes answer 401, and pages redirect to `/session-ended`.
That route clears the old cookie with Auth.js `signOut()` and then shows sign-in.
Pages cannot redirect straight to sign-in, because the proxy still sees the old cookie as signed in and would send the person back to their home page, in a loop.
`pageRedirect` never redirects `/session-ended`, and the route leaves a session that is still valid untouched, so a link to it cannot sign anyone out.
Otherwise it returns the user with the database value of `mustChangePassword`.
Alternative: database sessions.
The Credentials provider in Auth.js supports only JWT sessions (see the existing design, decision 2), so a version check is the smallest way to end sessions early.

### 3. Enforcing the forced change

- `CurrentUser` gains `mustChangePassword`.
- The API guards (`requireUser` and everything built on it) throw a new `ForbiddenError` with code `password_change_required` and the message "Change your password before you continue" when the flag is set.
- The page guards (`requireStaffPage`, `requireStudentPage`) redirect to `/change-password` when the flag is set.
- A new `requireSignedInPage()` lets the change-password page itself load while the flag is set.
- `pageRedirect` in `src/domain/access.ts` takes the session's `mustChangePassword` flag and sends every page except `/change-password` there.
  This is the proxy's optimistic version of the same rule, so the redirect happens before any page renders.
- `homeFor` stays unchanged.
  The sign-in action sends a person who must change their password to `/change-password` instead of their home page.

The JWT's copy of the flag can only be stale when the password version has also changed, and then the version check signs the session out, so the proxy never lets a stale flag through.

### 4. Changing your own password is a server action that signs in again

`/change-password` posts to a server action `changePasswordAction` next to the sign-in action.
It calls a service function `changeOwnPassword(userId, input)` in `src/server/auth/account.ts`, which, in one transaction:

1. Locks the user row.
2. Checks the current password.
3. Validates the new password with a shared Zod schema in `src/domain/schemas/password.ts` (at least 8 and at most 200 characters, confirmation matches, different from the current one).
4. Stores the new hash, sets `mustChangePassword` to false, and increments `passwordVersion`.

The action then calls `signIn("credentials", ...)` with the person's email and new password, which issues a fresh JWT with the new version.
That keeps this browser signed in while every older session fails the version check.
After a forced change it redirects to the role's home page.
After a voluntary change it redirects to `/change-password?changed=1`, which shows "Your password has been changed".
Alternative: Auth.js `unstable_update()` to patch the token in place.
Rejected because it is marked unstable and would add a second token-writing path beside sign-in.

### 5. Staff reset is a Route Handler

`PUT /api/students/[id]/password` with `{ "temporaryPassword": "..." }` is staff-only (`requireStaff()`).
It calls `resetStudentPassword(studentId, input)` in `src/server/students/service.ts`.
That function validates the length, stores the new hash, sets `mustChangePassword` to true, and increments `passwordVersion`.
It answers `204 No Content`, so the temporary password never comes back in a response.
An unknown student answers 404.
This matches the other staff operations, which are all Route Handlers called from client forms.

### 6. Creating a student sets the flag

`createStudent` in `src/server/students/service.ts` creates the `User` with `mustChangePassword: true`.
The seed creates users directly with Prisma and keeps the default of false.

### 7. Pages and navigation

- `/change-password` (`src/app/change-password/page.tsx`) sits outside the `/staff` and `/student` areas, so both roles can open it.
  It uses the same centred card layout as the sign-in page.
  When forced, it shows "Choose a new password before you continue" and a "Sign out" button, with no navigation.
  Otherwise, it shows a link back to the person's home page.
- `AppShell` gains a "Change password" link next to "Sign out".
- The staff student page gains a "Reset password" button that opens an inline form for the temporary password (`src/app/staff/students/[id]/reset-password-form.tsx`).

### 8. Specs

The `access-control` requirements in this change are ADDED requirements.
The forced-change requirement refines the existing "Valid credentials" scenario for accounts that must change their password.
If `build-registry-module` is archived first, the archive merges them into the `access-control` main spec it creates.

## Risks / Trade-offs

- [Every authenticated request now makes one more database query] → It is a primary-key lookup of two columns, small next to the queries each page already runs.
- [A student created before this change, in a database that is not re-seeded, is not forced to change their password] → Only development data is affected; the seed and every new student get the right value.
- [Staff know the temporary password] → It works only until the student's next sign-in, when the student must replace it.
- [No rate limiting on the current-password check] → The same as sign-in today; out of scope and listed in the proposal.

## Migration Plan

1. Add the two fields to `prisma/schema.prisma` and create the migration with `npx prisma migrate dev --name add-password-change`.
   Both columns have defaults, so the migration runs on existing data without a backfill.
2. Rollback: revert the commit and drop the two columns with a follow-up migration; no data depends on them.
