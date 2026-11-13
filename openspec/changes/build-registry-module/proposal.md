# Proposal

## Why

The Registry team needs one web application for the four workflows a Registry Administrator runs every day: enrolling students, tracking fees and payments, collecting assessment submissions, and releasing results.
The repository has no application code yet, so this change builds the Registry module end to end, as set out in the SMS technical assessment brief.

## What Changes

- New Next.js (App Router) application backed by PostgreSQL through Prisma, with a committed `schema.prisma`, a `.env.example`, a seed script, and a README.
- Email and password sign-in with two roles, Staff and Student, each seeing only its own views.
- Student enrolment: staff create and edit student records, get an auto-generated Student ID in the form `SMS-<year>-<sequence>`, set one of four enrolment statuses, and search and filter the student list.
- Fees and payments: each programme carries an annual fee split into dated instalments, every student is billed from their programme, staff record payments, the outstanding balance is always computed from the recorded data, and students with an overdue balance are flagged on the Registry dashboard.
- Assessment submission: staff create assessments for a module with a deadline, students upload one PDF or DOCX per assessment, may replace it before the deadline, and late submissions are accepted but flagged.
- Marksheet and results: staff enter a 0-100 grade per student per assessment, the system classifies it (Fail, Pass, Merit, Distinction), staff publish or withhold each student's results module by module, and students see only published results.
- Demo seed data: at least 5 students, 2 programmes, fees with payments (including an overdue case), assessments, submissions (including a late one), and sample grades (including a withheld module), plus demo staff and student logins.

## Capabilities

### New Capabilities

- `access-control`: Sign-in with email and password, the Staff and Student roles, and which pages and API routes each role may use.
- `student-records`: Student records, Student ID generation, enrolment statuses, and searching and filtering the student list.
- `student-fees`: Programme fees and instalments, fee accounts per student, payment recording, outstanding and overdue balances, and the overdue flag on the Registry dashboard.
- `assessment-submissions`: Staff-created assessments, student file uploads, resubmission before the deadline, late flagging, and access to submitted files.
- `student-results`: Grade entry, grade classification, per-student per-module publishing and withholding, and the student marksheet.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- New application code across the whole repository: Next.js app, Route Handler API under `/api`, Prisma schema and migrations, seed script, and tests.
- New dependencies: Next.js, React, Prisma, Auth.js, a password-hashing library, Zod, Tailwind CSS with shadcn/ui, and test tooling (Vitest and Playwright).
- Local development needs PostgreSQL, provided through a Docker Compose file, and a writable uploads directory for submission files.
- New top-level documentation: `README.md` covering local setup, environment variables, and how AI was used during the build.
