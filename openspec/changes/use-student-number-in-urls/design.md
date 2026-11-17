# Design

## Context

The three staff student pages live under `src/app/staff/students/[id]/` and read `id` from `params`.
They call `getStudent(id)`, `getStudentFees(id)` and `studentHasPayments(id)`, and pass `id` to client forms that call `/api/students/<id>/...`.
The Student ID (`studentNumber`) is unique in the database and never changes (see the `student-records` requirement "Student IDs are generated automatically"), and its format `SMS-YYYY-NNNN` is safe in a URL without encoding.

## Goals / Non-Goals

**Goals:**
- Page URLs and every link to them use the Student ID.
- Everything below the page (services, API calls) keeps working with the internal id.

**Non-Goals:**
- Changing API routes, request bodies, or responses.
- Redirecting old id URLs.
- Case-insensitive matching (`sms-2026-0001` is treated as unknown), since every link the app produces uses the exact stored form.

## Decisions

### Rename the route segment to `[studentNumber]`

The folder becomes `src/app/staff/students/[studentNumber]/`, so `params` says what it holds and the generated types become `PageProps<"/staff/students/[studentNumber]">`.
Keeping the folder name `[id]` with a different meaning was rejected because it would mislead anyone reading the code.

### Resolve the Student ID once at the top of each page

A new service function `getStudentByNumber(studentNumber)` returns the same `StudentView` as `getStudent`, or throws `NotFoundError`.
Each page calls it first, calls `notFound()` on `NotFoundError`, then uses `student.id` for everything else (`getStudentFees`, `studentHasPayments`, and the `studentId` prop passed to `PaymentForm`, `ResetPasswordForm` and `StudentForm`).
This keeps the change at the page edge, so services, API routes and client forms do not change.
Changing every service to accept a Student ID was rejected as wider than needed and against the chosen scope.

### Build links from `studentNumber`

The list, dashboard, record and back links use `student.studentNumber` (the overdue list entries already carry `studentNumber`).
`StudentForm` redirects with `result.data.student.studentNumber`, which the create and update API responses already include.

## Risks / Trade-offs

- [The fees page loses one parallel query, since fees need the id the first lookup returns] -> The two lookups are small indexed reads; the cost is not noticeable.
- [Old id URLs in a browser history now show not found] -> Accepted; the app is not deployed and has no published links.
