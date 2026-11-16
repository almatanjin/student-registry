# Tasks

## 1. Project setup

- [x] 1.1 Scaffold a TypeScript Next.js app (latest stable, App Router, `src/` layout, strict mode) with npm, and verify `npm run dev` serves the default page and `npm run lint` passes
- [x] 1.2 Add Tailwind CSS and initialise shadcn/ui, and verify a shadcn `Button` renders on the home page
- [x] 1.3 Add `docker-compose.yml` with PostgreSQL and separate development and test databases, taking the database user and password from `.env` so the file holds no credentials, and verify `docker compose up -d` starts it and both databases accept connections
- [x] 1.4 Add `.env.example` with placeholder values and a comment for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `TEST_DATABASE_URL`, `AUTH_SECRET`, `SEED_USER_PASSWORD`, `UPLOAD_DIR`, `APP_TIMEZONE`, and `APP_CURRENCY`, and extend `.gitignore` with `.env`, `uploads/`, and test output, and verify `git status` does not show a copied `.env`
- [x] 1.5 Add Vitest (unit and integration projects) with npm scripts `test` and `test:integration`, and verify each runs with a placeholder test
- [x] 1.6 Add Playwright (Chromium) as set out in design.md decision 13: an `e2e/` folder, a `playwright.config.ts` whose `webServer` builds and starts the app on its own port with a temporary `UPLOAD_DIR`, one worker, no retries, traces and screenshots kept on failure, gitignored `test-results/`, `playwright-report/`, and `e2e/.auth/`, and the npm script `test:e2e`, and verify `npm run test:e2e` passes a placeholder test that loads the home page
- [x] 1.7 Confirm the test seams with the user as the TDD skill requires (domain functions, Route Handlers against the test database, Playwright flows), record the agreed seams in design.md, and verify the user has approved them
- [x] 1.8 Start `README.md` with prerequisites, local setup steps, and how to run each test suite, and verify the steps work from a fresh clone up to `npm run dev`

## 2. Data model and shared server foundations

- [x] 2.1 Write `prisma/schema.prisma` with every model, enum, unique index, and relation from design.md decision 3, create the first migration, add the raw-SQL `CHECK` constraints for grade range and positive amounts, and verify `prisma migrate dev` applies cleanly to an empty database
- [x] 2.2 Add the Prisma client singleton and a test helper that resets the test database between integration tests, and verify an integration test can insert and read a programme
- [x] 2.3 Add the shared API error helper and error codes from design.md decision 10, and verify unit tests map validation, not-found, conflict, and unexpected errors to the right status and JSON body
- [x] 2.4 Add `APP_TIMEZONE` "today" and money-formatting helpers, and verify unit tests cover a date near midnight in the configured time zone and formatting of minor units with two decimals
- [x] 2.5 Create the seed entry point (`prisma db seed` via `tsx`) with 2 programmes, their modules, and fee plans, and verify `npx prisma db seed` runs twice in a row without errors
- [x] 2.6 Add the Playwright global setup that resets, migrates, and seeds the test database and point the `webServer` at that database, and verify `npm run test:e2e` starts from freshly seeded data on two runs in a row

## 3. Access control

- [x] 3.1 Configure Auth.js with the Credentials provider, bcrypt checking, case-insensitive email lookup, and a JWT session carrying user ID, role, and student record ID, and verify integration tests for valid sign-in, wrong password, unknown email, and mixed-case email
- [x] 3.2 Seed 2 staff accounts whose password comes from `SEED_USER_PASSWORD`, list their email addresses in the README with a pointer to that variable, and verify an integration test that each seeded staff account passes the credentials check and that no password appears in the seed script or README
- [x] 3.3 Build the sign-in page with the generic "Invalid email or password" error and a sign-out control in the app header, and verify a Playwright test that signs in with valid credentials, sees the generic error for a wrong password, and signs out
- [x] 3.4 Add middleware that redirects signed-out visitors to `/sign-in` and each role away from the other role's pages, and verify integration tests for each redirect case
- [x] 3.5 Add `requireStaff()` and `requireStudent()` for Route Handlers (401 when signed out, 403 for the wrong role, ownership checks that answer 404), and verify integration tests against a sample staff route and a sample student route
- [x] 3.6 Add staff and student layouts with their navigation from design.md decision 11, and verify a Playwright test that Staff see only the staff navigation and a signed-out visitor is sent to the sign-in page
- [x] 3.7 Add the Playwright sign-in setup project that signs in once as a seeded staff account through the sign-in page and saves the session for reuse, and verify a staff test starts on the Dashboard without visiting the sign-in page
- [x] 3.8 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries before starting the next group

## 4. Student records

- [x] 4.1 Implement domain functions for academic-year parsing and display and for Student ID formatting, and verify unit tests for `2025/26`, invalid years, and IDs such as `SMS-2025-0001`
- [x] 4.2 Implement the student service: create in one transaction with the atomic counter, linked Student account, and hashed password; edit with validation; duplicate-email check; and the programme or academic year lock once a payment exists; and verify integration tests for each scenario in the student-records spec, including two concurrent creations getting different IDs
- [x] 4.3 Add Route Handlers to list (search and filters), create, read, and update students, and verify integration tests for success, field errors, duplicate email (409), and that no response contains a password hash
- [x] 4.4 Add at least 6 seeded students across both programmes and all four statuses, each with a Student login using `SEED_USER_PASSWORD`, list the demo student email addresses in the README, extend the Playwright sign-in setup with a saved student session, and verify the seeded IDs follow the format and each listed login works
- [x] 4.5 Build the staff student list with search, programme and status filters kept in the URL, status badges, and an empty state with "Clear filters", and verify a Playwright test that searches by name part and Student ID and combines filters
- [x] 4.6 Build the staff create and edit forms with field errors and no Student ID input, plus a student detail page, and verify a Playwright test that creates a student and sees the generated ID
- [x] 4.7 Build the read-only student profile page, and verify a Playwright test that a signed-in Student sees their own details with no edit controls and is sent back to their own pages when opening the staff student list
- [x] 4.8 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries before starting the next group
- [x] 4.9 Make the student list search as staff type and apply filters on change, with no Search button, and verify a Playwright test that typing alone narrows the list while the search box keeps focus

## 5. Fees and payments

- [x] 5.1 Implement instalment dating from a fee plan and academic year, and verify unit tests for September-December and January-August due months
- [x] 5.2 Implement `calculateBalance` (total, paid, outstanding, due to date, overdue amount, earliest unpaid due date, and instalment states applied in due-date order), and verify unit tests for every student-fees scenario, including the due-date-is-today case
- [x] 5.3 Bill students on creation and re-bill on a programme or academic year change before any payment, and verify integration tests that a new student gets the plan's instalments and that a later plan change leaves them alone
- [x] 5.4 Implement payment recording with the student row lock, overpayment check, future-date check, and unique reference, plus its Route Handler, and verify integration tests for valid, duplicate reference (409), overpayment, invalid amount and date, and two concurrent payments that would overpay together
- [x] 5.5 Seed payments so that at least one student is overdue, one is fully paid, and one is partly paid but not overdue, and verify an integration test that the overdue query returns exactly the expected seeded students
- [x] 5.6 Build the staff fees page per student (instalments with states, payment history, outstanding and overdue amounts, and the record-payment form), and verify a Playwright test that records a payment and sees the balance update
- [x] 5.7 Build the staff Registry dashboard with the overdue list ordered by overdue amount and an empty state, and verify a Playwright test that an overdue student appears and disappears once paid
- [x] 5.8 Build the read-only Programmes page with fee plans and modules, and the student's own fees page with the overdue amount highlighted, and verify a Playwright test that a Student with an overdue balance sees it highlighted against its instalment, plus an integration test that another student's fees answer 404
- [x] 5.9 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries before starting the next group

## 6. Assessments and submissions

- [x] 6.1 Implement the submission rules function (open assessment, Enrolled status, create, replace before deadline, create late, refusal reasons) and the late check, and verify unit tests for every assessment-submissions scenario
- [x] 6.2 Implement the `FileStorage` interface and its local-disk version under `UPLOAD_DIR`, and verify integration tests that put, read, and remove a file using UUID keys
- [x] 6.3 Add assessment create, edit, close, and reopen services and Route Handlers with deadline validation, and verify integration tests for valid creation, a past deadline, and closing
- [x] 6.4 Add the upload Route Handler with the 10 MB limit, empty-file check, `file-type` content check for PDF and DOCX, replace-before-deadline, and late acceptance, and verify integration tests with a real PDF, a real DOCX, a renamed PNG, an empty file, an oversized file, a non-Enrolled student, a closed assessment, and resubmission before and after the deadline
- [x] 6.5 Add the access-checked download route, and verify integration tests that staff and the owner can download with the original file name and another student gets 404
- [x] 6.6 Seed assessments with on-time, late, and missing submissions using small sample PDF files, including one open assessment whose deadline has passed, and verify an integration test that the seeded submissions report the expected on-time, late, and missing states
- [x] 6.7 Build the staff assessment pages (list, create and edit form, close and reopen, and per-assessment submissions with late flags and counts), and verify a Playwright test that creates an assessment and sees a late submission flagged
- [x] 6.8 Build the student assessments list and upload page with clear states and error messages, and verify a Playwright test that submits, resubmits before the deadline, and sees the late flag on a past-deadline assessment
- [x] 6.9 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries before starting the next group

## 7. Marksheet and results

- [x] 7.1 Implement `classify` and the publish-eligibility check (names the assessments without a grade), and verify unit tests for the boundary grades 39, 40, 59, 60, 69, and 70
- [x] 7.2 Add grade entry services and Route Handlers (set, change, clear, whole numbers 0-100 only, programme membership check), and verify integration tests for each student-results grade scenario
- [x] 7.3 Add publish, withhold, return-to-pending, and bulk publish services and Route Handlers, and verify integration tests for the incomplete-results refusal and the "4 published, 2 skipped" bulk case
- [x] 7.4 Seed grades with Published, Pending, and Withheld modules, and verify an integration test that each seeded student's results query returns only their Published modules
- [x] 7.5 Build the staff marksheet per assessment with inline grade entry, classification, late flags, and a warning before changing a grade in a Published module, and verify a Playwright test that enters grades and sees classifications
- [x] 7.6 Build the staff module results view with each student's release state and the publish, withhold, and bulk publish actions, and verify a Playwright test that publishes results and withholds one student
- [x] 7.7 Build the student marksheet that shows only Published modules and "Results not yet released" for the rest, and verify a Playwright test that a Student sees grades and classifications for a Published module and the same "Results not yet released" message for a Pending and a Withheld module, plus an integration test that the student results API returns no grades for Pending or Withheld modules
- [x] 7.8 Run lint, type checking, and the unit, integration, and Playwright suites, and verify all pass with no retries before starting the next group

## 8. Integration and submission readiness

- [x] 8.1 Add a Playwright journey test over both roles (staff enrols a student, sees the fee billed, records a payment, sets an assessment, grades it, and publishes; the student submits and then sees the released result), and verify it passes together with the rest of the suite
- [x] 8.2 Capture Playwright screenshots of every page at 1440 and 390 pixels wide, review them for layout, empty states, error messages, and badge consistency, fix the visual issues found, and verify by a second set of screenshots
- [x] 8.3 Finish the README with every environment variable from `.env.example`, the main product decisions and assumptions (fee instalments and the overdue rule, overpayments rejected, whole-number grades, publishing per module, file storage, academic year from 1 September, out-of-scope items), and a short section on how AI was used during the build (the tools, the spec-driven and test-first workflow, and what was reviewed or changed by hand), and verify every documented command runs as written
- [x] 8.4 Run lint, type checking, and the unit, integration, and Playwright suites from a fresh clone with a fresh database, and verify all pass with no retries
- [x] 8.5 Check the repository against the brief's constraints: `prisma/schema.prisma` and `prisma/migrations` are tracked, `.env.example` is tracked, no `.env`, uploaded file, password, or secret is tracked, no component holds mock records in place of database data, and no backend framework other than Next.js is in `package.json`, and verify with `git ls-files` and a search of `src/`
- [ ] 8.6 Commit all work group wise and, once the user provides the GitHub repository, push it, and verify the remote shows the full code, the README, the seed script, and `schema.prisma`

## Workflow follow-up

- Sync the delta specs and archive the change once the implementation is reviewed and accepted.
