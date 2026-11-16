# Manual Testing Guide

This guide walks through the whole Registry module by hand, one area at a time.
Each area starts with the files to read so you understand how that part is built, then lists test cases with steps and the expected result.
Tick each box as you go.

The test cases follow the scenarios in the OpenSpec specs in `openspec/changes/build-registry-module/specs/`, so a manual pass here checks the same rules the automated tests check.

## 1. Before you start

### 1.1 Start from fresh demo data

1. Make sure PostgreSQL is running:

   ```bash
   docker compose up -d
   ```

2. Reset the demo data (this wipes the `registry` database and reloads the seed):

   ```bash
   npx prisma db seed
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the URL that `npm run dev` prints (usually http://localhost:3000).

Re-run the seed whenever a test changes data you need later, for example after recording a payment or publishing a result.
The seed works out its dates from today, so overdue fees, late submissions, and open assessments always exist.

### 1.2 Accounts

Every account uses the password set as `SEED_USER_PASSWORD` in your `.env` file.

| Role | Email | Useful for |
|---|---|---|
| Staff | `registrar@sms.example` | Every staff test |
| Staff | `registry.officer@sms.example` | A second staff session |
| Student | `amara.okafor@students.sms.example` | BSc, fully paid, CS101 results published |
| Student | `liam.chen@students.sms.example` | BSc, part-paid, late submission, CS101 results withheld |
| Student | `priya.patel@students.sms.example` | BSc, nothing paid, CS101 results pending (missing grade) |
| Student | `fatima.hassan@students.sms.example` | BSc, Withdrawn, overdue |
| Student | `sofia.rossi@students.sms.example` | MSc, overdue, DS501 results published |
| Student | `daniel.mensah@students.sms.example` | MSc, Completed, fully paid |
| Student | `noah.williams@students.sms.example` | MSc, Deferred, cannot submit |

Tip: use a normal browser window for staff and a private window for a student, so you can stay signed in as both at once.

### 1.3 Demo data you will meet

| Programme | Annual fee | Instalments | Modules |
|---|---|---|---|
| BSc (Hons) Computer Science | 9,000.00 | 3 x 3,000.00, due 1 Oct, 15 Jan, 15 Apr | CS101 Programming Fundamentals, CS102 Databases |
| MSc Data Science | 12,000.00 | 2 x 6,000.00, due 1 Oct, 1 Feb | DS501 Statistical Learning, DS502 Data Engineering |

| Assessment | Module | Deadline | Open | Seeded submissions |
|---|---|---|---|---|
| Lab report 1 | CS101 | 21 days ago | Yes | Amara on time, Liam 1 day late |
| Programming test | CS101 | 45 days ago | No | Amara, Liam, Priya, all on time |
| Query optimisation report | CS102 | In 14 days | Yes | Amara |
| Databases coursework | CS102 | 7 days ago | Yes | None |
| Normalisation exercise | CS102 | In 10 days | Yes | None |
| Regression project | DS501 | 30 days ago | No | Sofia, Daniel |
| Pipeline design | DS502 | In 21 days | Yes | None |

Seeded grades: Lab report 1 (Amara 72, Liam 55), Programming test (Amara 68, Liam 38, Priya 45), Regression project (Sofia 64, Daniel 81).

Seed files: `prisma/seed.ts` runs `prisma/seed/index.ts`, which calls `programmes.ts`, `staff.ts`, `students.ts`, `payments.ts`, `assessments.ts`, and `results.ts` in `prisma/seed/`.

## 2. Project map

Read this section once before testing.
It shows where each kind of code lives and how a request moves through the app.

### 2.1 How a request flows

```text
Browser
  -> src/proxy.ts                      signed-out visitors go to /sign-in; each role is kept to its own pages
  -> page (src/app/staff/..., src/app/student/...)   server component, reads data through a service
     or
  -> API route (src/app/api/.../route.ts)            checks session and role, validates input with Zod
  -> service (src/server/<area>/service.ts)          business logic and database access through Prisma
  -> domain rules (src/domain/*.ts)                  pure functions: balances, IDs, lateness, classification
  -> PostgreSQL (prisma/schema.prisma)
```

Client components (files with `"use client"`, such as forms) call the API routes through `src/lib/api-client.ts`.
Every API error comes back as `{ "error": { "code", "message", "fields" } }`, built in `src/server/http/errors.ts` and `src/server/http/route.ts`.

### 2.2 Folders and key files

| Path | What it holds |
|---|---|
| `SMS_Technical_Assessment.md` | The original brief |
| `README.md` | Setup, product decisions, API list, and how AI was used |
| `openspec/changes/build-registry-module/` | The plan: `proposal.md`, `design.md`, `tasks.md`, and the specs per capability |
| `openspec/changes/add-password-change/` | The plan for changing and resetting passwords |
| `prisma/schema.prisma` | The data model (accounts, programmes, students, instalments, payments, assessments, submissions, grades, module results) |
| `prisma/migrations/` | The SQL that creates the tables, including database checks for grade range and positive amounts |
| `docs/database-schema.md` | A diagram of the data model |
| `src/app/layout.tsx` | Root layout and fonts |
| `src/app/globals.css` | Tailwind setup and the full colour palette |
| `src/app/theme.css` | The easy place to change button colours, button rounding, and fonts |
| `src/app/page.tsx` | The root URL, which only redirects: to sign-in, to the change-password page, or to the role's home page |
| `src/app/change-password/` | The change-password page, its form, and the action that saves the new password |
| `src/app/session-ended/route.ts` | Clears a session that stopped working because the password changed elsewhere |
| `src/app/not-found.tsx` | The 404 page |
| `src/proxy.ts` | Runs before every request; redirects by sign-in state, role, and whether the password must be changed |
| `src/auth.ts`, `src/auth.config.ts` | Auth.js setup (email and password, session cookie) |
| `src/server/auth/` | Password hashing, credential check, current user (with the password version check), changing your own password, and the role and ownership guards |
| `src/domain/` | Pure business rules, each with a `.test.ts` unit test next to it |
| `src/domain/schemas/` | Zod validation for students, payments, assessments, and passwords |
| `src/server/<area>/service.ts` | One service per area: students, fees, assessments, submissions, results, programmes |
| `src/server/storage/` | File storage interface and the local-disk version (files go to `UPLOAD_DIR`) |
| `src/server/db.ts` | The shared Prisma client |
| `src/server/config.ts` | Reads `APP_TIMEZONE` and `APP_CURRENCY` |
| `src/components/` | Shared UI: app shell (navigation, Change password, Sign out), badges, page header, fee tables |
| `src/components/ui/` | shadcn/ui building blocks (button, input, table, and so on) |
| `src/lib/format.ts` | Money and date formatting |
| `tests/integration/` | API tests against the `registry_test` database |
| `e2e/` | Playwright browser tests, named after the spec scenarios |

## 3. Sign-in, access control, and passwords

### Files to read

| File | Why |
|---|---|
| `openspec/changes/build-registry-module/specs/access-control/spec.md` | The sign-in and access rules being tested |
| `openspec/changes/add-password-change/specs/access-control/spec.md` | The password rules being tested |
| `src/app/sign-in/page.tsx`, `sign-in-form.tsx`, `actions.ts` | The sign-in page and what happens on submit |
| `src/auth.ts`, `src/auth.config.ts` | Auth.js configuration and session contents (user id, role, student id) |
| `src/server/auth/credentials.ts`, `password.ts` | Email lookup (case-insensitive) and password hash check |
| `src/proxy.ts`, `src/domain/access.ts` | Which paths each role may open, and the home page per role |
| `src/server/auth/guards.ts`, `pages.ts`, `current-user.ts` | Role and ownership checks used by API routes and pages |
| `src/app/staff/layout.tsx`, `src/app/student/layout.tsx`, `src/components/app-shell.tsx`, `nav-links.tsx` | The navigation for each role and the Sign out button |
| `src/app/change-password/page.tsx`, `change-password-form.tsx`, `actions.ts` | The change-password page, its form, and the action that saves the new password and signs in again |
| `src/server/auth/account.ts`, `src/domain/schemas/password.ts` | Changing your own password, and the password rules |
| `src/app/session-ended/route.ts` | Clears a session that ended because the password changed elsewhere |
| `src/app/staff/students/[id]/reset-password-form.tsx`, `src/app/api/students/[id]/password/route.ts` | Staff reset of a student's password |
| `e2e/access-control.spec.ts`, `e2e/password-change.spec.ts`, `tests/integration/access-control/` | The automated versions of these checks |

### Test cases: sign-in and access

- [ ] **Staff sign-in.**
  Sign in as `registrar@sms.example`.
  Expected: you land on the Registry dashboard, and the navigation shows Dashboard, Students, Assessments, Results, Programmes.
- [ ] **Student sign-in.**
  Sign in as `amara.okafor@students.sms.example`.
  Expected: you land on "Your assessments", and the navigation shows only student pages.
- [ ] **Student sees their own record.**
  As Amara, open Profile.
  Expected: Amara's name and Student ID are shown, with no edit controls.
- [ ] **Wrong password.**
  Enter a valid email and a wrong password.
  Expected: you stay on sign-in and see "Invalid email or password".
- [ ] **Unknown email.**
  Enter an email with no account.
  Expected: the same "Invalid email or password" message, so the page does not reveal which emails exist.
- [ ] **Email letter case.**
  Sign in as `Registrar@SMS.Example`.
  Expected: sign-in works.
- [ ] **Signed-out page visit.**
  Sign out, then open `/staff/students` directly.
  Expected: you are sent to the sign-in page.
- [ ] **Signed-out API call.**
  While signed out, open `/api/students` in the browser.
  Expected: status 401 with an error JSON body and no student data.
- [ ] **Student opens a staff page.**
  As a student, open `/staff/students` or `/staff/dashboard`.
  Expected: you are sent back to your own assessments page.
- [ ] **Staff opens a student page.**
  As staff, open `/student/marksheet`.
  Expected: you are sent back to the dashboard.
- [ ] **Student calls a staff API.**
  As a student, open `/api/students`.
  Expected: status 403 and no data.
- [ ] **Student requests another student's data.**
  As staff, open Fatima's record and copy her id from the URL (`/staff/students/<id>`).
  Sign in as Amara and open `/api/students/<Fatima's id>/fees`, then `/api/students/<Fatima's id>/results`.
  Expected: status 404 for both, with nothing about Fatima in the response.
- [ ] **Student reads their own API data.**
  As Amara, copy her id from staff view in the same way and open `/api/students/<Amara's id>/fees`.
  Expected: status 200 with her own bill and payments.
- [ ] **No password in responses.**
  As staff, open `/api/students/<any id>`.
  Expected: the JSON has no `password` or `passwordHash` field.
- [ ] **Sign out.**
  Click "Sign out".
  Expected: you are on the sign-in page, and opening `/staff/dashboard` again sends you back to sign-in.
- [ ] **Root URL.**
  Open `/` signed out, as staff, and as a student.
  Expected: it sends you to sign-in, the dashboard, and your assessments respectively.
  A student who still has to change their password is sent to the change-password page instead.
- [ ] **Unknown page.**
  Open `/does-not-exist`.
  Expected: the app's not-found page with a link back to the registry.

### Test cases: passwords

These tests create their own students, so the seeded demo accounts keep the seed password.
If you change the password of a seeded account, re-run the seed afterwards to set it back.

**First sign-in of a new student**

- [ ] **New student must change the initial password.**
  As staff, add a student with an initial password, then sign in as that student.
  Expected: the change-password page with "Choose a new password before you continue", no navigation, and a "Sign out" button.
- [ ] **Cannot skip the change.**
  While on that page, open `/student/assessments`, `/student/fees`, `/`, and `/sign-in`.
  Expected: each one sends you back to the change-password page.
- [ ] **API refused before the change.**
  Still on that page, open `/api/assessments`.
  Expected: status 403 with "Change your password before you continue".
- [ ] **Sign out instead of changing.**
  Click "Sign out", then sign in again with the initial password.
  Expected: you are asked to change it again.
- [ ] **Change the initial password.**
  Enter the initial password as the current one and a new password twice, then click "Change password".
  Expected: you land on your assessments and can use every page, and only the new password works from now on.
- [ ] **Seeded accounts are not forced.**
  After a fresh seed, sign in as `amara.okafor@students.sms.example` and as `registrar@sms.example`.
  Expected: each goes straight to its home page.

**Changing your own password**

- [ ] **Finding the page.**
  As staff and as a student, click "Change password" in the header.
  Expected: the change-password page, showing "Signed in as" with your email and a "Back to the registry" link to your home page.
- [ ] **Change your password any time.**
  Enter your current password and a new password twice, then click "Change password".
  Expected: you stay on the change-password page, still signed in, and see "Your password has been changed".
  After signing out, the old password gives "Invalid email or password" and the new one works.
- [ ] **Wrong current password.**
  Enter a current password that does not match.
  Expected: "Your current password is incorrect" next to Current password, and the password is unchanged.
- [ ] **New password too short.**
  Enter a new password of 5 characters in both new password fields.
  Expected: "Use at least 8 characters" next to New password.
- [ ] **Passwords do not match.**
  Enter two different new passwords.
  Expected: "The passwords do not match" next to Confirm new password.
- [ ] **Same as the current password.**
  Enter your current password as the new one.
  Expected: "Choose a password different from your current one" next to New password.
- [ ] **Empty form.**
  Click "Change password" with every field empty.
  Expected: "Enter your current password", "Use at least 8 characters", and "Enter the new password again", each next to its field.
- [ ] **Other sessions end.**
  Sign in as the same student in a normal and a private window, change the password in one, then open any page in the other.
  Expected: the other window is sent to the sign-in page, and the window you changed it in stays signed in.

**Staff reset of a forgotten password**

- [ ] **Reset form.**
  As staff, open a student's record.
  Expected: a "Sign-in" card with a "Reset password" button; clicking it shows a Temporary password field, "Set temporary password", and "Cancel".
- [ ] **Temporary password too short.**
  Enter 5 characters and click "Set temporary password".
  Expected: "Use at least 8 characters" next to the field, and the password is unchanged.
- [ ] **Resetting a forgotten password.**
  Enter a temporary password of 8 or more characters and click "Set temporary password".
  Expected: "Password reset. The student must choose a new password when they next sign in".
  The student's old password no longer works, and the temporary one leads to the change-password page.
- [ ] **Reset signs the student out.**
  Reset the password of a student who is signed in in another window, then open a page in that window.
  Expected: the student is sent to the sign-in page.
- [ ] **Students cannot reset passwords.**
  As a student, check your pages.
  Expected: no reset option anywhere; only "Change password" for your own account.
- [ ] **No password in the reset response.**
  With the browser's developer tools open on the Network tab, reset a password as staff.
  Expected: the `PUT /api/students/<id>/password` request answers 204 with an empty body.

## 4. Student records

### Files to read

| File | Why |
|---|---|
| `openspec/changes/build-registry-module/specs/student-records/spec.md` | The rules being tested |
| `src/app/staff/students/page.tsx` | The student list (server page that reads filters from the URL) |
| `src/app/staff/students/student-filters.tsx` | Search as you type and the filter dropdowns |
| `src/app/staff/students/new/page.tsx`, `[id]/edit/page.tsx`, `student-form.tsx` | Create and edit forms |
| `src/app/staff/students/[id]/page.tsx` | The student detail page |
| `src/app/student/profile/page.tsx` | The student's read-only profile |
| `src/app/api/students/route.ts`, `src/app/api/students/[id]/route.ts` | List, create, read, and update API routes |
| `src/server/students/service.ts` | Create (with the ID counter and account), edit, the payment lock, and search |
| `src/domain/student-number.ts`, `academic-year.ts`, `src/domain/schemas/student.ts` | Student ID format, academic year parsing, and field validation |
| `src/components/status-badge.tsx` | Enrolment status badges |
| `e2e/student-records.spec.ts`, `tests/integration/student-records/` | The automated versions |

### Test cases: list, search, and filters

Sign in as staff and open Students.

- [ ] **Full list.**
  Expected: 7 students, each showing Student ID, name, programme, academic year, and status badge.
- [ ] **Search while typing.**
  Type `ross` in the Search box without pressing Enter.
  Expected: after a short pause only Sofia Rossi is shown, the URL contains `q=ross`, and the cursor stays in the search box.
- [ ] **Search ignores letter case.**
  Type `ROSS`.
  Expected: Sofia Rossi is shown.
- [ ] **Search by part of a Student ID.**
  Type the year and number part of an ID shown in the list (for example `2025-0002`).
  Expected: only that student is shown.
- [ ] **Programme filter.**
  Choose "MSc Data Science".
  Expected: the list updates immediately and shows only MSc students.
- [ ] **Combined filters.**
  Choose "BSc (Hons) Computer Science" and status "Withdrawn".
  Expected: only Fatima Hassan.
- [ ] **No matches.**
  Choose "MSc Data Science" and "Withdrawn".
  Expected: "No students match these filters" with a "Clear filters" link.
- [ ] **Clear filters.**
  Click "Clear filters".
  Expected: the URL is `/staff/students`, the search box and dropdowns reset, and all 7 students show.
- [ ] **Filters survive a reload.**
  Search `a`, choose status "Enrolled", then reload the page.
  Expected: the same search text, filter, and results.
- [ ] **Shared link.**
  Copy the filtered URL into a new tab.
  Expected: the same filtered results.
- [ ] **Back button.**
  Type a search, then press the browser Back button.
  Expected: you leave the students page in one step instead of going back through each letter typed.

### Test cases: create a student

Click "Add student".

- [ ] **No Student ID field.**
  Expected: the form has no field to enter a Student ID.
- [ ] **Empty form.**
  Click "Create student" with everything empty.
  Expected: nothing is created and each required field shows its own message.
- [ ] **Invalid email and short password.**
  Enter `not-an-email` and a 5-character initial password.
  Expected: messages next to Email and Initial password.
- [ ] **Date of birth today or in the future.**
  Expected: a message on Date of birth.
- [ ] **Malformed academic year.**
  Try `2025/27`, then `2025`.
  Expected: a message on Academic year each time.
- [ ] **Duplicate email.**
  Use `AMARA.OKAFOR@students.sms.example`.
  Expected: "This email is already in use".
- [ ] **Valid new student.**
  Fill every field correctly (BSc programme, current academic year, status Enrolled, password of 8 or more characters).
  Expected: you land on the new student's page, with a generated ID like `SMS-<year>-<next number>`.
- [ ] **Next ID in sequence.**
  Create a second student for the same academic year.
  Expected: the number part goes up by one.
- [ ] **New student can sign in.**
  Sign in with the new student's email and initial password, then choose a new password when asked.
  Expected: first the change-password page, then their assessments page, showing their programme's assessments.
- [ ] **New student is billed.**
  As staff, open the new student's fees page.
  Expected: three instalments of 3,000.00 dated for their academic year (see section 5).

### Test cases: edit and status

- [ ] **Edit name.**
  Open a student, click edit, change the name, and save.
  Expected: the new name shows and the Student ID is unchanged.
- [ ] **Change status.**
  Change a student from Enrolled to Deferred.
  Expected: the Deferred badge shows on the detail page and in the list.
- [ ] **No delete.**
  Expected: there is no delete button anywhere on a student record.
- [ ] **Change programme before any payment.**
  Edit Priya Patel (nothing paid) and move her to MSc Data Science.
  Expected: saved, and her fees page now shows two instalments of 6,000.00.
- [ ] **Change programme after a payment.**
  Edit Amara Okafor (has payments) and try to change her programme or academic year.
  Expected: the change is refused with a message explaining that payments exist.
- [ ] **Duplicate email on edit.**
  Change a student's email to another student's email.
  Expected: "This email is already in use".

Re-run the seed after this section.

## 5. Fees and payments

### Files to read

| File | Why |
|---|---|
| `openspec/changes/build-registry-module/specs/student-fees/spec.md` | The rules being tested |
| `prisma/schema.prisma` (`Programme`, `FeePlanInstalment`, `StudentInstalment`, `Payment`) | How fees and payments are stored |
| `src/server/fees/billing.ts` | Copies the programme's fee plan into a student's instalments |
| `src/domain/fees.ts` | Instalment dates, balance, due to date, overdue amount, and instalment states |
| `src/domain/money.ts`, `src/lib/format.ts` | Money in pence and how it is shown |
| `src/domain/dates.ts` | "Today" in the app's time zone |
| `src/server/fees/service.ts` | Recording payments (duplicate reference, overpayment, row lock) |
| `src/server/fees/overdue.ts` | The dashboard's overdue list |
| `src/domain/schemas/payment.ts` | Payment field validation |
| `src/app/staff/programmes/page.tsx` | Fee plans per programme |
| `src/app/staff/students/[id]/fees/page.tsx`, `payment-form.tsx` | Staff fees page and the Record payment form |
| `src/app/staff/dashboard/page.tsx` | Overdue balances |
| `src/app/student/fees/page.tsx`, `src/components/fees.tsx` | The student's fees page and the shared fee tables |
| `src/app/api/students/[id]/fees/route.ts`, `payments/route.ts` | Fees and payments API |
| `e2e/student-fees.spec.ts`, `tests/integration/student-fees/` | The automated versions |

### Test cases

- [ ] **Programme fee plan.**
  Open Programmes.
  Expected: BSc shows 9,000.00 as three instalments of 3,000.00 (1 Oct, 15 Jan, 15 Apr), MSc shows 12,000.00 as two of 6,000.00 (1 Oct, 1 Feb), and each plan adds up to its annual fee.
- [ ] **Billed from the programme.**
  Open Liam Chen's fees page.
  Expected: his instalments match the BSc plan, dated within his academic year (September to August).
- [ ] **Instalment states.**
  On a fees page with a mix of instalments, check the state of each.
  Expected: paid instalments show as paid, past-due unpaid ones as overdue, and future ones as upcoming, in due-date order.
- [ ] **Overdue on the dashboard.**
  Open Dashboard.
  Expected: Fatima Hassan and Sofia Rossi are listed with their overdue amounts, highest first.
- [ ] **Withdrawn student still listed.**
  Expected: Fatima appears on the overdue list with her status shown as Withdrawn.
- [ ] **Fully paid student not listed.**
  Expected: Amara Okafor and Daniel Mensah are not on the overdue list.
- [ ] **Valid payment.**
  On Priya Patel's fees page, record 2,500.00 dated today with reference `BANK-77812`.
  Expected: it appears in Payment history and the outstanding balance drops by 2,500.00 straight away.
- [ ] **Duplicate reference.**
  Record another payment with reference `bank-77812` (different letter case).
  Expected: "This reference number has already been recorded".
- [ ] **Invalid amounts.**
  Try `0`, `-5`, and `10.123`.
  Expected: each is rejected with a message on the amount field.
- [ ] **Future date.**
  Try a payment dated tomorrow.
  Expected: "The payment date cannot be in the future".
- [ ] **Overpayment.**
  Try a payment larger than the outstanding balance.
  Expected: rejected with a message stating the outstanding balance.
- [ ] **Paying off in full.**
  Record a payment of exactly the outstanding balance.
  Expected: saved, and the outstanding balance is 0.00.
- [ ] **Paying clears the overdue flag.**
  On Sofia Rossi's fees page, pay her overdue amount, then open Dashboard.
  Expected: Sofia is no longer on the overdue list, with no refresh needed beyond opening the page.
- [ ] **Nobody overdue.**
  Pay off Fatima as well.
  Expected: the dashboard shows "No overdue balances".
- [ ] **Student sees their overdue amount.**
  Re-seed, then sign in as Sofia Rossi and open Fees.
  Expected: the overdue amount is highlighted together with the instalment it relates to.
- [ ] **Student cannot record payments.**
  Expected: the student fees page has no payment form.

Re-run the seed after this section.

## 6. Assessments and submissions

### Files to read

| File | Why |
|---|---|
| `openspec/changes/build-registry-module/specs/assessment-submissions/spec.md` | The rules being tested |
| `src/app/staff/assessments/page.tsx`, `new/page.tsx`, `assessment-form.tsx` | Staff list and create form |
| `src/app/staff/assessments/[id]/page.tsx`, `open-toggle.tsx`, `[id]/edit/page.tsx` | Submissions per assessment, close or reopen, edit deadline |
| `src/app/student/assessments/page.tsx`, `[id]/page.tsx`, `upload-form.tsx` | The student's list and upload page |
| `src/server/assessments/service.ts` | Create, edit, close, reopen, and the counts |
| `src/server/submissions/service.ts` | Upload rules, replacement, lateness, and file download |
| `src/domain/submissions.ts` | File type check by content, size limit, and the late rule |
| `src/server/storage/file-storage.ts`, `local-disk.ts`, `index.ts` | Where files are stored (`UPLOAD_DIR`, outside `public/`) |
| `src/components/assessment-badges.tsx` | On time, Late, and Missing badges |
| `src/app/api/assessments/...`, `src/app/api/submissions/[id]/file/route.ts` | Assessment, upload, and download API |
| `e2e/assessment-submissions.spec.ts`, `tests/integration/assessment-submissions/` | The automated versions |

Have these files ready: a small PDF and a DOCX, a PNG, a PNG renamed to `.pdf`, an empty file, and a file over 10 MB.
`tests/fixtures/` has `sample.pdf`, `sample.docx`, and `sample.png`.

### Test cases: staff

- [ ] **Create a valid assessment.**
  As staff, click "New assessment", enter title "Essay 1", choose CS102, and set a deadline next week.
  Expected: it is created as open and appears in the list.
- [ ] **Deadline in the past.**
  Try a deadline earlier than now.
  Expected: "The deadline must be in the future" on the deadline field.
- [ ] **Empty title.**
  Expected: "Enter a title".
- [ ] **Mixed submissions view.**
  Open "Lab report 1".
  Expected: Amara shows On time, Liam shows Late (visibly flagged), Priya shows Missing, and the counts at the top match.
- [ ] **Download a submission.**
  Click a submitted file.
  Expected: the file downloads with its original name.
- [ ] **Close an assessment.**
  On "Normalisation exercise", click "Close for submissions".
  Expected: it shows as closed, and existing submissions stay.
- [ ] **Reopen.**
  Click "Reopen for submissions".
  Expected: it is open again.
- [ ] **Extend a deadline clears late.**
  Edit "Lab report 1" and move its deadline to after Liam's submission time (for example to next week).
  Expected: Liam's submission is no longer shown as Late.

Re-run the seed after the last test.

### Test cases: students

- [ ] **Assessment list.**
  Sign in as Amara.
  Expected: only CS101 and CS102 assessments (none from DS501 or DS502), each with its deadline and her own state.
- [ ] **Valid upload.**
  Open "Normalisation exercise" and upload a PDF.
  Expected: a confirmation, with the file name and the time received.
- [ ] **DOCX upload.**
  Upload a DOCX to an open assessment.
  Expected: accepted.
- [ ] **Resubmit before the deadline.**
  Upload a different file to "Normalisation exercise".
  Expected: the new file replaces the old one, and only the new name and time are shown.
- [ ] **Wrong file type.**
  Upload a PNG, then a PNG renamed to `.pdf`.
  Expected: "Upload a PDF or DOCX file" both times.
- [ ] **Empty or too large.**
  Upload an empty file, then one over 10 MB.
  Expected: rejected each time with a message giving the reason.
- [ ] **First submission after the deadline.**
  As Priya, upload to "Databases coursework" (deadline passed, still open).
  Expected: accepted and shown as Late, with the time received.
- [ ] **Resubmit after the deadline.**
  As Amara, open "Lab report 1" (she has already submitted, deadline passed).
  Expected: she cannot replace it, and the page says "The deadline has passed, so your submission can no longer be replaced".
- [ ] **Closed assessment.**
  Open "Programming test".
  Expected: "This assessment is closed" and no upload control.
- [ ] **Not enrolled.**
  Sign in as Noah Williams (Deferred) and open "Pipeline design".
  Expected: the upload is refused and the page says "Only enrolled students can submit work".
- [ ] **Download own file.**
  As Amara, download her own submission.
  Expected: the file downloads with its original name.
- [ ] **Another student's file.**
  As staff, copy the download link of Amara's file.
  As Liam, open that link.
  Expected: status 404.
- [ ] **Files are not public.**
  Check that uploaded files are in the `uploads/` folder (or your `UPLOAD_DIR`), and not under `public/`.

Re-run the seed after this section.

## 7. Grades and results

### Files to read

| File | Why |
|---|---|
| `openspec/changes/build-registry-module/specs/student-results/spec.md` | The rules being tested |
| `src/app/staff/assessments/[id]/grade-cell.tsx` | Inline grade entry, and the confirmation before changing a published grade |
| `src/app/staff/results/page.tsx`, `[moduleId]/page.tsx`, `result-actions.tsx` | Module results, per-student Publish, Withhold, Return to pending, and Publish all |
| `src/server/results/service.ts` | Grade saving, publish rules, bulk publish, and the student marksheet |
| `src/domain/results.ts` | Classification (Fail, Pass, Merit, Distinction) and the "complete results" rule |
| `src/components/result-badges.tsx` | Classification and release-state badges |
| `src/app/student/marksheet/page.tsx` | What the student sees |
| `src/app/api/assessments/[id]/grades/[studentId]/route.ts`, `src/app/api/students/[id]/modules/[moduleId]/result/route.ts`, `src/app/api/modules/[id]/publish/route.ts`, `src/app/api/students/[id]/results/route.ts` | Grades and results API |
| `e2e/student-results.spec.ts`, `e2e/journey.spec.ts`, `tests/integration/student-results/` | The automated versions |

### Test cases: grades

- [ ] **Enter a grade.**
  As staff, open "Normalisation exercise" and enter 72 for Amara.
  Expected: saved, shown with classification Distinction.
- [ ] **Invalid grades.**
  Try `-1`, `101`, `65.5`, and `abc`.
  Expected: "Enter a whole number from 0 to 100" each time, and the previous value is kept.
- [ ] **Grade for a student with no submission.**
  Enter 0 for a student marked Missing.
  Expected: saved, classified Fail.
- [ ] **Classification boundaries.**
  Enter 39, 40, 59, 60, 69, and 70 (one at a time, or across students).
  Expected: Fail, Pass, Pass, Merit, Merit, Distinction.
- [ ] **Marksheet view.**
  Open "Lab report 1".
  Expected: each student shows the late flag where their submission was late, their grade, and its classification.

### Test cases: publishing

Open Results, then CS101.

- [ ] **Release states.**
  Expected: Amara Published, Liam Withheld, Priya Pending.
- [ ] **Missing grade blocks publishing.**
  Try to publish Priya.
  Expected: refused with a message naming "Lab report 1" as missing a grade.
- [ ] **Withhold a published result.**
  Withhold Amara.
  Expected: Amara's state is Withheld, and as Amara her marksheet now shows "Results not yet released" for CS101.
- [ ] **Publish all skips withheld and incomplete.**
  Re-seed, then on CS101 click "Publish all" without changing anything.
  Expected: "0 published, 4 skipped", because every BSc student is counted: Amara is already Published, Liam is Withheld, and Priya and Fatima are missing grades.
  Then give Priya a grade for "Lab report 1" and click "Publish all" again.
  Expected: "1 published, 3 skipped", Priya is now Published, and Liam is still Withheld.
- [ ] **Correcting a published grade.**
  Re-seed.
  On "Lab report 1", change Amara's grade from 72 to 61.
  Expected: a confirmation warning appears first; after confirming, Amara's marksheet shows 61, Merit.

### Test cases: student marksheet

- [ ] **Published module.**
  Sign in as Amara and open Marksheet.
  Expected: CS101 shows each assessment's grade and classification.
- [ ] **Withheld module looks like pending.**
  Sign in as Liam.
  Expected: CS101 shows "Results not yet released", exactly as a Pending module does.
- [ ] **Pending module.**
  Sign in as Priya.
  Expected: CS101 shows "Results not yet released".
- [ ] **Grades never leave the server.**
  As Liam, open `/api/students/<Liam's id>/results`.
  Expected: CS101 has no grade values in the JSON.

Re-run the seed after this section.

## 8. Whole journey

This repeats the end-to-end flow in `e2e/journey.spec.ts` by hand.

- [ ] As staff, create a new BSc student for the current academic year with status Enrolled.
- [ ] Check their generated Student ID and their three instalments.
- [ ] Record a payment for the first instalment.
- [ ] Sign in as the new student, choose a new password when asked, and upload a PDF to an open CS102 assessment.
- [ ] As staff, grade every CS102 assessment for that student.
- [ ] Publish the student's CS102 results.
- [ ] As the student, open Marksheet and see the grades and classifications.

## 9. Look and feel

### Files to read

| File | Why |
|---|---|
| `src/app/theme.css` | Button colour, rounding, and fonts |
| `src/app/globals.css` | Full palette and base styles |
| `src/components/ui/button.tsx` | How buttons use the theme settings |
| `src/components/page-header.tsx`, `app-shell.tsx` | Page titles and the top navigation |

### Test cases

- [ ] **Phone width.**
  Open the browser's device toolbar at 375 px wide and visit every page for both roles.
  Expected: no sideways scrolling, tables stay readable, and navigation is reachable.
- [ ] **Empty states.**
  Check that every list has a clear message when empty (for example a search with no matches, or a student with no payments).
- [ ] **Badges.**
  Expected: enrolment statuses, Late submissions, overdue amounts, and result states use consistent badges across pages.
- [ ] **Keyboard.**
  Use Tab to move through the sign-in form, the change-password form, the student filters, and the payment form.
  Expected: focus is visible and every control is reachable.
- [ ] **Theme change.**
  In `src/app/theme.css`, set `--app-button-background: #2563eb;` and save.
  Expected: every main button turns blue without restarting.
  Undo the change afterwards.

## 10. Automated checks

Run these after manual testing to confirm nothing else broke.

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run test:integration
```

```bash
npm run test:e2e
```

The Playwright report is written to `playwright-report/`; open it with:

```bash
npx playwright show-report
```

## 11. Sign-off

| Area | Tester | Date | Result | Notes |
|---|---|---|---|---|
| Sign-in and access control | | | | |
| Passwords | | | | |
| Student records | | | | |
| Fees and payments | | | | |
| Assessments and submissions | | | | |
| Grades and results | | | | |
| Whole journey | | | | |
| Look and feel | | | | |
| Automated checks | | | | |
