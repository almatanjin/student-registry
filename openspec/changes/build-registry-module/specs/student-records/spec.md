# Spec Delta

## Purpose

Lets the Registry team create, view, and maintain student records, each with a unique Student ID and an enrolment status, and find students quickly by name, ID, programme, or status.

## ADDED Requirements

### Requirement: Staff create a student record
Staff SHALL be able to create a student record with full name, email, date of birth, programme, academic year, enrolment status, and an initial password for the student's sign-in account.
All fields SHALL be required, and creating the record SHALL also create the student's account with the Student role.

#### Scenario: Valid new student
- **WHEN** staff submit a complete, valid new-student form
- **THEN** the record and its Student account are created and staff are taken to the new student's page

#### Scenario: Missing or invalid fields
- **WHEN** staff submit the form with a field missing, an invalid email, or an initial password shorter than 8 characters
- **THEN** nothing is created and each problem is shown next to its field

### Requirement: Student details are validated
The email SHALL be unique across all accounts, compared case-insensitively.
The date of birth SHALL be a past date.
The academic year SHALL be written as a start and end year one apart, such as `2025/26`.

#### Scenario: Duplicate email
- **WHEN** staff create or edit a student using an email that another account already has, in any letter case
- **THEN** the change is rejected with "This email is already in use"

#### Scenario: Date of birth in the future
- **WHEN** staff enter a date of birth that is today or later
- **THEN** the change is rejected with a message on the date of birth field

#### Scenario: Malformed academic year
- **WHEN** staff enter an academic year such as `2025/27` or `2025`
- **THEN** the change is rejected with a message on the academic year field

### Requirement: Student IDs are generated automatically
The system SHALL assign each new student a Student ID of the form `SMS-<YYYY>-<NNNN>`, where `YYYY` is the start year of the student's academic year and `NNNN` is a sequence number for that year, padded to 4 digits.
Student IDs SHALL be unique, SHALL never change, and SHALL never be reused.

#### Scenario: First student of an academic year
- **WHEN** the first student is created for academic year `2025/26`
- **THEN** their Student ID is `SMS-2025-0001`

#### Scenario: Next student in the same year
- **WHEN** another student is created for `2025/26` after `SMS-2025-0001`
- **THEN** their Student ID is `SMS-2025-0002`

#### Scenario: Two students created at the same moment
- **WHEN** two staff members create students for the same academic year at the same time
- **THEN** each student receives a different Student ID

#### Scenario: Staff cannot set the ID
- **WHEN** staff create or edit a student
- **THEN** the Student ID cannot be entered or changed

### Requirement: Enrolment status
Every student SHALL have exactly one enrolment status: Enrolled, Deferred, Withdrawn, or Completed.
Staff SHALL be able to change it at any time.
Students SHALL NOT be deleted; leaving the institution is recorded as a status.

#### Scenario: Changing status
- **WHEN** staff change a student's status from Enrolled to Deferred
- **THEN** the new status is saved and shown wherever the student appears

#### Scenario: No delete action
- **WHEN** staff view a student record
- **THEN** there is no option to delete it

### Requirement: Staff edit a student record
Staff SHALL be able to edit a student's full name, email, date of birth, programme, academic year, and status, under the same validation as creation.
The programme or academic year SHALL NOT be changed once a payment has been recorded for the student.

#### Scenario: Editing details
- **WHEN** staff change a student's name and save
- **THEN** the new name is shown and the Student ID is unchanged

#### Scenario: Changing programme before any payment
- **WHEN** staff change the programme of a student who has no recorded payments
- **THEN** the change is saved and the student's fees are re-billed from the new programme

#### Scenario: Changing programme after a payment
- **WHEN** staff try to change the programme or academic year of a student who has a recorded payment
- **THEN** the change is rejected with a message that explains why

### Requirement: Staff search and filter the student list
The student list SHALL let staff search by name or Student ID, matching any part of either, case-insensitively, and filter by programme and by enrolment status.
Search and filters SHALL combine, and the list SHALL show each student's Student ID, name, programme, academic year, and status.

#### Scenario: Search by part of a name
- **WHEN** staff search for `ali`
- **THEN** the list shows every student whose name contains "ali" in any letter case, and no others

#### Scenario: Search by Student ID
- **WHEN** staff search for `2025-0003`
- **THEN** the list shows the student with ID `SMS-2025-0003`

#### Scenario: Combined filters
- **WHEN** staff filter by a programme and by status Withdrawn
- **THEN** the list shows only Withdrawn students on that programme

#### Scenario: No matches
- **WHEN** no student matches the search and filters
- **THEN** the list shows "No students match these filters" with a way to clear them

#### Scenario: Filters survive a reload
- **WHEN** staff reload the page or share its URL after searching and filtering
- **THEN** the same search, filters, and results are shown

### Requirement: Students view their own record
A Student SHALL be able to view their own record, read-only: Student ID, name, email, date of birth, programme, academic year, and status.

#### Scenario: Student profile
- **WHEN** a Student opens their profile
- **THEN** they see their own details and cannot edit them
