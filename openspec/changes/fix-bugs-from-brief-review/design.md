# Design

## Context

- `createAssessment` in `src/server/assessments/service.ts` creates the assessment row on its own, with no transaction and no look at `ModuleResult`.
  An assessment's module is set only on creation; editing cannot change it.
- Publishing (`setResultState` and `publishModule` in `src/server/results/service.ts`) checks completeness inside a transaction that locks the student rows involved (`lockStudent`, or `SELECT ... FOR UPDATE` on the programme's students in id order).
- The new-assessment form receives `moduleGroups` (programme, then modules) from its page and keeps its own field state.
- The student list builds its count text inline in `src/app/staff/students/page.tsx`.
- `AppShell` renders the content in `<main className="mx-auto w-full max-w-6xl ...">`, and the sidebar takes 15rem from `lg` (1024 px) up.
  The dashboard, staff fees, and module results tables hide or rearrange columns with viewport breakpoints (`sm:`, `md:`, `lg:`), so at exactly 1024 px they assume about 240 px more room than they have.
- Submitted file names on the staff assessment page use `break-all`.
- Tailwind CSS 4 is in use, which supports container queries (`@container` with `@md:`-style variants) without a plugin.

## Goals / Non-Goals

**Goals:**
- No Published result can exist while its module has an assessment without that student's grade, including when publishing and creating happen at the same moment.
- Layout decisions on these pages follow the width of the content area, so they are correct at any window width, with or without the sidebar.

**Non-Goals:**
- No change to how publishing itself works, to the API shapes, or to the database schema.
- No redesign of the affected pages beyond what is needed to stop columns being cut off.

## Decisions

### Reset Published results inside the create transaction

`createAssessment` becomes one `prisma.$transaction`:

1. Look up the module and its programme; a missing module is still a validation error.
2. Lock the programme's students with the same `SELECT id FROM "Student" WHERE "programmeId" = ... ORDER BY id FOR UPDATE` that `publishModule` uses, so the two cannot interleave and the lock order matches.
3. Create the assessment.
4. `updateMany` the module's `ModuleResult` rows from `PUBLISHED` to `PENDING`.

A publish that runs first commits before the create can lock, and is then reset to Pending.
A publish that runs second waits for the lock, then sees the new assessment and refuses or skips the incomplete result.

Alternative considered: blocking the new assessment while results are Published.
Rejected by the user in favour of returning results to Pending.

### Warning on the form

The new-assessment page also loads the number of Published results per module (one `groupBy` on `ModuleResult` where state is `PUBLISHED`) and passes it inside each module option.
When staff choose a module with a count above zero, the form shows a note under the Module field: "1 published CS101 result will return to Pending." (or "N published ... results ..."), using the same wording logic for one and many.
The note is informational; the button and flow stay the same.

### Count wording

The count text becomes a small helper in the page: "N student(s)" plus " matches these filters" when N is 1 and " match these filters" otherwise, only when a search or filter is applied.

### Container queries for pages beside the sidebar

`<main>` in `AppShell` gets `@container`, making the content area the reference for layout.
On the affected pages, the viewport variants that decide which columns show or how columns are arranged switch to container variants with matching sizes:

- Dashboard overdue table: the `sm:`, `md:`, and `lg:` column toggles become `@sm:`, `@md:`, and `@3xl:` (or the nearest size where every shown column fits), with the name cell's fallback line following the same container sizes.
- Staff fees page: the two-column layout (`lg:grid-cols-[1fr_22rem]`) switches on a container size wide enough for the instalments table beside the payment form, and stacks below it.
- Module results table: the per-assessment columns (`md:table-cell`) show from a container size where Result and Actions still fit, and the Student ID stays on one line.
- Submitted file names: `break-all` becomes `break-words` with hyphen-friendly wrapping, so names wrap at hyphens or spaces.

The exact container sizes are chosen while implementing, by checking each page at 1024 px, 1280 px, and phone width; the Playwright tests below fix the outcome.

Alternative considered: moving every breakpoint up one step (`lg:` to `xl:`).
Rejected because it only fixes 1024 px with the sidebar and would hide columns on wide windows without a sidebar, such as phones in landscape.

### How the tests reproduce the bugs

- Results reset: an integration test at the `createAssessment` service seam, plus Playwright scenarios that publish, add an assessment, and check the student's marksheet.
- Same moment: an integration test that runs a publish and a create concurrently and checks the result is never Published with a missing grade.
- Layout: Playwright tests at a 1024 × 800 window that check each named table's container has no sideways overflow and that the named column or pill is fully visible.
- File names: a Playwright test that checks each file name's text node does not break inside a word, by comparing line boxes against word boundaries.

## Risks / Trade-offs

- [Staff may not expect results to reopen] → The form warns before creating, and the result shows as Pending on the results page, where staff publish again.
- [Students lose sight of released grades for a while] → This is the intended rule: a module's results are released only when complete.
- [Container sizes differ from the viewport sizes staff are used to] → Only the four affected areas change; each is checked at three widths.
- [The base specs are not archived yet] → These deltas only add requirements; sync and archive after `build-registry-module` and `add-sidebar-and-dashboard-cards` are archived.
