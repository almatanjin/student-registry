# Design

## Context

See proposal.md for why.
Both roles use `AppShell` (`src/components/app-shell.tsx`): a top header with `NavLinks` (`src/components/nav-links.tsx`, a client component that marks the current link with `aria-current="page"`), the signed-in email, a "Change password" link, and a "Sign out" form that posts to `signOutAction`.
The staff and student layouts (`src/app/staff/layout.tsx`, `src/app/student/layout.tsx`) are server components that pass their links as `{ href, label }`.
The staff dashboard (`src/app/staff/dashboard/page.tsx`) reads `listOverdueStudents()` and renders one card with the overdue table.
Playwright tests find the navigation as `getByRole("navigation", { name: "Main" })` and the account actions by the names "Change password" and "Sign out".
`src/proxy.ts` skips any path ending in `.svg`, so a static SVG in `public/` loads for every visitor.
The UI uses Tailwind CSS with shadcn/ui, the Geist font, and `lucide-react` icons; `src/app/theme.css` holds the settings meant to be changed by hand.
Buttons already read `--app-button-background`, `--app-button-text`, and `--app-button-hover-background` from `theme.css`, which default to the near-black shadcn `--primary`.
Status pills all render through `Pill` in `src/components/status-badge.tsx`, but each badge component (`status-badge.tsx`, `assessment-badges.tsx`, `result-badges.tsx`, `fees.tsx`) passes its own Tailwind colour classes, so the same meaning can look different on different pages.
The sign-in page (`src/app/sign-in/page.tsx`) shows a card titled "Student Registry" with no logo.

## Goals / Non-Goals

**Goals:**

- One sidebar component shared by both roles and by the phone menu, so the links, highlight, and footer are written once.
- Keep the accessible names the existing tests rely on, so they keep passing unchanged.
- Work out each card from current records with a small, fixed number of queries.

**Non-Goals:**

- A collapsible sidebar on desktop, nested navigation, or per-user settings.
- Changing the overdue table or any other page's content or layout, including the Programmes page.
- A dark theme; the existing `dark:` classes are left as they are.

## Decisions

### 1. Layout: a sticky sidebar from `lg` up, a top bar and dialog below it

From the `lg` breakpoint (1024 px) the shell is a two-column grid: a 15 rem sidebar that stays in view while the page scrolls, and the main content.
Below `lg`, the sidebar is hidden and a slim top bar shows the PEN mark, "Student Registry", and a "Menu" button.
The menu is a native `<dialog>` opened with `showModal()`, which gives a backdrop, focus kept inside the menu, and closing on Escape without extra code.
A "Close menu" button closes it, and a `usePathname()` effect closes it after a link is chosen.

Alternatives:

- shadcn/ui's `Sidebar` block brings a provider, cookies for the open state, and several new files for features this app does not use.
- A CSS-only `<details>` menu does not keep focus inside the panel or close on Escape.

### 2. One `SidebarContent`, rendered in two places

`SidebarContent` holds the brand, the `<nav aria-label="Main">` list, and the footer.
`AppShell` renders it once in the desktop `<aside>` and once inside the phone `<dialog>`.
Only one copy is ever visible: the `<aside>` is `hidden` below `lg`, and a closed dialog is not shown, so assistive technology and role-based test queries only ever see one "Main" navigation, one "Change password", and one "Sign out".
The footer keeps the existing `<form action={signOutAction}>` and the link to `/change-password`.
The email is truncated with an ellipsis and carries a `title` with the full address, so it never widens the sidebar.

### 3. Icons travel as names

Layouts are server components and cannot pass icon components to the client `NavLinks`.
Each link carries an `icon` name from a fixed list (`dashboard`, `students`, `assessments`, `results`, `programmes`, `marksheet`, `fees`, `profile`), and `NavLinks` maps names to `lucide-react` icons.
A TypeScript union for the names makes a typo a compile error.

### 4. The PEN mark is its own file

`public/pen-mark.svg` is a copy of `public/pen-global-logo.svg` with `viewBox="-1 -1 66 66"`, `width="66"`, and `height="66"`, which frames the coloured circles and leaves the divider and wordmark outside the visible area.
The paths are not edited, so the circles stay exactly as PEN supplied them.
It is shown with `next/image` (`unoptimized`, since it is an SVG) and an empty `alt`, because "Student Registry" is written next to it.

### 5. Colours as theme settings

`src/app/theme.css` gains, under a "Sidebar and dashboard" heading:

| Setting | Value | Used for |
|---|---|---|
| `--app-sidebar-background` | `#F8F9FB` | Sidebar and top bar |
| `--app-nav-active-background` | `#DDEBF8` | Current link |
| `--app-nav-active-text` | `#014E83` | Current link text and icon |
| `--app-tile-blue` / `--app-tile-blue-icon` | `#CFE4F6` / `#0269AF` | Enrolled students |
| `--app-tile-yellow` / `--app-tile-yellow-icon` | `#FFE69A` / `#C99700` | Overdue balances |
| `--app-tile-green` / `--app-tile-green-icon` | `#C6EBD4` / `#0A9748` | Fees collected |
| `--app-tile-purple` / `--app-tile-purple-icon` | `#E5CFEA` / `#844393` | Results to publish |
| `--app-tone-*` / `--app-tone-*-text` | See decision 6 | Status pills and highlights |
| `--app-button-background` / `--app-button-hover-background` | `#0269AF` / `#01568F` | Main buttons (decision 7) |

`globals.css` maps them to Tailwind colours (`bg-tile-blue`, `bg-tile-blue-icon`, and so on) in its `@theme inline` block, as it already does for the button settings.
They are called "tile" rather than "card" because shadcn/ui already uses `card` for the white card surface.
Text on the tiles stays the default near-black, which keeps contrast above 4.5:1 on every tint; icons sit on the deep colour in white.

### 6. One tone per meaning for every status pill

`Pill` takes a `tone` prop instead of colour classes, and each badge component maps its labels to a tone:

| Tone | Logo colour | Background / text | Pills |
|---|---|---|---|
| `green` | `#0A9748` | `#E3F4EA` / `#07672F` | Enrolled, On time, Paid, Published, Pass |
| `yellow` | `#FCC512` | `#FFF3C4` / `#7A5A00` | Deferred, Late |
| `red` | `#E32726` | `#FDE8E8` / `#B31B1A` | Overdue, Fail |
| `blue` | `#0269AF` | `#E1EEF9` / `#01568F` | Completed, Merit |
| `purple` | `#844393` | `#F1E4F4` / `#6B3478` | Distinction, Withheld |
| `sky` | `#43B5E8` | `#E2F4FC` / `#1D6F94` | Pending, Open, Upcoming |
| `neutral` | none | `#EEF1F5` / `#4A5565` | Withdrawn, Not submitted, Closed |

Each tone is a pair of settings in `theme.css` (for example `--app-tone-green` and `--app-tone-green-text`), mapped to Tailwind colours in `globals.css`, and the pill's ring uses the text colour at low opacity.
One edit in `theme.css` then recolours every pill with that meaning, on every page.
The larger highlights follow the same tones: the late row and the "Late" count on an assessment, the late notice on a student's assessment, and the grade-change warning use the yellow tint, and overdue instalment rows and the overdue box use the red tint.
Neutral grey is the one colour not taken from the logo, so inactive states do not compete for attention with the ones that need action.

Alternatives:

- Keeping per-component class strings works, but it is how "Late" (orange) and "Deferred" (amber) drifted apart today.
- Using shadcn's `Badge` variants would mean one variant per tone in a generated file the project otherwise leaves alone.

### 7. Logo blue for main actions and the deep logo red for warnings

`theme.css` sets `--app-button-background` to `#0269AF`, `--app-button-hover-background` to `#01568F`, and `--app-button-text` to white, so every main button changes without touching a component.
`globals.css` sets `--ring` to the same blue, so focus outlines match.
`--destructive` becomes `#B31B1A`, a deeper shade of the logo red, so destructive alerts (such as a student's overdue notice) read as the same red as the overdue highlights while keeping contrast above 4.5:1 on white.
Outline, ghost, and link buttons keep their neutral styles, so each page has one clearly coloured main action.

### 8. The sign-in page shows the brand

The sign-in page shows `public/pen-mark.svg` at 64 px and "Student Registry", centred above the card, and the card title changes to "Sign in".
The mark has an empty `alt` because the name is written beside it.

### 9. One read-only service for the four figures

`getDashboardSummary(on)` in `src/server/dashboard/service.ts` returns `{ enrolled, overdue, fees, resultsToPublish }`.

- **Students by status:** one `student.groupBy` on `status`.
- **Overdue:** the page already calls `listOverdueStudents(on)` for the table; the summary takes that list as an argument and counts it, so the overdue rules exist in one place and the data is read once.
- **Fees collected:** two aggregates, the sum of `StudentInstalment.amountMinor` and the sum of `Payment.amountMinor`, and `Math.floor(paid * 100 / billed)` (0 when nothing is billed).
- **Results to publish:** modules with their assessment IDs, all grades as `(studentId, assessmentId)`, all `ModuleResult` rows, and each programme's student IDs, then a count in memory of each student and module where the state is Pending (or has no row) and `missingGrades()` from `src/domain/results.ts` returns an empty list.
  This reuses the same rule as "Publish all", so the card and the button never disagree.

The dashboard page calls the service with `today()` and renders four `StatTile` components (`src/components/stat-tile.tsx`), each a link with a label, a value, a detail line, and an icon badge.
The overdue table's card gets `id="overdue-balances"` so the Overdue balances tile can link to it.

## Risks / Trade-offs

- [Two copies of the sidebar markup in the page] → Only one is ever rendered visibly; the duplication is in HTML, not in code, and both come from `SidebarContent`.
- [The results count loads every grade] → At registry scale (hundreds of students, a few modules) this is a few thousand small rows; a SQL query can replace it later without changing the service's return value.
- [Fees collected mixes academic years] → Its detail line names both totals ("13,050.00 of 21,000.00 billed"), which is exactly what it counts; a per-year split is left for when there is a need for it.
- [A tint could fall below contrast if someone changes it in `theme.css`] → The comment next to the settings says to keep tints light so dark text stays readable.
- [Existing Playwright tests look for the sign-in card titled "Student Registry"] → Those assertions move to the "Sign in" title in the same task that changes it.
- [The student's payment history table runs against the card edge on phones today] → Fixed in the screenshot review task, since this change touches every page's look anyway.

## Migration Plan

No data or API changes.
Deploying replaces the shell for every page at once; rolling back is reverting the commit.
