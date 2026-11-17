# Spec Delta

## ADDED Requirements

### Requirement: Adding an assessment reopens published results
When staff create an assessment in a module, every Published result for that module SHALL return to Pending in the same step, so no Published result is ever missing a grade.
Withheld and Pending results SHALL stay as they are.
Before staff create the assessment, the form SHALL tell them how many Published results in the chosen module will return to Pending.

#### Scenario: New assessment in a published module
- **WHEN** Alma's CS101 results are Published and staff create a new CS101 assessment
- **THEN** Alma's CS101 result is Pending, and her marksheet shows "Results not yet released" for CS101

#### Scenario: Withheld result stays withheld
- **WHEN** Liam's CS101 results are Withheld and staff create a new CS101 assessment
- **THEN** Liam's CS101 result is still Withheld

#### Scenario: Warning before creating
- **WHEN** staff choose CS101 on the new-assessment form while 1 CS101 result is Published
- **THEN** the form says that 1 published CS101 result will return to Pending

#### Scenario: No warning without published results
- **WHEN** staff choose a module with no Published results on the new-assessment form
- **THEN** no warning is shown

#### Scenario: Publishing at the same moment
- **WHEN** staff publish a student's module results at the same moment as another member of staff creates an assessment in that module
- **THEN** the student's result ends up Pending, never Published without a grade for the new assessment
