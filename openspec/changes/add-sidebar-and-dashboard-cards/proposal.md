# Proposal

## Why

The top bar now holds five staff links, the signed-in email, "Change password", and "Sign out", and it wraps onto two lines on narrower screens.
The Registry dashboard also shows a single overdue table, so the registrar has no quick view of the numbers they check first: how many students are enrolled, who owes money, how much has been collected, and which results are ready to release.

## What Changes

- Replace the top bar with a light left sidebar, used by both Staff and Students.
  - The top shows the PEN circles mark (only the coloured circles from `public/pen-global-logo.svg`, without the "PEN GROUP" wordmark), "Student Registry", and the role.
  - Each navigation link gets an icon, and the current page is highlighted.
  - A footer at the bottom shows who is signed in, with "Change password" and "Sign out" below it.
- On phones, the sidebar is replaced by a slim top bar with the mark and a "Menu" button that opens the same sidebar over the page.
- Add four summary cards above the overdue table on the staff dashboard, each showing real data and linking to where the detail lives:
  - **Enrolled students**: how many students are Enrolled, with the counts of the other statuses.
  - **Overdue balances**: how many students are overdue and the total amount.
  - **Fees collected**: the share of all billed fees that has been paid.
  - **Results to publish**: how many module results are complete but still Pending.
- Colour the cards with lighter tints of the logo colours (blue, yellow, green, purple), kept as named settings in `src/app/theme.css`.
  The font stays Geist.
- Bring the rest of the interface into the same logo palette:
  - Main buttons use the logo blue (`#0269AF`, darker `#01568F` on hover) with white text, through the existing button settings in `theme.css`.
  - Every status pill uses a light tint of a logo colour chosen by its meaning: green for done or good, yellow for needs attention, red for a problem, blue for finished or recognised, purple for special or held, light blue for waiting, and neutral grey for inactive.
  - Late submission rows and the "Late" count use the yellow tint; overdue rows, the overdue box, and warnings use the deep logo red (`#B31B1A`).
- Show the PEN circles and "Student Registry" centred above the sign-in form, and title the form "Sign in".
- Update the README and `docs/manual-testing.md` for the new layout and cards.

Out of scope: search, notifications, a calendar, charts, an activity feed, trend figures (no history is stored to compare against), collapsing the sidebar on desktop, and redesigning the layout of any other page, including Programmes.

## Capabilities

### New Capabilities

- `app-navigation`: the sidebar each role sees, its links and current-page highlight, the signed-in footer, the phone menu, and the brand on the sign-in page.
- `registry-dashboard`: the four summary cards on the staff dashboard, what each counts, and where each links.

### Modified Capabilities

None.
The overdue balances requirement stays in `student-fees`, and the overdue table is unchanged.

## Impact

- **UI:** `src/components/app-shell.tsx` and `src/components/nav-links.tsx` are rebuilt; the staff and student layouts pass icons with their links.
  A new client component handles the phone menu.
- **Dashboard:** `src/app/staff/dashboard/page.tsx` gains the cards; a new read-only service computes the four figures.
- **Assets and theme:** a new `public/pen-mark.svg` (the circles only), and new colour settings in `src/app/theme.css` for the sidebar, tiles, buttons, and status tones.
- **Badges and highlights:** `src/components/status-badge.tsx` (the shared `Pill`), `assessment-badges.tsx`, `result-badges.tsx`, and `fees.tsx` move to the shared tones; the late and overdue highlights on the assessment, fees, and grade pages use the yellow and red tints.
- **Sign-in:** `src/app/sign-in/page.tsx` gains the mark and the "Sign in" title.
- **Tests:** existing Playwright tests that use the "Main" navigation, "Change password", and "Sign out" keep working because those names stay; new Playwright and integration tests cover the sidebar, phone menu, sign-in brand, and each card.
  Tests that look for the sign-in card titled "Student Registry" are updated for the "Sign in" title.
- **No database or API changes.**
