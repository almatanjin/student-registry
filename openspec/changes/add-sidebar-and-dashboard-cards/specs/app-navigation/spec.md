# Spec Delta

## Purpose

Gives every signed-in person a consistent way to move around the Registry: a sidebar with their role's pages, a clear mark of where they are, and their account actions, on desktop and on phones, with the same PEN brand on the sign-in page.

## ADDED Requirements

### Requirement: Each role sees its own sidebar
Every signed-in page SHALL show a sidebar with the PEN circles mark, "Student Registry", the person's role, and links to that role's pages, each with an icon.
Staff SHALL see Dashboard, Students, Assessments, Results, and Programmes; Students SHALL see Assessments, Marksheet, Fees, and Profile.
The change-password page SHALL show the sidebar too, except while the person must change a password set by staff, when it shows only the form and "Sign out".

#### Scenario: Staff sidebar
- **WHEN** staff open any staff page on a desktop screen
- **THEN** the sidebar shows "Student Registry", "Staff", and the links Dashboard, Students, Assessments, Results, and Programmes, in that order

#### Scenario: Student sidebar
- **WHEN** a Student opens any student page on a desktop screen
- **THEN** the sidebar shows "Student Registry", "Student", and the links Assessments, Marksheet, Fees, and Profile, in that order, and no staff links

#### Scenario: Change password page
- **WHEN** a signed-in person chooses "Change password" in the sidebar footer
- **THEN** the change-password form opens with the same sidebar beside it, so they can go back to any of their pages

#### Scenario: Forced change has no sidebar
- **WHEN** a person who must change a password set by staff is on the change-password page
- **THEN** no sidebar or navigation is shown, only the form and "Sign out"

### Requirement: The current page is marked
The sidebar link for the section being viewed SHALL be highlighted and announced as the current page, including on pages inside that section.

#### Scenario: Page inside a section
- **WHEN** staff open a student's fees page
- **THEN** the Students link is highlighted and marked as the current page, and no other link is

### Requirement: Account actions sit in the sidebar footer
The bottom of the sidebar SHALL show the signed-in email and role, followed by "Change password" and "Sign out".

#### Scenario: Signed-in footer
- **WHEN** a signed-in person looks at the bottom of the sidebar
- **THEN** they see their email, "Signed in as staff" or "Signed in as student", a "Change password" link, and a "Sign out" button

#### Scenario: Long email
- **WHEN** the signed-in email is longer than the sidebar is wide
- **THEN** it is shortened with an ellipsis and the full email is available on hover, without widening the sidebar

### Requirement: Phones use a menu
On narrow screens the sidebar SHALL be hidden behind a "Menu" button in a top bar, and the menu SHALL open the same links and footer over the page.

#### Scenario: Opening the menu
- **WHEN** a person on a phone-sized screen taps "Menu"
- **THEN** the sidebar opens over the page with the role's links, the signed-in footer, and a "Close menu" button

#### Scenario: Choosing a page closes the menu
- **WHEN** they choose a link in the open menu
- **THEN** that page opens and the menu is closed

#### Scenario: Closing without choosing
- **WHEN** they tap "Close menu" or press Escape
- **THEN** the menu closes and the page underneath is unchanged

### Requirement: Sign-in page shows the brand
The sign-in page SHALL show the PEN circles mark and "Student Registry" centred above the sign-in form, and the form SHALL be titled "Sign in".

#### Scenario: Opening the sign-in page
- **WHEN** a signed-out visitor opens the sign-in page
- **THEN** they see the PEN circles and "Student Registry" above a form titled "Sign in" with the Email and Password fields
