# Spec Delta

## ADDED Requirements

### Requirement: Pages fit beside the sidebar
Every staff page SHALL fit the content area beside the sidebar at window widths of 1024 px and above, with no table cutting off a column or needing a sideways scroll.
Long values such as submitted file names SHALL wrap between words or at hyphens, never in the middle of a word.

#### Scenario: Dashboard overdue table
- **WHEN** staff open the dashboard in a 1024 px wide window
- **THEN** the overdue balances table shows every one of its columns in full, including "Unpaid since"

#### Scenario: Staff fees page
- **WHEN** staff open a student's fees page in a 1024 px wide window
- **THEN** the instalments table shows every State pill in full

#### Scenario: Module results table
- **WHEN** staff open CS101 results in a 1024 px wide window
- **THEN** the results table shows the Actions column and its buttons in full

#### Scenario: Submitted file names
- **WHEN** staff open Lab report 1 in a 1024 px wide window
- **THEN** each submitted file name is shown with no word broken across two lines
