# Spec Delta

## Purpose

Gives the Registry team the figures they check first, in four cards at the top of the staff dashboard, each worked out from current records; the Enrolled students and Results to publish cards link to where the detail lives.

## ADDED Requirements

### Requirement: Enrolled students card
The dashboard SHALL show how many students have the status Enrolled, with the number of Deferred, Withdrawn, and Completed students below it, leaving out any status with none.
The card SHALL link to the student list filtered to Enrolled.

#### Scenario: Mixed statuses
- **WHEN** there are 4 Enrolled, 1 Deferred, 1 Withdrawn, and no Completed students
- **THEN** the card shows 4 with "1 deferred, 1 withdrawn"

#### Scenario: Opening the enrolled list
- **WHEN** staff choose the Enrolled students card
- **THEN** the student list opens filtered to the Enrolled status

### Requirement: Overdue balances card
The dashboard SHALL show how many students have an overdue amount and the total overdue, using the same rules as the overdue balances list.
The card SHALL NOT be a link, because that list sits just below the cards on the same page.

#### Scenario: Students overdue
- **WHEN** 2 students are overdue by 1,500.00 and 3,000.00
- **THEN** the card shows 2 with "4,500.00 overdue"

#### Scenario: Nobody overdue
- **WHEN** no student has an overdue amount
- **THEN** the card shows 0 with "Everyone is up to date"

### Requirement: Fees collected card
The dashboard SHALL show the total of all recorded payments as a percentage of the total of all billed instalments, rounded down to a whole percent, with both amounts below it.

#### Scenario: Part collected
- **WHEN** students have been billed 21,000.00 in total and have paid 13,050.00
- **THEN** the card shows 62% with "13,050.00 of 21,000.00 billed"

#### Scenario: Almost fully paid
- **WHEN** 99.6% of billed fees have been paid
- **THEN** the card shows 99%, not 100%

#### Scenario: Nothing billed
- **WHEN** no instalments have been billed
- **THEN** the card shows 0% with "No fees billed yet"

### Requirement: Results to publish card
The dashboard SHALL show how many module results are Pending and complete, meaning the module has at least one assessment and the student has a grade for every assessment in it.
The card SHALL link to the results page.

#### Scenario: Complete and incomplete results
- **WHEN** one student has grades for every assessment in a module and their result is Pending, another is missing a grade, and a third is Withheld
- **THEN** the card counts only the first

#### Scenario: Publishing clears the count
- **WHEN** staff publish a complete Pending result and return to the dashboard
- **THEN** the card's count has gone down by one

### Requirement: Cards reflect current records
Each card SHALL be worked out when the dashboard is opened, so a change elsewhere shows on the next visit without any other action.

#### Scenario: After recording a payment
- **WHEN** staff record a payment and then open the dashboard
- **THEN** the Fees collected card includes that payment
