# Spec Delta

## Purpose

Lets staff record a grade for each student on each assessment, classifies every grade, and controls when each student's results for a module are released to that student.

## ADDED Requirements

### Requirement: Staff enter grades
Staff SHALL be able to enter, change, or clear a grade for each student on an assessment, for students on the assessment's programme.
A grade SHALL be a whole number from 0 to 100.
A grade MAY be entered whether or not the student submitted.

#### Scenario: Entering a grade
- **WHEN** staff enter 72 for a student on an assessment
- **THEN** the grade is saved and shown on the assessment's marksheet

#### Scenario: Out-of-range or non-numeric grade
- **WHEN** staff enter -1, 101, 65.5, or text
- **THEN** the grade is rejected with "Enter a whole number from 0 to 100" and the previous value is kept

#### Scenario: Student with no submission
- **WHEN** staff enter 0 for a student who did not submit
- **THEN** the grade is saved

#### Scenario: Student not on the programme
- **WHEN** a grade is sent for a student who is not on the assessment's programme
- **THEN** it is rejected and nothing is saved

### Requirement: Grades are classified
Every grade SHALL be shown with its classification: Fail below 40, Pass from 40 to 59, Merit from 60 to 69, and Distinction from 70 to 100.

#### Scenario: Classification boundaries
- **WHEN** grades of 39, 40, 59, 60, 69, and 70 are shown
- **THEN** they are classified Fail, Pass, Pass, Merit, Merit, and Distinction

### Requirement: Staff marksheet per assessment
For each assessment, staff SHALL see every student on the programme with their submission state, grade, and classification, and SHALL be able to enter grades from that view.

#### Scenario: Marksheet view
- **WHEN** staff open an assessment's marksheet
- **THEN** each student shows a late flag where their submission was late, their grade if any, and its classification

### Requirement: Each student's module results have a release state
For each student and module, results SHALL be in one of three states: Pending (the starting state), Published, or Withheld.
Staff SHALL be able to publish, withhold, or return them to Pending at any time.

#### Scenario: Withholding a published result
- **WHEN** staff withhold a student's Published results for a module
- **THEN** the student immediately stops seeing those results

### Requirement: Only complete results can be published
Staff SHALL only publish a student's results for a module when that student has a grade for every assessment in the module.

#### Scenario: Missing grade
- **WHEN** staff try to publish a student's module results while one assessment in the module has no grade for them
- **THEN** the publish is refused with a message naming the assessment without a grade

### Requirement: Staff publish all complete results for a module at once
Staff SHALL be able to publish, in one action, every student on a module whose results are Pending and complete.
Withheld and incomplete results SHALL be left unchanged, and staff SHALL be told how many were published and how many were skipped.

#### Scenario: Bulk publish skips withheld results
- **WHEN** staff publish all results for a module with 4 complete Pending students, 1 Withheld student, and 1 incomplete student
- **THEN** 4 are published, the other 2 are unchanged, and staff see "4 published, 2 skipped"

### Requirement: Students see only published results
A Student's marksheet SHALL show, for each of their modules, the assessment titles, grades, and classifications only when that module's results are Published.
Pending and Withheld modules SHALL both show "Results not yet released", and their grades SHALL NOT be sent to the Student by any page or API.

#### Scenario: Published module
- **WHEN** a Student opens their marksheet and a module's results are Published
- **THEN** they see each assessment's grade and classification for that module

#### Scenario: Withheld module
- **WHEN** a module's results are Withheld for a Student
- **THEN** their marksheet shows "Results not yet released" for it, exactly as it does for a Pending module

#### Scenario: Requesting unpublished grades directly
- **WHEN** a Student calls the API for their results while a module is Pending or Withheld
- **THEN** the response contains no grades for that module

### Requirement: Grade changes after publishing are visible
When staff change a grade in a module whose results are Published for that student, the change SHALL be shown to the student straight away, and staff SHALL be warned before saving that the result is already released.

#### Scenario: Correcting a published grade
- **WHEN** staff change a published grade from 58 to 61 and confirm the warning
- **THEN** the student sees 61, classified Merit
