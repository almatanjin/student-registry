# Design

## Context

The repository holds only agent tooling and OpenSpec setup, so this is a greenfield build (see proposal.md - Why).
The brief fixes the stack: Next.js 14 or later with the App Router, PostgreSQL through Prisma, Tailwind or a component library (shadcn/ui preferred), no other backend framework, real database data, and a committed `.env.example` instead of credentials.
The brief scores working API routes and a clean schema, so the design keeps a clear API layer and a small, explicit data model.
The behaviour to build is defined in the five capability specs under `specs/`.

## Goals / Non-Goals

**Goals:**

- Meet every bullet in the brief and the edge cases in the specs with the smallest design that stays correct under concurrent use.
- Keep business rules (Student ID format, balances, classification, late flag, publish rules) in small pure functions that are easy to test on their own.
- Enforce roles and data ownership on the server for every page and API route.
- Read every record shown in the UI from PostgreSQL; no component holds hard-coded or mock records.
- Keep every credential out of git: database and seed passwords come from `.env`, and only `.env.example` with placeholder values is committed.
- Let a reviewer run the app with Docker, `npm install`, one migrate-and-seed command, and `npm run dev`.

**Non-Goals:**

- No user management, password reset, or self sign-up; staff accounts come from the seed, and student accounts are created with the student record.
- No screens to create or edit programmes, modules, or fee plans; they come from the seed and are shown read-only.
- No editing, deleting, or refunding of payments; a wrong payment is out of scope for this module.
- No file version history, notifications, audit log, or deployment setup.
- No pagination on the student list; the search and filters keep it short.
- No split of modules or assessments by academic year; an assessment applies to every student on the module's programme, because the brief defines an assessment by title, module, and deadline only.

## Decisions

### 1. Next.js App Router with Route Handlers as the API

All writes, and all student-facing reads, go through Route Handlers under `/app/api`, returning JSON.
Server Components on staff pages read through the same service functions the handlers use, so authorization and queries are not duplicated.
Client forms call the API with `fetch` and show field errors from the response.

- Alternative: Server Actions for writes. They need less code, but the brief asks for working API routes, and plain HTTP endpoints are easier to test and to demonstrate.

Code layout:

- `src/domain/` - pure functions with no database access: Student ID formatting, academic-year parsing, instalment dating, balance calculation, grade classification, late check, publish eligibility.
- `src/server/` - services per capability (students, fees, assessments, submissions, results) that use Prisma and the domain functions, plus auth helpers and the storage adapter.
- `src/app/api/` - thin Route Handlers: authenticate, validate input with Zod, call a service, map the result or error to a response.
- `src/app/(staff)/` and `src/app/(student)/` - pages for each role, with shared UI in `src/components/`.

### 2. Authentication with Auth.js credentials and JWT sessions

Auth.js (NextAuth v5) with the Credentials provider checks the email and a bcrypt password hash.
The session is a signed JWT cookie holding the user ID, role, and, for students, the student record ID.
Middleware redirects signed-out visitors to `/sign-in` and sends each role away from the other role's route group.
Each Route Handler and service call also checks the role and ownership itself through `requireStaff()` and `requireStudent()` helpers, so a middleware gap cannot expose data.
Another student's records answer 404 so their existence is not revealed.

- Alternative: database sessions. The Credentials provider in Auth.js only supports JWT sessions, and revoking sessions is not required here.
- Password hashing uses `bcryptjs` (pure JavaScript) to avoid native build steps on reviewers' machines.

### 3. Data model

```
User            id, email (unique, stored lower-case), passwordHash, role STAFF|STUDENT
Student         id, userId (unique, required), studentNumber (unique, "SMS-2025-0001"), fullName, dateOfBirth (date),
                programmeId, academicYearStart (int, 2025 = "2025/26"), status ENROLLED|DEFERRED|WITHDRAWN|COMPLETED
StudentNumberCounter  year (PK), lastValue
Programme       id, code (unique), name, annualFeeMinor
FeePlanInstalment     id, programmeId, sequence, amountMinor, dueMonth, dueDay
StudentInstalment     id, studentId, sequence, amountMinor, dueDate (date)
Payment         id, studentId, amountMinor, paidOn (date), reference (unique), recordedById, createdAt
Module          id, programmeId, code (unique), title
Assessment      id, moduleId, title, deadline (timestamptz), isOpen
Submission      id, assessmentId, studentId, storageKey, originalName, mimeType, sizeBytes, submittedAt
                unique (assessmentId, studentId)
Grade           id, assessmentId, studentId, value (int 0-100), updatedAt
                unique (assessmentId, studentId)
ModuleResult    id, studentId, moduleId, state PENDING|PUBLISHED|WITHHELD, updatedAt
                unique (studentId, moduleId); no row means PENDING
```

- A student's email is stored once, on their `User` account, and the student record reads it through the required one-to-one link.
  One column serves as both the record's email and the sign-in email, so they cannot drift apart, and the unique index covers staff and students together.
- Money is stored as integer minor units (pence) to avoid floating-point errors, and shown with two decimals in one currency set by `APP_CURRENCY` (default `GBP`).
- The academic year is stored as its start year, which makes the Student ID year and instalment dating simple; the UI shows `2025/26`.
- Students are billed by copying the programme's plan into `StudentInstalment` rows when the record is created, so later plan changes do not alter existing bills.
- Changing a student's programme or academic year before any payment deletes and recreates their instalments in the same transaction.
- `ModuleResult` rows are created only when staff change a state, which keeps "Pending" as the default without a backfill.
- Database checks (`CHECK value BETWEEN 0 AND 100`, `amountMinor > 0`) back up the Zod validation.

### 4. Student ID generation with an atomic counter

Inside the transaction that inserts the student, one statement claims the next number:
`INSERT INTO "StudentNumberCounter" (year, "lastValue") VALUES ($1, 1) ON CONFLICT (year) DO UPDATE SET "lastValue" = "StudentNumberCounter"."lastValue" + 1 RETURNING "lastValue"`.
The row lock serialises concurrent creations for the same year, and a failed insert rolls the counter back, so numbers are unique and never reused.
The unique index on `studentNumber` is a final guard.

- Alternative: `MAX(studentNumber) + 1`. It races under concurrent creation, which the spec rules out.

### 5. Instalment dating and balances

An academic year runs from 1 September to 31 August.
A plan instalment with a due month from September to December is dated in the start year; January to August is dated in the end year.
A pure `calculateBalance(instalments, payments, today)` returns total, paid, outstanding, due to date, overdue amount, earliest unpaid due date, and each instalment's state (paid, overdue, upcoming), applying payments to instalments in due-date order.
"Today" is the current date in `APP_TIMEZONE` (default `Europe/London`), and an instalment counts as due only after its due date.
Balances are computed on every read, never stored, so they cannot drift.
The dashboard loads all students with their instalments and payment totals in two queries and filters in memory, which is fine at registry scale; a SQL view can replace it if the numbers grow.

### 6. Safe payment recording

Recording a payment runs in one transaction that locks the student row (`SELECT ... FOR UPDATE`), sums existing payments, rejects the payment if it exceeds the outstanding balance, then inserts it.
The lock stops two simultaneous payments from together overpaying.
The unique index on `reference` turns a duplicate into a 409 with the spec's message.

### 7. Submission files on local disk behind a storage interface

A `FileStorage` interface (`put`, `read`, `remove`) has one implementation that writes to `UPLOAD_DIR` (default `./uploads`, gitignored, outside `public/`).
Files are stored under a random UUID key; the original name is kept only in the database.
The upload handler checks the size limit (10 MB), rejects empty files, and checks the content with `file-type`: PDF must be detected as `application/pdf`, and DOCX as the Word Open XML type, so renamed files are refused.
Resubmission writes the new file, updates the row in a transaction, then removes the old file; a failed removal leaves an orphaned file and is logged.
Downloads go through `/api/submissions/[id]/file`, which checks staff role or ownership and streams the file with `Content-Disposition: attachment`.

- Alternative: storing bytes in Postgres. It works, but it bloats the database and its backups.

### 8. Late flag and assessment state

Lateness is computed as `submittedAt > deadline` whenever it is shown, so a deadline extension updates it without data changes.
The submission rules (open assessment, Enrolled status, replacement only before the deadline) live in one domain function that returns either an allowed action (`create`, `replace`, `create-late`) or a reason for refusal, which the handler maps to the spec's messages.

### 9. Results and publishing

`classify(grade)` returns Fail, Pass, Merit, or Distinction from the spec's boundaries.
Publishing checks that the student has a grade for every assessment in the module and names any assessment without one.
Bulk publish loads the module's students in one transaction, publishes the complete Pending ones, and returns published and skipped counts.
The student marksheet query only selects grades for modules whose `ModuleResult` state is `PUBLISHED`, so unpublished grades never leave the server.
The staff grade form shows a confirmation when the student's module result is already Published.

### 10. Validation and error responses

Zod schemas in `src/domain/schemas` are shared by client forms and Route Handlers.
Every error response uses `{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }` with 400 for invalid input, 401 when signed out, 403 for the wrong role, 404 for missing or not-owned records, 409 for conflicts (duplicate email or reference, overpayment, deadline passed, closed assessment, student not enrolled, incomplete results), and 413 for oversized files.
Unexpected errors return 500 with a generic message and are logged on the server.

### 11. UI

Tailwind CSS with shadcn/ui components.
Staff navigation: Dashboard (overdue balances), Students, Assessments, Programmes (read-only fee plans and modules).
Student navigation: Assessments, Marksheet, Fees, Profile.
After sign-in, Staff land on the Dashboard and Students land on Assessments.
The student list keeps search and filters in the URL query string, rendered on the server, so reloads and shared links keep them.
The search box and filters update the URL as staff type (debounced by 300 ms) or change a filter, replacing the history entry so Back leaves the page instead of stepping through each keystroke.
Late submissions, overdue amounts, and enrolment statuses use consistent badges, and every list has an empty state.

### 12. Local setup, seed, and tests

- `docker-compose.yml` runs PostgreSQL with a development database and a separate test database, and reads the database user and password from `.env`, so the compose file holds no credentials.
- `.env.example` lists `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `TEST_DATABASE_URL`, `AUTH_SECRET`, `SEED_USER_PASSWORD`, `UPLOAD_DIR`, `APP_TIMEZONE`, and `APP_CURRENCY`, each with a placeholder value and a one-line comment.
  The real `.env` is gitignored.
- Every seeded account takes its password from `SEED_USER_PASSWORD`, so no password is written in the seed script or the README; the README lists the demo email addresses and points to that variable.
- `prisma/schema.prisma` and the `prisma/migrations` folder are committed.
- The seed (`prisma db seed`, run with `tsx`) creates 2 programmes with modules and fee plans, 2 staff accounts, at least 6 students across all four statuses, payments including an overdue and a fully paid student, assessments with on-time, late, and missing submissions (with small sample PDF files), and grades with Published, Pending, and Withheld modules.
  Seed dates are computed from the current date, so the overdue and late cases exist whenever the seed is run.
- Tests follow the project TDD skill, with seams to be confirmed with the user before the first test: Vitest unit tests for `src/domain`, Vitest integration tests that call Route Handlers against the test database, and Playwright end-to-end tests of the staff and student flows (decision 13).

Agreed test seams (approved by the user on 2026-11-13):

| Seam | Public interface | Catches | Misses |
|---|---|---|---|
| Domain | Pure functions in `src/domain` | Rule and boundary mistakes (Student ID format, academic year, instalment dates, balances, classification, late check, publish rules), in milliseconds | Database, HTTP, and rendering |
| API | Route Handler functions called in-process against the real test database; the signed-in user comes from one `getCurrentUser()` boundary that tests set | Validation, status codes, role and ownership checks, unique constraints, and concurrency rules | Cookie decoding and rendering |
| Browser | Playwright against the production build and the seeded test database | Real sign-in, redirects, page states, uploads, and downloads | Exhaustive edge cases, which are too slow to enumerate here |

Nothing internal is mocked; `getCurrentUser()` is the only value tests set, and Playwright covers the real session cookie behind it.

### 13. End-to-end testing with Playwright

Playwright tests drive the real app in a browser the way a staff member or a student would.
A user-facing task is done only when its Playwright test passes, and each task group ends by running the whole suite.

- Layout: tests live in `e2e/`, with one file per capability (`access-control.spec.ts`, `student-records.spec.ts`, `student-fees.spec.ts`, `assessment-submissions.spec.ts`, `student-results.spec.ts`) and `journey.spec.ts` for the full staff-and-student flow.
  Test titles reuse the spec scenario names, so each scenario can be traced to its test.
- Environment: the `webServer` setting in `playwright.config.ts` builds and starts the app on its own port against the test database, with `UPLOAD_DIR` set to a temporary folder.
  A global setup resets, migrates, and seeds the test database, so every run starts from the same data.
  The tests run against the production build because it matches what a reviewer runs and avoids the slow first-load compiles of the dev server.
- Sessions: a setup project signs in once as a seeded staff account and once as a seeded student through the real sign-in page, and saves each session under `e2e/.auth/` (gitignored).
  Other tests reuse the saved session for their role, and the access-control tests sign in through the page themselves.
- Data: the suite runs in one worker, so tests never race on shared rows.
  A test that changes data first creates its own record through the UI where the UI allows it.
  Cases that depend on dates (overdue instalments, a deadline that has passed) come from the seed, which dates its data from the current day, so no clock is mocked.
- Locators: tests find elements by role, label, and visible text, and rely on Playwright's auto-waiting assertions; they use no CSS or XPath selectors and no fixed waits.
- Failures: retries are set to 0, so a flaky test fails and gets fixed instead of passing on a second try.
  A trace and a screenshot are kept for each failed test, and `test-results/` and `playwright-report/` are gitignored.
- Browser: Chromium only, with the UI review (task 8.2) taking screenshots at 1440 and 390 pixels wide.
- Scripts: `npm run test:e2e` runs the suite, and the README documents it next to the unit and integration commands.

- Alternative: Cypress. Playwright handles one saved session per role out of the box and is the end-to-end tool the Next.js documentation covers first.
- Alternative: running tests in several workers with a database per worker. It is faster, but the extra setup is not worth it for a suite of this size.

## Risks / Trade-offs

- [JWT sessions keep a student's role and record ID until expiry] → Roles never change after creation in this module, and the session lifetime is set to 8 hours.
- [Local-disk storage does not work across several server instances] → Storage sits behind `FileStorage`, so an S3 implementation can replace it without touching handlers.
- [The dashboard computes overdue balances in memory] → Fine for thousands of students; moving it into a SQL view is a contained change.
- [Time-zone mistakes around due dates and deadlines] → Deadlines are stored as `timestamptz`, due dates as plain dates, and "today" always comes from one `APP_TIMEZONE` helper covered by unit tests.
- [A failed file removal after resubmission leaves an orphaned file] → The database stays correct, and the orphan is logged; a clean-up job is out of scope.
- [The Playwright suite adds minutes to each task group] → One browser, saved sign-in sessions, and a production build keep it short, and per-task runs can target a single spec file.
- [No way to correct a wrong payment] → Accepted to stay within the brief; listed under Non-Goals and in the README.

## Migration Plan

Greenfield: `prisma migrate dev` creates the schema from the first migration, and `prisma db seed` loads demo data.
There is no existing data to migrate and no rollback beyond resetting the local database.
