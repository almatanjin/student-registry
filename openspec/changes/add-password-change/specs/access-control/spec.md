# Spec Delta

## ADDED Requirements

### Requirement: Signed-in people change their own password
Any signed-in person, Staff or Student, SHALL be able to change their own password by entering their current password, a new password of at least 8 characters, and the new password again.
The new password SHALL differ from the current one.

#### Scenario: Changing your password
- **WHEN** a signed-in person enters their current password and a valid new password twice
- **THEN** the new password is saved, they see "Your password has been changed", and their next sign-in works only with the new password

#### Scenario: Wrong current password
- **WHEN** a person enters a current password that does not match
- **THEN** the change is rejected with "Your current password is incorrect" and the password is unchanged

#### Scenario: New password too short
- **WHEN** a person enters a new password shorter than 8 characters
- **THEN** the change is rejected with "Use at least 8 characters" on the new password field

#### Scenario: Passwords do not match
- **WHEN** the two new password entries differ
- **THEN** the change is rejected with "The passwords do not match" on the confirmation field

#### Scenario: Same as the current password
- **WHEN** the new password equals the current one
- **THEN** the change is rejected with "Choose a password different from your current one"

#### Scenario: Finding the change-password page
- **WHEN** a signed-in person looks at the page header
- **THEN** it has a "Change password" link that opens the change-password page

### Requirement: Initial and reset passwords must be changed at the next sign-in
A Student account whose password was set by staff, at creation or by a reset, SHALL be marked as needing a new password.
After signing in, that person SHALL be sent to the change-password page instead of their home page, and SHALL be unable to use any other page or API route until they change it.

#### Scenario: First sign-in of a new student
- **WHEN** staff create a student with an initial password and the student signs in with it
- **THEN** they land on the change-password page with the message "Choose a new password before you continue"

#### Scenario: Trying to skip the change
- **WHEN** a person who must change their password opens any other page, such as their assessments
- **THEN** they are sent back to the change-password page

#### Scenario: API call before the change
- **WHEN** a person who must change their password calls any API route other than sign-in and sign-out
- **THEN** the response has status 403 with the message "Change your password before you continue" and nothing is changed

#### Scenario: After the change
- **WHEN** that person changes their password
- **THEN** they are taken to their home page and can use the application normally

#### Scenario: Signing out instead
- **WHEN** a person on the forced change-password page chooses "Sign out"
- **THEN** they are signed out, and they are asked again at their next sign-in

#### Scenario: Seeded demo accounts
- **WHEN** a seeded demo account signs in with the seed password
- **THEN** it goes straight to its home page without being asked to change the password

### Requirement: Staff reset a student's password
Staff SHALL be able to reset a student's password from the student's record by entering a new temporary password of at least 8 characters.
Students SHALL NOT be able to reset anyone's password, and staff passwords cannot be reset this way.

#### Scenario: Resetting a forgotten password
- **WHEN** staff reset a student's password with a valid temporary password
- **THEN** staff see "Password reset. The student must choose a new password when they next sign in", the student can sign in only with the temporary password, and they must then change it

#### Scenario: Temporary password too short
- **WHEN** staff enter a temporary password shorter than 8 characters
- **THEN** the reset is rejected with "Use at least 8 characters" and the password is unchanged

#### Scenario: Student tries to reset a password
- **WHEN** a Student session calls the reset operation
- **THEN** the response has status 403 and nothing is changed

#### Scenario: Unknown student
- **WHEN** staff reset the password of a student that does not exist
- **THEN** the response has status 404

### Requirement: Changing a password ends other sessions
When a password changes, every session started before the change SHALL stop working, except the session of a person changing their own password, which continues.

#### Scenario: Staff reset while the student is signed in
- **WHEN** staff reset the password of a student who is signed in elsewhere
- **THEN** the student's next page request sends them to the sign-in page

#### Scenario: Changing your password with another session open
- **WHEN** a person changes their password while also signed in on another browser
- **THEN** they stay signed in where they made the change, and the other browser's next request sends it to the sign-in page

### Requirement: Password changes never expose passwords
Passwords entered to change or reset a password SHALL be stored only as a hash, and SHALL NOT appear in any page, response, or log.

#### Scenario: Reset response
- **WHEN** staff reset a student's password
- **THEN** the response confirms the reset without containing the temporary password or any password hash
