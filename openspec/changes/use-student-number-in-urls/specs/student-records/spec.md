# Spec Delta

## ADDED Requirements

### Requirement: Student pages are addressed by Student ID
Staff pages for a single student SHALL use the student's Student ID in the URL, for the record (`/staff/students/<Student ID>`), the edit page (`/staff/students/<Student ID>/edit`), and the fees page (`/staff/students/<Student ID>/fees`).
Every link the app shows to these pages SHALL use the Student ID.

#### Scenario: Opening a student from the list
- **WHEN** staff click a student in the student list
- **THEN** the student's record opens at `/staff/students/<Student ID>`, for example `/staff/students/SMS-2026-0001`

#### Scenario: Opening fees and edit from the record
- **WHEN** staff click "Fees and payments" or "Edit" on a student's record
- **THEN** the page opens at `/staff/students/<Student ID>/fees` or `/staff/students/<Student ID>/edit`

#### Scenario: Opening fees from the overdue list
- **WHEN** staff click a student's name in the dashboard's overdue balances list
- **THEN** the student's fees page opens at `/staff/students/<Student ID>/fees`

#### Scenario: After creating or editing a student
- **WHEN** staff save a new student or changes to a student
- **THEN** they are taken to `/staff/students/<Student ID>`

#### Scenario: Typing a Student ID into the address bar
- **WHEN** staff open `/staff/students/SMS-2026-0001` directly
- **THEN** that student's record is shown

#### Scenario: Unknown Student ID or internal id
- **WHEN** staff open a student URL with a Student ID that does not exist, or with the student's internal database id
- **THEN** the not-found page is shown
