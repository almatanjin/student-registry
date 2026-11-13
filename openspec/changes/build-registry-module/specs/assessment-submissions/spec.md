# Spec Delta

## Purpose

Lets staff set assessments with a deadline and lets students hand in one file per assessment, with resubmission before the deadline and late work accepted but clearly flagged.

## ADDED Requirements

### Requirement: Staff create assessments
Staff SHALL be able to create an assessment with a title, a module, and a submission deadline (date and time), all required.
Each module SHALL belong to one programme, and an assessment SHALL apply to the students on that programme.
A new assessment's deadline SHALL be in the future.

#### Scenario: Valid assessment
- **WHEN** staff create an assessment titled "Essay 1" for a module with a deadline next week
- **THEN** the assessment is created as open and appears to students on that module's programme

#### Scenario: Deadline in the past
- **WHEN** staff create an assessment with a deadline earlier than now
- **THEN** it is rejected with a message on the deadline field

### Requirement: Staff edit, close, and reopen assessments
Staff SHALL be able to change an assessment's title and deadline, and to close or reopen it.
A closed assessment SHALL accept no submissions.

#### Scenario: Extending a deadline
- **WHEN** staff move a deadline later
- **THEN** students can submit or resubmit on time until the new deadline

#### Scenario: Closing an assessment
- **WHEN** staff close an assessment
- **THEN** students can no longer submit or resubmit, and existing submissions are kept

### Requirement: Students see their assessments
A Student SHALL see the assessments of their programme's modules, each with its module, deadline, whether it is open, and their own submission state: not submitted, submitted on time, or submitted late.

#### Scenario: Assessment list
- **WHEN** a Student opens their assessments
- **THEN** they see only their programme's assessments, each with its deadline and their own submission state

### Requirement: Students upload one PDF or DOCX file
An Enrolled student SHALL be able to upload one file to an open assessment.
The file SHALL be a PDF or DOCX, checked by its content as well as its name, no larger than 10 MB, and not empty.

#### Scenario: Valid upload
- **WHEN** an Enrolled student uploads a 2 MB PDF to an open assessment
- **THEN** the submission is saved with the file name and the submission time, and they see a confirmation

#### Scenario: Wrong file type
- **WHEN** a student uploads a `.png`, or a file renamed to `.pdf` whose content is not a PDF
- **THEN** the upload is rejected with "Upload a PDF or DOCX file"

#### Scenario: File too large or empty
- **WHEN** a student uploads a file over 10 MB or an empty file
- **THEN** the upload is rejected with a message giving the reason

#### Scenario: Student not currently enrolled
- **WHEN** a Deferred, Withdrawn, or Completed student tries to submit
- **THEN** the submission is refused and the page explains that only enrolled students can submit

#### Scenario: Closed assessment
- **WHEN** a student tries to submit to a closed assessment
- **THEN** the submission is refused with "This assessment is closed"

### Requirement: One submission per student per assessment
Each student SHALL have at most one submission per assessment.
Before the deadline, a new upload SHALL replace the existing one, and the submission time SHALL become the time of the new upload.

#### Scenario: Resubmitting before the deadline
- **WHEN** a student who has already submitted uploads a new file before the deadline
- **THEN** the new file replaces the old one, and only the new file and its time are kept

#### Scenario: Resubmitting after the deadline
- **WHEN** a student who has already submitted tries to upload again after the deadline
- **THEN** the upload is refused with "The deadline has passed, so your submission can no longer be replaced"

### Requirement: Late submissions are accepted and flagged
A first submission made after the deadline SHALL be accepted on an open assessment and marked late.
A submission SHALL be late when its submission time is after the deadline, so a later deadline extension clears the late mark.

#### Scenario: First submission after the deadline
- **WHEN** a student with no submission uploads a file after the deadline of an open assessment
- **THEN** the submission is saved and shown as late, with the time it was received

#### Scenario: Deadline extended after a late submission
- **WHEN** staff move the deadline after a submission's time
- **THEN** that submission is no longer shown as late

### Requirement: Staff see submissions per assessment
For each assessment, staff SHALL see every student on the programme with their submission state, submission time, and file, with late submissions visually flagged and counts of on-time, late, and missing submissions.

#### Scenario: Mixed submissions
- **WHEN** staff open an assessment with on-time, late, and missing submissions
- **THEN** each student shows the right state, late rows are visibly flagged, and the counts match

### Requirement: Submitted files are access-controlled
A submitted file SHALL be downloadable only by staff and by the student who submitted it, and SHALL NOT be reachable by a public URL.

#### Scenario: Student downloads their own file
- **WHEN** a Student downloads their own submission
- **THEN** they receive the file with its original name

#### Scenario: Another student tries to download it
- **WHEN** a different Student requests that file
- **THEN** the response has status 404
