# Student Registry

The Registry module of a Student Management System.
It covers the four workflows a Registry Administrator runs every day: student enrolment, fees and payments, assessment submissions, and marksheets with controlled release of results.
It is built with Next.js (App Router), PostgreSQL, and Prisma.

## Prerequisites

- Node.js 22 or later, with npm.
- Docker Desktop (or another Docker engine with Compose), used to run PostgreSQL.

## Run it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file and fill in every placeholder (see the comments in the file and the table below):

   ```bash
   cp .env.example .env
   ```

   Use the same PostgreSQL user, password, and port in `DATABASE_URL` and `TEST_DATABASE_URL` as in `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`.

3. Start PostgreSQL, which creates the `registry` and `registry_test` databases on first start:

   ```bash
   docker compose up -d
   ```

4. Create the tables and load the demo data:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   The seed replaces everything in the `registry` database with the demo data set, so run it again whenever you want a fresh start.
   Its dates are worked out from the day you run it, so the overdue fees and late submissions are always there.

5. Start the app and open http://localhost:3000:

   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` | PostgreSQL user that `docker-compose.yml` creates on first start. |
| `POSTGRES_PASSWORD` | Password for that user. |
| `POSTGRES_PORT` | Host port for PostgreSQL (default `5432`). |
| `DATABASE_URL` | Connection string for the `registry` database used by the app and the seed. |
| `TEST_DATABASE_URL` | Connection string for the `registry_test` database, which the integration and Playwright tests reset on every run. |
| `AUTH_SECRET` | Secret that signs session cookies; generate one with `openssl rand -base64 32`. |
| `SEED_USER_PASSWORD` | Password given to every seeded demo account; at least 8 characters. |
| `UPLOAD_DIR` | Folder for uploaded submission files (default `./uploads`, outside `public/`). |
| `APP_TIMEZONE` | IANA time zone for "today" (fee due dates) and for entering and showing deadlines (default `Europe/London`). |
| `APP_CURRENCY` | ISO 4217 currency code used to show money (default `GBP`). |

Only `.env.example` is committed; `.env` is gitignored.

## Demo accounts

Every demo account signs in with the password you set as `SEED_USER_PASSWORD` in `.env`.

| Role | Email | What it shows |
|---|---|---|
| Staff | `registrar@sms.example` | Every staff page |
| Staff | `registry.officer@sms.example` | A second staff account |
| Student | `alma@students.sms.example` | BSc, fees paid in full, CS101 results published |
| Student | `liam.chen@students.sms.example` | BSc, part-paid but not overdue, a late submission, CS101 results withheld |
| Student | `priya.k@students.sms.example` | BSc, nothing paid yet, CS101 results pending (a grade is missing) |
| Student | `fatima.hassan@students.sms.example` | BSc, withdrawn, overdue fee |
| Student | `sofia.rossi@students.sms.example` | MSc, overdue fee, DS501 results published |
| Student | `daniel.mensah@students.sms.example` | MSc, completed, fees paid in full |
| Student | `noah.williams@students.sms.example` | MSc, deferred, so cannot submit work |

## What it does

**Staff**

- **Dashboard:**
  - Four summary cards, each worked out from current records: Enrolled students (with the other statuses), Overdue balances, Fees collected (the share of all billed fees paid, rounded down), and Results to publish (complete results still Pending).
    Each card except Fees collected links to where its detail lives.
  - Below them, every student with an overdue balance, highest amount first, whatever their enrolment status.
- **Students:**
  - Search by name or Student ID and filter by programme and status. The filters live in the URL, so they survive a reload.
  - Create and edit student records. The Student ID (`SMS-2026-0001`) is generated, unique, and never changes.
  - Each student has a fees page with instalments, payment history, balances, and a form to record payments.
  - Reset a student's password to a temporary one when they cannot sign in.
- **Assessments:**
  - Create assessments for a module with a deadline, then edit, close, or reopen them.
  - See every student's submission, with late ones flagged, and download the files.
  - Enter grades (0-100) next to each submission.
- **Results:** per module, publish or withhold each student's results, or publish every complete result at once.
- **Programmes:** fee plans and modules, read-only.

**Students**

- Their assessments, with on-time, late, or missing state, and a page to upload or replace their PDF or DOCX file.
- Their marksheet, which shows grades only for modules whose results are published.
- Their fees, with any overdue amount highlighted.
- Their profile, read-only.
- Changing their password, which is required at the first sign-in after staff set or reset it.

**Everyone**

- A left sidebar with the PEN circles, "Student Registry", the role, and that role's pages with icons; the current section is highlighted.
  Its footer shows who is signed in, with "Change password" and "Sign out".
- On phones the sidebar folds behind a "Menu" button in a top bar, and opens over the page.
- The sign-in page shows the PEN circles and "Student Registry" above the form.
- Colours come from the PEN logo: main buttons in the logo blue, and every status pill in one tone per meaning (green for done, yellow for needs attention, red for a problem, blue for finished, purple for special or held, light blue for waiting, grey for inactive).
  `src/app/theme.css` holds these colours, the button style, and the fonts, so they can be changed in one place.

## Product decisions and assumptions

The brief leaves some rules open; these are the choices made, and why.

- **Login:** email and password, with two roles (Staff and Student), checked on the server for every page and API route.
  A student's sign-in email is their record's email, and staff set an initial password when they create the record.
- **Passwords:**
  - A student created in the app must choose a new password the first time they sign in; until then every other page sends them to the change-password page, and API routes answer 403.
  - Anyone signed in can change their own password from the "Change password" link in the header, by giving their current password and a new one of at least 8 characters.
  - A student who forgets their password asks the Registry team, who set a temporary password from the student's record ("Reset password"); the student must change it at their next sign-in.
  - Changing or resetting a password ends every older session, so a reset also signs the student out anywhere they were signed in.
  - Seeded demo accounts are not asked to change their password, so the demo works straight away with `SEED_USER_PASSWORD`.
- **Fees:** each programme has an annual fee split into dated instalments (for example 1 October, 15 January, 15 April).
  - New students are billed from their programme's plan for their academic year, and later changes to a plan do not alter existing bills.
  - A student is **overdue** when what they have paid is less than the instalments already due; an instalment becomes due the day after its due date.
  - Balances are calculated from the recorded payments every time they are shown, so they are always current.
  - Payments are applied to instalments in due-date order.
- **Payments:**
  - Reference numbers are unique, ignoring letter case.
  - A payment cannot be dated in the future.
  - A payment larger than the outstanding balance is rejected, because refunds are out of scope.
  - Once a payment exists, the student's programme and academic year can no longer change.
- **Academic year:** runs from 1 September to 31 August, entered and shown as `2025/26`.
- **Submissions:**
  - Only Enrolled students can submit, and only to an open assessment.
  - Files are checked by their content as well as their name, and must be at most 10 MB.
  - Before the deadline a new upload replaces the old one.
  - After it, a first submission is accepted and marked late, but an existing one can no longer be replaced.
  - Lateness is worked out from the stored time, so extending a deadline clears the late flag.
  - Files are stored on local disk outside `public/`, behind a small storage interface so S3 could replace it later, and are only served to staff and to the student who submitted them.
- **Grades:** whole numbers from 0 to 100, classified as Fail below 40, Pass from 40, Merit from 60, and Distinction from 70.
- **Publishing:**
  - Results are published or withheld per student per module.
  - A module's results can only be published once the student has a grade for every assessment in it.
  - "Publish all" skips withheld and incomplete results and reports how many it published and skipped.
  - Pending and withheld results look the same to the student ("Results not yet released"), and their grades never leave the server.
  - Changing a grade that is already published asks staff to confirm first.
- **Privacy of other students' data:** a student asking for another student's record, fees, file, or results gets a 404, so the record's existence is not revealed.

**Out of scope:** a self-service "Forgot password?" email link, resetting staff passwords, user management, screens for editing programmes, modules, and fee plans (they come from the seed), editing or refunding payments, file version history, notifications, and deployment.

## How it is built

- `src/domain/`: pure business rules with no database access (Student IDs, academic years, instalment dates, balances, submission rules, classification, publishing rules), covered by unit tests.
- `src/server/`: one service per area (students, fees, assessments, submissions, results, and the dashboard figures), plus authentication, file storage, and the shared error handling.
- `src/app/api/`: Route Handlers that check the session and role, validate input with Zod, and call a service. Every error comes back as `{ "error": { "code", "message", "fields" } }`.
- `src/app/staff/` and `src/app/student/`: the pages for each role, built with Tailwind CSS and shadcn/ui.
- `src/components/`: the shared shell (`app-shell.tsx`, `sidebar-content.tsx`, `nav-links.tsx`, `phone-menu.tsx`), the dashboard tiles (`stat-tile.tsx`), and the status badges, which all draw their colours from `src/app/theme.css`.
- `prisma/schema.prisma` and `prisma/migrations/`: the data model, with database checks for grade range and positive amounts. `docs/database-schema.md` has a diagram.
- `prisma/seed.ts` and `prisma/seed/`: the demo data.

Race conditions are handled in the database: Student IDs come from an atomic counter, and payments, grade changes, publishing, and uploads lock the student's row, so two requests at the same moment cannot produce duplicate IDs, overpayments, or orphaned files.

## API routes

| Method and path | Who | What it does |
|---|---|---|
| `GET, POST /api/students` | Staff | List (with `q`, `programmeId`, `status`) or create students |
| `GET /api/students/[id]` | Staff, the student | Read a student record |
| `PATCH /api/students/[id]` | Staff | Edit a student record |
| `PUT /api/students/[id]/password` | Staff | Set a temporary password the student must change (`{ "temporaryPassword" }`, answers 204) |
| `GET /api/students/[id]/fees` | Staff, the student | Bill, balances, and payment history |
| `POST /api/students/[id]/payments` | Staff | Record a payment |
| `GET /api/assessments` | Staff, students | All assessments with counts, or a student's own |
| `POST /api/assessments` | Staff | Create an assessment |
| `GET, PATCH /api/assessments/[id]` | Staff | Submissions for an assessment; edit, close, or reopen it |
| `POST /api/assessments/[id]/submission` | Students | Upload or replace a file (multipart field `file`) |
| `GET /api/submissions/[id]/file` | Staff, the student | Download a submitted file |
| `PUT /api/assessments/[id]/grades/[studentId]` | Staff | Set or clear a grade |
| `PUT /api/students/[id]/modules/[moduleId]/result` | Staff | Publish, withhold, or return results to pending |
| `POST /api/modules/[id]/publish` | Staff | Publish every complete, pending result on a module |
| `GET /api/students/[id]/results` | Staff, the student | The student's marksheet (published modules only) |

## Tests

| Command | What it runs |
|---|---|
| `npm test` | Unit tests for the business rules in `src/domain` |
| `npm run test:integration` | API tests that call the Route Handlers against the `registry_test` database |
| `npm run test:e2e` | Playwright browser tests against a production build and freshly seeded `registry_test` data |

Before the first Playwright run, install its browser once:

```bash
npx playwright install chromium
```

Other checks: `npm run lint` and `npm run typecheck`.

The Playwright tests are named after the scenarios in the specs (`openspec/changes/build-registry-module/specs/`), and `e2e/journey.spec.ts` follows one student from enrolment to a released result across both roles.

## How AI was used

This project was built with Claude Code (Anthropic) as a pair programmer, following a spec-first, test-first workflow set out in `AGENTS.md`.

- **Planning with OpenSpec:** the brief was turned into an OpenSpec change (`openspec/changes/build-registry-module/`) with a proposal, five capability specs written as testable scenarios, a design, and a task list.
  Before any code was written, the AI asked about the choices the brief leaves open, and I decided them: email and password login, fees in instalments, local file storage, and publishing per student per module.
  I also asked it to stay close to the brief and not add extra features.
- **Checking the plan:** the AI checked the plan against the brief and fixed the gaps it found, for example keeping database and demo passwords out of the repository.
  At my request it also made Playwright tests part of the workflow.
- **Building test-first:** each slice started with a failing test at one of three seams I approved (pure domain functions, API routes against a real test database, and Playwright in a real browser), then the code to pass it.
  Nothing internal is mocked; the only thing tests set is who is signed in.
- **Reviewing the UI:** after each part, the AI took screenshots at desktop and phone widths and fixed problems it found, such as a table that cut off columns on phones and a confirmation message that disappeared after a late upload.
- **What I checked myself:** I reviewed the plan and the summary of each part, and decided every product question above.

The task list in `openspec/changes/build-registry-module/tasks.md` shows the order the work was done in.
