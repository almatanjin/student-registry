# Spec Delta

## ADDED Requirements

### Requirement: Student list count reads correctly
The student list SHALL show how many students it lists, using the singular for one: "1 student" and "2 students", followed by "matches these filters" or "match these filters" when a search or filter is applied.

#### Scenario: One match
- **WHEN** staff search for "pri" and only Priya Kabir matches
- **THEN** the list says "1 student matches these filters"

#### Scenario: Several matches
- **WHEN** staff filter by status Enrolled and 4 students match
- **THEN** the list says "4 students match these filters"
