# Tasks

## 1. Project setup

- [ ] 1.1 Scaffold a TypeScript Next.js app (latest stable, App Router, `src/` layout, strict mode) with npm, and verify `npm run dev` serves the default page and `npm run lint` passes
- [ ] 1.2 Add Tailwind CSS and initialise shadcn/ui, and verify a shadcn `Button` renders on the home page
- [ ] 1.3 Add `docker-compose.yml` with PostgreSQL and separate development and test databases, taking the database user and password from `.env` so the file holds no credentials, and verify `docker compose up -d` starts it and both databases accept connections
- [ ] 1.4 Add `.env.example` with placeholder values and a comment for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `TEST_DATABASE_URL`, `AUTH_SECRET`, `SEED_USER_PASSWORD`, `UPLOAD_DIR`, `APP_TIMEZONE`, and `APP_CURRENCY`, and extend `.gitignore` with `.env`, `uploads/`, and test output, and verify `git status` does not show a copied `.env`
- [ ] 1.5 Add Vitest (unit and integration projects) and Playwright with npm scripts `test`, `test:integration`, and `test:e2e`, and verify each runs with a placeholder test
- [ ] 1.6 Confirm the test seams with the user as the TDD skill requires (domain functions, Route Handlers against the test database, Playwright flows), record the agreed seams in design.md, and verify the user has approved them
- [ ] 1.7 Start `README.md` with prerequisites and local setup steps, and verify the steps work from a fresh clone up to `npm run dev`

## 2. Data model and shared server foundations

- [ ] 2.1 Write `prisma/schema.prisma` with every model, enum, unique index, and relation from design.md decision 3, create the first migration, add the raw-SQL `CHECK` constraints for grade range and positive amounts, and verify `prisma migrate dev` applies cleanly to an empty database
- [ ] 2.2 Add the Prisma client singleton and a test helper that resets the test database between integration tests, and verify an integration test can insert and read a programme
- [ ] 2.3 Add the shared API error helper and error codes from design.md decision 10, and verify unit tests map validation, not-found, conflict, and unexpected errors to the right status and JSON body
- [ ] 2.4 Add `APP_TIMEZONE` "today" and money-formatting helpers, and verify unit tests cover a date near midnight in the configured time zone and formatting of minor units with two decimals
- [ ] 2.5 Create the seed entry point (`prisma db seed` via `tsx`) with 2 programmes, their modules, and fee plans, and verify `npx prisma db seed` runs twice in a row without errors

## 3. Access control

- [ ] 3.1 Configure Auth.js with the Credentials provider, bcrypt checking, case-insensitive email lookup, and a JWT session carrying user ID, role, and student record ID, and verify integration tests for valid sign-in, wrong password, unknown email, and mixed-case email
- [ ] 3.2 Build the sign-in page with the generic "Invalid email or password" error and a sign-out control in the app header, and verify both by hand and with a Playwright test that signs in and out
- [ ] 3.3 Add middleware that redirects signed-out visitors to `/sign-in` and each role away from the other role's pages, and verify integration tests for each redirect case
- [ ] 3.4 Add `requireStaff()` and `requireStudent()` for Route Handlers (401 when signed out, 403 for the wrong role, ownership checks that answer 404), and verify integration tests against a sample staff route and a sample student route
- [ ] 3.5 Add staff and student layouts with their navigation from design.md decision 11, and verify each role sees only its own navigation
- [ ] 3.6 Seed 2 staff accounts whose password comes from `SEED_USER_PASSWORD`, list their email addresses in the README with a pointer to that variable, and verify signing in with each listed account works and no password appears in the seed script or README

## 4. Student records

- [ ] 4.1 Implement domain functions for academic-year parsing and display and for Student ID formatting, and verify unit tests for `2025/26`, invalid years, and IDs such as `SMS-2025-0001`
- [ ] 4.2 Implement the student service: create in one transaction with the atomic counter, linked Student account, and hashed password; edit with validation; duplicate-email check; and the programme or academic year lock once a payment exists; and verify integration tests for each scenario in the student-records spec, including two concurrent creations getting different IDs
- [ ] 4.3 Add Route Handlers to list (search and filters), create, read, and update students, and verify integration tests for success, field errors, duplicate email (409), and that no response contains a password hash
- [ ] 4.4 Build the staff student list with search, programme and status filters kept in the URL, status badges, and an empty state with "Clear filters", and verify a Playwright test that searches by name part and Student ID and combines filters
- [ ] 4.5 Build the staff create and edit forms with field errors and no Student ID input, plus a student detail page, and verify a Playwright test that creates a student and sees the generated ID
- [ ] 4.6 Build the read-only student profile page, and verify a Student sees only their own details
- [ ] 4.7 Add at least 6 seeded students across both programmes and all four statuses, each with a Student login using `SEED_USER_PASSWORD`, list the demo student email addresses in the README, and verify the seeded IDs follow the format and each listed login works

## 5. Fees and payments

- [ ] 5.1 Implement instalment dating from a fee plan and academic year, and verify unit tests for September-December and January-August due months
- [ ] 5.2 Implement `calculateBalance` (total, paid, outstanding, due to date, overdue amount, earliest unpaid due date, and instalment states applied in due-date order), and verify unit tests for every student-fees scenario, including the due-date-is-today case
- [ ] 5.3 Bill students on creation and re-bill on a programme or academic year change before any payment, and verify integration tests that a new student gets the plan's instalments and that a later plan change leaves them alone
- [ ] 5.4 Implement payment recording with the student row lock, overpayment check, future-date check, and unique reference, plus its Route Handler, and verify integration tests for valid, duplicate reference (409), overpayment, invalid amount and date, and two concurrent payments that would overpay together
- [ ] 5.5 Build the staff fees page per student (instalments with states, payment history, outstanding and overdue amounts, and the record-payment form), and verify a Playwright test that records a payment and sees the balance update
- [ ] 5.6 Build the staff Registry dashboard with the overdue list ordered by overdue amount and an empty state, and verify a Playwright test that an overdue student appears and disappears once paid
- [ ] 5.7 Build the read-only Programmes page with fee plans and modules, and the student's own fees page with the overdue amount highlighted, and verify a Student cannot load another student's fees (404)
- [ ] 5.8 Seed payments so that at least one student is overdue, one is fully paid, and one is partly paid but not overdue, and verify the dashboard shows the expected overdue students after seeding

## 6. Assessments and submissions

- [ ] 6.1 Implement the submission rules function (open assessment, Enrolled status, create, replace before deadline, create late, refusal reasons) and the late check, and verify unit tests for every assessment-submissions scenario
- [ ] 6.2 Implement the `FileStorage` interface and its local-disk version under `UPLOAD_DIR`, and verify integration tests that put, read, and remove a file using UUID keys
- [ ] 6.3 Add assessment create, edit, close, and reopen services and Route Handlers with deadline validation, and verify integration tests for valid creation, a past deadline, and closing
- [ ] 6.4 Add the upload Route Handler with the 10 MB limit, empty-file check, `file-type` content check for PDF and DOCX, replace-before-deadline, and late acceptance, and verify integration tests with a real PDF, a real DOCX, a renamed PNG, an empty file, an oversized file, a non-Enrolled student, a closed assessment, and resubmission before and after the deadline
- [ ] 6.5 Add the access-checked download route, and verify integration tests that staff and the owner can download with the original file name and another student gets 404
- [ ] 6.6 Build the staff assessment pages (list, create and edit form, close and reopen, and per-assessment submissions with late flags and counts), and verify a Playwright test that creates an assessment and sees a late submission flagged
- [ ] 6.7 Build the student assessments list and upload page with clear states and error messages, and verify a Playwright test that submits, resubmits before the deadline, and sees the late flag on a past-deadline assessment
- [ ] 6.8 Seed assessments with on-time, late, and missing submissions using small sample PDF files, and verify the staff submissions view shows all three after seeding

## 7. Marksheet and results

- [ ] 7.1 Implement `classify` and the publish-eligibility check (names the assessments without a grade), and verify unit tests for the boundary grades 39, 40, 59, 60, 69, and 70
- [ ] 7.2 Add grade entry services and Route Handlers (set, change, clear, whole numbers 0-100 only, programme membership check), and verify integration tests for each student-results grade scenario
- [ ] 7.3 Add publish, withhold, return-to-pending, and bulk publish services and Route Handlers, and verify integration tests for the incomplete-results refusal and the "4 published, 2 skipped" bulk case
- [ ] 7.4 Build the staff marksheet per assessment with inline grade entry, classification, late flags, and a warning before changing a grade in a Published module, and verify a Playwright test that enters grades and sees classifications
- [ ] 7.5 Build the staff module results view with each student's release state and the publish, withhold, and bulk publish actions, and verify a Playwright test that publishes results and withholds one student
- [ ] 7.6 Build the student marksheet that shows only Published modules and "Results not yet released" for the rest, and verify an integration test that the student results API returns no grades for Pending or Withheld modules
- [ ] 7.7 Seed grades with Published, Pending, and Withheld modules, and verify the seeded student marksheets show the expected released and unreleased modules

## 8. Integration and submission readiness

- [ ] 8.1 Run a Playwright end-to-end pass over both roles on the seeded data (staff enrols, bills, records a payment, sets an assessment, grades, and publishes; the student submits and then sees the released result), and verify it passes
- [ ] 8.2 Review every page at desktop and mobile widths for layout, empty states, error messages, and badge consistency, fix visual issues found, and verify by screenshots
- [ ] 8.3 Finish the README with every environment variable from `.env.example`, the main product decisions and assumptions (fee instalments and the overdue rule, overpayments rejected, whole-number grades, publishing per module, file storage, academic year from 1 September, out-of-scope items), and a short section on how AI was used during the build (the tools, the spec-driven and test-first workflow, and what was reviewed or changed by hand), and verify every documented command runs as written
- [ ] 8.4 Run lint, type checking, unit, integration, and end-to-end tests from a fresh clone with a fresh database, and verify all pass with no flaky retries
- [ ] 8.5 Check the repository against the brief's constraints: `prisma/schema.prisma` and `prisma/migrations` are tracked, `.env.example` is tracked, no `.env`, uploaded file, password, or secret is tracked, no component holds mock records in place of database data, and no backend framework other than Next.js is in `package.json`, and verify with `git ls-files` and a search of `src/`
- [ ] 8.6 Commit all work and, once the user provides the GitHub repository, push it, and verify the remote shows the full code, the README, the seed script, and `schema.prisma`

## Workflow follow-up

- Sync the delta specs and archive the change once the implementation is reviewed and accepted.
