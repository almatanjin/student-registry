# Spec Delta

## ADDED Requirements

### Requirement: Staff see each module as a card on the results overview
The staff results overview SHALL show each module as a coloured card that links to that module's results page.
Each card SHALL show the module code, the module title, the programme name, the number of assessments, a status pill, and "View results".
Cards SHALL sit 2 per row on wider screens and 1 per row on phones.

#### Scenario: Card contents
- **WHEN** staff open the results overview
- **THEN** each module appears as a card with its code, title, programme, number of assessments, one status pill, and "View results"

#### Scenario: Opening a module
- **WHEN** staff click a module's card
- **THEN** that module's results page opens

#### Scenario: Phone layout
- **WHEN** staff open the results overview on a phone-sized screen
- **THEN** the cards are shown one per row with no sideways scrolling

### Requirement: The card's status pill says what the module needs next
Each card SHALL show exactly one status pill, taken from the first rule that applies: "No assessments yet" when the module has no assessments; "No students yet" when its programme has no students; "N ready to publish" when N results are Pending and complete; "Waiting for grades" when any Pending result is missing a grade; "N withheld" when N results are Withheld; otherwise "All published".

#### Scenario: Results ready to publish
- **WHEN** a module has 2 students whose results are Pending and have a grade for every assessment, and 1 student missing a grade
- **THEN** its pill reads "2 ready to publish"

#### Scenario: Only incomplete results left
- **WHEN** every Pending result on a module is missing at least one grade
- **THEN** its pill reads "Waiting for grades"

#### Scenario: Nothing left except withheld results
- **WHEN** a module has no Pending results and 1 Withheld result
- **THEN** its pill reads "1 withheld"

#### Scenario: Everything published
- **WHEN** every student's result on a module is Published
- **THEN** its pill reads "All published"

#### Scenario: Module without assessments
- **WHEN** a module has no assessments
- **THEN** its pill reads "No assessments yet"

#### Scenario: Programme without students
- **WHEN** a module has assessments but its programme has no students
- **THEN** its pill reads "No students yet"

#### Scenario: Publishing updates the pill
- **WHEN** staff publish all complete results on a module and return to the results overview
- **THEN** the module's pill no longer counts those results as ready to publish

#### Scenario: Pills agree with the dashboard
- **WHEN** staff compare the results overview with the dashboard
- **THEN** the "ready to publish" numbers on the cards add up to the dashboard's "Results to publish" figure
