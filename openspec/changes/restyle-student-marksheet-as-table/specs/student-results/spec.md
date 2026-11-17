# Spec Delta

## ADDED Requirements

### Requirement: Student marksheet is one table
The student Marksheet page SHALL show all of the Student's modules in a single table with the columns Module, Assessment, Grade, and Classification, ordered by module code.
Within a released module, each assessment SHALL have its own row showing its title, grade, and classification.
Each module SHALL be a named group of rows, so assistive technology can tell which module a row belongs to.

#### Scenario: Released module on a wide screen
- **WHEN** a Student whose CS101 Programming Fundamentals results are released opens their marksheet on a wide screen
- **THEN** one table shows a Module cell reading "CS101" and "Programming Fundamentals" beside the rows "Lab report 1", 72, Distinction and "Programming test", 68, Merit

#### Scenario: Modules in code order
- **WHEN** a Student with modules CS101 and CS102 opens their marksheet
- **THEN** the CS101 rows come before the CS102 rows in the same table

#### Scenario: No modules
- **WHEN** a Student with no modules opens their marksheet
- **THEN** they see the empty state "No modules yet" and no table

### Requirement: Unreleased modules in the marksheet table
A module whose results are not released SHALL appear in the table as one row reading "Results not yet released", with no assessment titles, grades, or classifications.

#### Scenario: Pending module row
- **WHEN** a Student's CS102 Databases results are Pending
- **THEN** the CS102 group in the table holds a single row reading "Results not yet released" and no grades

### Requirement: Marksheet on phones
On phone-width screens the marksheet SHALL hide the Module column and instead start each module with a full-width heading row showing the module code and name, followed by that module's rows with Assessment, Grade, and Classification.
The page SHALL NOT scroll sideways.

#### Scenario: Phone
- **WHEN** a Student opens their marksheet on a phone
- **THEN** a heading row reading "CS101 Programming Fundamentals" sits above the "Lab report 1" and "Programming test" rows, no Module column is shown, and the page does not scroll sideways

### Requirement: Module code colours
Each module code in the marksheet SHALL show as a coloured badge, taking yellow, purple, sky, blue, and green in turn down the table, starting again after green.

#### Scenario: Two modules
- **WHEN** a Student with modules CS101 and CS102 opens their marksheet
- **THEN** the CS101 badge is yellow and the CS102 badge is purple

### Requirement: Grade bands legend
Under the page title, the marksheet SHALL show a legend labelled "Bands:" listing "Fail <40", "Pass 40+", "Merit 60+", and "Distinction 70+", each coloured like the matching classification pill in the table.
The legend SHALL take the place of the description sentence under the title.

#### Scenario: Legend shown
- **WHEN** a Student opens their marksheet
- **THEN** they see "Bands:" followed by "Fail <40", "Pass 40+", "Merit 60+", and "Distinction 70+", and the sentence "Results appear here once they have been released" is not shown

#### Scenario: Legend matches the table
- **WHEN** a released grade is classified Distinction in the table
- **THEN** its pill has the same colour as "Distinction 70+" in the legend
