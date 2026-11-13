# Spec Delta

## Purpose

Controls who can use the Registry module: people sign in with an email and password, and each person acts as either Staff or a Student, which decides the pages, data, and API routes available to them.

## ADDED Requirements

### Requirement: Sign in with email and password
The system SHALL let a person sign in with the email address and password of their account.
Email matching SHALL be case-insensitive.
A failed sign-in SHALL show one generic error that does not reveal whether the email exists.

#### Scenario: Valid credentials
- **WHEN** a person submits the email and password of an existing account
- **THEN** they are signed in and taken to the home page for their role: the Registry dashboard for Staff, and their assessments for a Student

#### Scenario: Wrong password or unknown email
- **WHEN** a person submits a password that does not match, or an email with no account
- **THEN** they stay on the sign-in page and see "Invalid email or password"

#### Scenario: Email in different letter case
- **WHEN** a person signs in as `Jane.Doe@Example.com` and the account email is `jane.doe@example.com`
- **THEN** they are signed in

### Requirement: Every account has exactly one role
Each account SHALL have exactly one role, Staff or Student.
A Student account SHALL be linked to exactly one student record, and a student record SHALL have at most one account.

#### Scenario: Student account shows its own record
- **WHEN** a Student signs in
- **THEN** the student pages show the name and Student ID of the linked student record

### Requirement: Signed-out visitors cannot reach the application
Every page other than the sign-in page, and every API route other than those used to sign in, SHALL require a signed-in session.

#### Scenario: Visiting a page while signed out
- **WHEN** a signed-out visitor opens any application page
- **THEN** they are redirected to the sign-in page

#### Scenario: Calling an API route while signed out
- **WHEN** a request without a valid session calls any API route other than the sign-in routes
- **THEN** the response has status 401 and no data

### Requirement: Staff-only functions are refused to Students
Staff pages and staff API operations SHALL be refused to Student sessions, enforced on the server for every request.

#### Scenario: Student opens a staff page
- **WHEN** a signed-in Student opens a staff page such as the student list
- **THEN** they are redirected to their own home page

#### Scenario: Student calls a staff API operation
- **WHEN** a Student session calls a staff-only API operation, such as recording a payment
- **THEN** the response has status 403 and nothing is changed

### Requirement: Students only see their own data
A Student session SHALL only read or change data that belongs to its own student record.

#### Scenario: Student requests another student's data
- **WHEN** a Student requests another student's fees, submission file, or results by changing an ID in the URL or request
- **THEN** the response has status 404 and reveals nothing about that student

### Requirement: Sign out
A signed-in person SHALL be able to sign out, which ends the session.

#### Scenario: Signing out
- **WHEN** a signed-in person chooses "Sign out"
- **THEN** the session ends and they are taken to the sign-in page

### Requirement: Passwords are never stored or shown in plain text
Passwords SHALL be stored only as a one-way hash and SHALL never appear in API responses, pages, or logs.

#### Scenario: Reading a student record
- **WHEN** staff view or fetch a student record that has an account
- **THEN** the response contains no password or password hash
