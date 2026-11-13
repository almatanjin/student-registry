# Spec Delta

## Purpose

Tracks what each student owes for their programme and what they have paid, keeps every balance current from the recorded payments, and shows the Registry team which students are overdue.

## ADDED Requirements

### Requirement: Programmes define an annual fee in instalments
Each programme SHALL have an annual fee split into dated instalments whose amounts add up to the annual fee.
Instalment due dates SHALL be defined within an academic year, so the same plan applies to every academic year.

#### Scenario: Programme fee plan
- **WHEN** staff view the fee plan of a programme with an annual fee of 9,000.00 in two instalments
- **THEN** they see each instalment's amount and due date, and the amounts add up to 9,000.00

### Requirement: Students are billed from their programme
When a student record is created, the system SHALL assign the student a fee for their academic year equal to their programme's annual fee, with one instalment per instalment in the programme's plan, dated within the student's academic year.
Later changes to a programme's plan SHALL NOT change fees already assigned.

#### Scenario: New student is billed
- **WHEN** a student is created on a programme whose fee is 9,000.00 in two instalments due 1 October and 1 February, for academic year `2025/26`
- **THEN** the student owes 9,000.00 in two instalments due 1 October 2025 and 1 February 2026

#### Scenario: Programme plan changes later
- **WHEN** a programme's annual fee is changed after students on it have been billed
- **THEN** those students' fees stay as they were billed

### Requirement: Staff record payments
Staff SHALL be able to record a payment against a student with an amount, a payment date, and a reference number, all required.
The amount SHALL be greater than zero with at most two decimal places, the date SHALL NOT be in the future, and the reference number SHALL be unique across all payments.

#### Scenario: Valid payment
- **WHEN** staff record a payment of 2,500.00 dated today with reference `BANK-77812`
- **THEN** the payment appears in the student's payment history and their outstanding balance drops by 2,500.00

#### Scenario: Duplicate reference number
- **WHEN** staff record a payment whose reference number is already used by any payment
- **THEN** the payment is rejected with "This reference number has already been recorded"

#### Scenario: Invalid amount or date
- **WHEN** staff record a payment of zero, a negative amount, an amount with three decimal places, or a date in the future
- **THEN** the payment is rejected and the problem is shown next to its field

### Requirement: Payments cannot exceed the outstanding balance
A payment SHALL be rejected when its amount is greater than the student's outstanding balance.

#### Scenario: Overpayment attempt
- **WHEN** a student owes 1,000.00 and staff record a payment of 1,200.00
- **THEN** the payment is rejected with a message stating the outstanding balance of 1,000.00

#### Scenario: Paying off in full
- **WHEN** a student owes 1,000.00 and staff record a payment of exactly 1,000.00
- **THEN** the payment is saved and the outstanding balance is 0.00

### Requirement: Balances are always current
Outstanding balance SHALL equal the total fee minus all recorded payments.
Due to date SHALL be the sum of instalments whose due date is before today.
Overdue amount SHALL be the due to date minus all payments, or zero if that is negative.
All three SHALL be computed from the recorded data each time they are shown.

#### Scenario: Balance after a payment
- **WHEN** staff record a payment and then open the student's fees page or the dashboard
- **THEN** both show the new balance with no further action

#### Scenario: Instalment falls due
- **WHEN** a student owes 9,000.00 in two instalments of 4,500.00, has paid 3,000.00, and today is after the first due date but before the second
- **THEN** the outstanding balance is 6,000.00, the due to date is 4,500.00, and the overdue amount is 1,500.00

#### Scenario: Due date is today
- **WHEN** an instalment's due date is today and it is unpaid
- **THEN** it does not yet count towards the overdue amount

### Requirement: Fees page for each student
Staff SHALL see, for each student, the total fee, each instalment with amount, due date, and whether it is paid, overdue, or upcoming, the payment history newest first, and the outstanding and overdue amounts.
Instalments SHALL be treated as paid in due-date order.

#### Scenario: Instalment states
- **WHEN** a student's payments cover the first instalment fully, the second instalment is past its due date and unpaid, and the third is not yet due
- **THEN** the instalments show as paid, overdue, and upcoming in that order

### Requirement: Overdue students are flagged on the Registry dashboard
The staff Registry dashboard SHALL list every student with an overdue amount above zero, whatever their enrolment status.
Each entry SHALL show Student ID, name, programme, enrolment status, overdue amount, and the earliest unpaid due date, ordered by overdue amount, highest first, and link to the student's fees page.

#### Scenario: Overdue student appears
- **WHEN** a student has an overdue amount of 1,500.00
- **THEN** they appear on the dashboard's overdue list with 1,500.00

#### Scenario: Paying clears the flag
- **WHEN** staff record a payment that brings the student's overdue amount to zero
- **THEN** the student no longer appears on the overdue list

#### Scenario: Nobody overdue
- **WHEN** no student has an overdue amount
- **THEN** the dashboard shows "No overdue balances"

#### Scenario: Withdrawn student with overdue balance
- **WHEN** a Withdrawn student has an overdue amount
- **THEN** they appear on the overdue list with their status shown as Withdrawn

### Requirement: Students view their own fees
A Student SHALL be able to see their own total fee, instalments with due dates and states, payment history, outstanding balance, and overdue amount, read-only.

#### Scenario: Student with an overdue balance
- **WHEN** a Student with an overdue amount opens their fees page
- **THEN** they see the overdue amount highlighted together with the instalment it relates to
