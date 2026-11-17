# Spec Delta

## ADDED Requirements

### Requirement: Student assessments show as cards in a grid
The student Assessments page SHALL show each assessment as a card, with up to 3 cards per row on wide screens, 2 per row on tablet-width screens, and 1 per row on phones.
The cards SHALL keep the earliest-deadline-first order.

#### Scenario: Wide screen
- **WHEN** a Student with 5 assessments opens Assessments on a wide screen
- **THEN** the first row shows the 3 earliest deadlines side by side and the second row shows the other 2

#### Scenario: Phone
- **WHEN** a Student opens Assessments on a phone
- **THEN** the cards are stacked one per row, earliest deadline first, and the page does not scroll sideways

### Requirement: Each card has one light colour
Each assessment card SHALL have a single light background colour, taken in turn from yellow, purple, sky, blue, and green, starting again after green.
The deeper shade of the same colour SHALL be used only for small accents on that card.

#### Scenario: Six assessments
- **WHEN** a Student has 6 assessments
- **THEN** the cards are yellow, purple, sky, blue, green, and yellow, in list order

### Requirement: Card contents
Each card SHALL show the module code, the assessment title, the module name, the deadline, a countdown to the deadline, the Student's submission state, whether the assessment is open or closed, and a "View" label.
The whole card SHALL be a single link to that assessment.

#### Scenario: Open assessment not yet submitted
- **WHEN** a Student views the card for "Normalisation exercise" in CS102 Databases, due in 10 days, open, and not submitted
- **THEN** the card shows "CS102", "Normalisation exercise", "Databases", the deadline, "In 10 days", "Not submitted", "Open", and "View"

#### Scenario: Opening an assessment
- **WHEN** a Student chooses anywhere on a card
- **THEN** that assessment's page opens

### Requirement: Deadline countdown
The countdown SHALL count whole calendar days between today and the deadline date in the app time zone, and read "In N days", "Due tomorrow", "Due today", "1 day ago", or "N days ago".

#### Scenario: Future deadline
- **WHEN** the deadline is 10 days after today
- **THEN** the countdown reads "In 10 days"

#### Scenario: Deadline tomorrow
- **WHEN** the deadline is the day after today
- **THEN** the countdown reads "Due tomorrow"

#### Scenario: Deadline today
- **WHEN** the deadline is later today or earlier today
- **THEN** the countdown reads "Due today"

#### Scenario: Deadline yesterday
- **WHEN** the deadline was the day before today
- **THEN** the countdown reads "1 day ago"

#### Scenario: Past deadline
- **WHEN** the deadline was 7 days before today
- **THEN** the countdown reads "7 days ago"

### Requirement: Missed deadline stands out
On a card, "Not submitted" SHALL show as a red pill once the deadline has passed, and as a grey pill before it.
Submitted states SHALL keep their existing colours.

#### Scenario: Deadline passed without a submission
- **WHEN** a Student has not submitted "Databases coursework" and its deadline has passed
- **THEN** its card shows "Not submitted" in red

#### Scenario: Deadline still ahead
- **WHEN** a Student has not submitted "Normalisation exercise" and its deadline is still ahead
- **THEN** its card shows "Not submitted" in grey

### Requirement: Decorative doodles
Each card SHALL show a faint student-themed line drawing in its top-right corner that does not cover the card's text.
The drawing SHALL be hidden from screen readers and SHALL NOT change the card's accessible name.

#### Scenario: Screen reader
- **WHEN** a screen reader reads an assessment card link
- **THEN** it reads the card's text only, with no description of the drawing
