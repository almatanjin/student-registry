# Spec Delta

## ADDED Requirements

### Requirement: Programmes page shows each programme at a glance
The staff Programmes page SHALL show each programme as a card with its code as a coloured badge, its name, and its annual fee as a figure under the label "Annual fee".
Code badges SHALL take yellow, purple, sky, blue, and green in turn down the page, starting again after green.

#### Scenario: Programme card heading
- **WHEN** staff open Programmes
- **THEN** the BSc (Hons) Computer Science card shows a yellow "BSC-CS" badge, the programme name, and "Annual fee" with "£9,000.00", and the MSc Data Science card shows a purple "MSC-DS" badge and "£12,000.00"

### Requirement: Fee plan shows its instalment count and total
Each programme's fee plan SHALL be titled with its number of instalments, for example "Fee plan · 3 instalments" (or "1 instalment"), and its table SHALL end with a "Total" row showing the sum of the instalment amounts.

#### Scenario: Fee plan total
- **WHEN** staff view the MSc Data Science fee plan
- **THEN** it is titled "Fee plan · 2 instalments", lists 1 October and 1 February at £6,000.00 each, and ends with "Total" £12,000.00

### Requirement: Modules show as alternating pills
Each programme's modules SHALL show as pills holding the module code and title, in code order, alternating blue and green within the programme, starting with blue.

#### Scenario: Module pills
- **WHEN** staff view the BSc (Hons) Computer Science modules
- **THEN** "CS101 Programming Fundamentals" is a blue pill and "CS102 Databases" is a green pill

### Requirement: Programmes page fits every screen
The programme cards SHALL sit side by side on wide screens with clear space between them, stack one per row on narrower screens, and the page SHALL NOT scroll sideways.

#### Scenario: Wide screen
- **WHEN** staff open Programmes on a wide screen
- **THEN** the two programme cards sit side by side

#### Scenario: Phone
- **WHEN** staff open Programmes on a phone
- **THEN** the cards are stacked one per row and the page does not scroll sideways
