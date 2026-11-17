# Design

## Context

`/staff/results` calls `listModulesWithProgramme()` and renders bordered link rows.
The dashboard's "Results to publish" figure comes from `countResultsToPublish()` in `src/server/dashboard/service.ts`, which loads every module, student, grade, and module result and counts Pending results where `missingGrades` returns an empty list.
The student Assessments page already has coloured cards (`AssessmentCard`) with a `CARD_COLOURS` list backed by `--app-card-*` settings in `theme.css`.

## Goals / Non-Goals

**Goals:**
- One source of truth for "ready to publish", shared by the overview cards and the dashboard.
- Pill rules that are easy to test without a database.
- Reuse the existing card colours and `Pill` tones; no new theme settings.

**Non-Goals:**
- Changing the module results page, the publish actions, or the API.
- Doodles, per-state count boxes, a progress bar, or grouping by programme (tried in the mockup and dropped for simplicity).

## Decisions

### A results summary per module in the results service

Add `listModuleResultSummaries()` to `src/server/results/service.ts`.
It loads modules (with programme name and assessments), students, grades, and module results in four queries, as `countResultsToPublish` does today, and returns for each module: `id`, `code`, `title`, `programmeName`, `assessmentCount`, and `counts: { students, ready, waiting, withheld, published }`.
A Pending result is `ready` when `missingGrades` returns an empty list and `waiting` otherwise.

The dashboard's `countResultsToPublish` becomes the sum of `counts.ready` over these summaries, so both pages use the same rule.
Querying per module with `getModuleResults` was rejected: it would run one set of queries per module.

### A pure function for the pill

Add `moduleResultStatus(summary)` in `src/domain/results.ts`, returning `{ label, tone }` with the tone from the existing `Tone` type (`neutral`, `blue`, `purple`, `green`).
It applies the rules in the order the spec gives, so the order is visible in one place and covered by unit tests.
Singular and plural use the number as given ("1 ready to publish", "1 withheld"), since both phrases read correctly for any count.

### A `ModuleResultCard` that shares colours with `AssessmentCard`

Move `CARD_COLOURS` from `src/components/assessment-card.tsx` into `src/components/card-colours.ts` and import it in both cards.
`ModuleResultCard` is a Server Component: a `Link` styled like `AssessmentCard` (rounded, light background, code badge in the badge colour, "View results" in the accent colour), with the pill rendered by `Pill`.
The list keeps `aria-label="Modules"` and each card's accessible name starts with "<code> <title>", so existing tests that click `/CS101 Programming Fundamentals/` keep working.

## Risks / Trade-offs

- [The overview loads all grades on every visit] -> The same load already happens on the dashboard; data sizes for one registry are small.
- [Colour by position means a module's colour can change when modules are added] -> Accepted, same as the Assessments cards; colour is decoration and carries no meaning.
