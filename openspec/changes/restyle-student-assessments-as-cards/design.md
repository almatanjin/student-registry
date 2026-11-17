# Design

## Context

`src/app/student/assessments/page.tsx` renders a `<ul aria-label="Your assessments">` of white rows, each a single link holding the title, module, deadline, and the `SubmissionBadge` and `OpenBadge` pills.
The data comes from `listAssessmentsForStudent`, which already returns everything a card needs: title, module code and name, deadline (ISO), `deadlinePassed`, `isOpen`, and the submission state.
The staff dashboard's `StatTile` already uses light logo-colour tiles with a deep icon chip, set as `--app-tile-*` variables in `src/app/theme.css` and mapped to Tailwind colours in `src/app/globals.css`.
The app shell shows the sidebar from the `lg` breakpoint (1024px) and keeps the main column at `max-w-6xl`.
The approved look is the mockup reviewed in this conversation: light card colours, small deep accents, faint corner doodles, no summary figures.

## Goals / Non-Goals

**Goals:**
- Match the approved mockup on the real page, using the theme's named colour settings so colours stay in one place.
- Keep every accent that carries text at WCAG AA contrast (4.5:1) on its card.
- Keep the list's accessible name and link names, so existing Playwright tests that open an assessment from "Your assessments" keep working.

**Non-Goals:**
- No change to the staff dashboard tiles or their colours.
- No change to the data the page loads, or to any API.
- No red "Not submitted" pill on the assessment detail page or staff pages; only the student card uses it.

## Decisions

### Separate card colour settings, not the dashboard tile ones

Add five card colours to `theme.css`, each with a `light` background and an `accent` used for the badge background, the calendar icon, "View", and the doodle:

| Colour | Light | Accent | Badge text |
|---|---|---|---|
| Yellow | `#ffe69a` | `#7a5a00` (badge background `#fcc512`) | `#3d2d00` |
| Purple | `#e5cfea` | `#6b3478` | white |
| Sky | `#d2eefa` | `#11678f` | white |
| Blue | `#cfe4f6` | `#01568f` | white |
| Green | `#c6ebd4` | `#07672f` | white |

The light shades reuse the existing tile tints, plus a new sky tint.
The accents are the existing deep "tone text" shades, which all reach at least 5:1 on their light card and with white text on top.
The mockup's brighter accents (for example `#0a9748` green and `#1a86b8` sky) fall below 4.5:1 for small text, so they are not used.
Yellow is the exception for the badge: the bright logo yellow `#fcc512` with dark text (8.4:1) keeps the badge cheerful, while the yellow text accents use `#7a5a00`.

Alternative considered: reusing `--app-tile-*-icon`.
Rejected because changing yellow there would also change the staff dashboard, and there is no sky tile.

### Colour by position in the list

The card at position `i` (zero-based) takes `CARD_COLOURS[i % 5]`, in the order yellow, purple, sky, blue, green.
The user chose this over colouring by module, which would give a BSc student only two colours.
A card's colour can change when an assessment is added above it; that is acceptable because the colour carries no meaning.

### Countdown as a pure domain function

Add `deadlineCountdown(deadline: Date, today: IsoDate, timeZone: string): string` to `src/domain/` (for example `src/domain/deadlines.ts`).
It converts the deadline to its calendar date in the app time zone with the existing `todayIn(timeZone, deadline)`, counts whole days between the two ISO dates with `Date.UTC`, and returns the text from the spec.
Calendar days are used rather than 24-hour periods, so a deadline at 17:00 tomorrow reads "Due tomorrow" whatever the time now.
The page passes `today()` and `appTimeZone()` from `src/server/config.ts`, keeping the function free of the clock and easy to unit test.

### Red "Not submitted" through an optional badge prop

`SubmissionBadge` gains an optional `deadlinePassed` prop.
When the state is `missing` and `deadlinePassed` is true, it uses the existing `red` tone; otherwise it behaves as today.
Only the student card passes the prop, so the detail and staff pages are unchanged.

### Card component and doodles

- `src/components/assessment-card.tsx`: a server component taking one list item, its colour, its doodle, and the countdown text.
  It renders the whole card as one `next/link` with hover shadow and a visible focus ring, as `StatTile` does.
- `src/components/doodles.tsx`: six small inline SVG components (pencil, book, light bulb, paper plane, flask, star) drawn with `stroke="currentColor"`, so the card's accent colour and a low opacity set their look.
  Each is rendered with `aria-hidden` and no title, so the link name stays the card's text.
  The card at position `i` uses doodle `i % 6`.
  Inline SVG avoids new image files and a new dependency.
- The text sits above the doodle, and the doodle sits in the top-right corner with right padding kept on the title, so long titles never run under it.

### Grid breakpoints

`grid gap-4 md:grid-cols-2 xl:grid-cols-3`.
Below `md` the cards stack; from `md` (768px) there are 2; from `xl` (1280px), where the main column is wide enough beside the sidebar, there are 3.
The `<ul aria-label="Your assessments">` and one `<li>` per card stay, so the list semantics and the existing tests are kept.

## Risks / Trade-offs

- [Positional colours shift when assessments are added] → Accepted; colour is decoration only, and the module code badge still identifies the module.
- [Long titles or module names could crowd the card] → Titles wrap, cards in a row share the tallest height, and a Playwright check at phone width confirms there is no sideways scroll.
- [The red pill relies on colour] → The pill still reads "Not submitted" and the countdown reads "N days ago", so the meaning does not depend on colour alone.
- [The `assessment-submissions` main spec does not exist yet] → This delta only adds requirements; sync and archive it after `build-registry-module` is archived, so the capability already exists.
