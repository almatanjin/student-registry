# Proposal

## Why

Staff pages for a student are addressed by the internal database id, so URLs read like `/staff/students/cmwjkvuu6000tjfo4aw7pnqx9/fees`.
Staff already know students by their Student ID (`SMS-2026-0001`), so the URL should use it, which makes links readable and easy to share or type.

## What Changes

- The staff student pages move to the Student ID: `/staff/students/SMS-2026-0001`, `/staff/students/SMS-2026-0001/edit`, and `/staff/students/SMS-2026-0001/fees`.
- Every link to those pages uses the Student ID: the student list, the overdue list on the dashboard, the buttons on the student record, the back links, and the redirect after creating or editing a student.
- **BREAKING** (pages only): a URL that uses the internal id shows the normal not-found page.
  There are no published links to keep, so there is no redirect.
- The API routes under `/api/students/[id]` keep the internal id and do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-records`: adds a requirement that staff student pages are addressed by the Student ID.

## Impact

- Pages: `src/app/staff/students/[id]/page.tsx`, `[id]/edit/page.tsx`, `[id]/fees/page.tsx` (the route folder is renamed to `[studentNumber]`).
- Links: `src/app/staff/students/page.tsx`, `src/app/staff/dashboard/page.tsx`, `src/app/staff/students/student-form.tsx`.
- Service: `src/server/students/service.ts` gains a lookup by Student ID.
- Tests: `e2e/support/students.ts` and `e2e/password-change.spec.ts` read the Student ID from the URL; a new e2e spec covers the URLs.
- Docs: `docs/manual-testing.md` route tables and the steps that copy an id from the URL.
- No database, schema, or API changes.
