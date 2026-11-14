These are common instructions for Alma's agents across all scenarios.

## General Guidelines
- Never use the em dash. Use plain dash "-" instead.
- When writing commit messages, never auto-add your agent name as co-author.
- Avoid contrastive sentence patterns like "This is not X, this is Y". Prefer direct positive phrasing that states the intended point without that setup.
- Never manually modify CHANGELOG.md files or any files marked as auto-generated.
- Ask clarifying questions to better understand the intent in the planning phase. Do not prematurely complete your assignment.
- When writing or substantially editing long Markdown files, put each full sentence on its own line. Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one physical line.
- When making technical decisions, prefer quality, simplicity, robustness, scalability, and long-term maintainability. Do not give much weight to development cost.
- When doing bug fixes, start by reproducing the bug in an end-to-end setting as closely aligned with real user behavior as possible. This helps ensure the actual problem is fixed.
- When end-to-end testing a product, be picky about the UI and fix obvious visual issues discovered along the way.
- Apply the same high standard to engineering hygiene: lint, test failures, and test flakiness should be addressed when encountered, even if they are not the main task.

## Spec-Driven Development (OpenSpec)
- For product/feature work, bug fixes that change behavior, and other non-trivial changes, follow the OpenSpec SDD workflow.
- Do not jump straight to implementation code.
- Use the matching OpenSpec skill (or `/opsx:*` command) for each step rather than inventing a parallel process.
- Default step order:
  1. **Explore** (optional) - clarify intent and investigate the codebase (`openspec-explore` / `/opsx:explore`)
  2. **Propose** - create the change and artifacts: proposal, specs, design, tasks (`openspec-propose` / `/opsx:propose`)
  3. **Apply** - implement only from the approved change tasks (`openspec-apply-change` / `/opsx:apply`), using TDD and Playwright end-to-end tests as below
  4. **Update** - revise planning artifacts when requirements or design shift (`openspec-update-change` / `/opsx:update`)
  5. **Sync / Archive** - sync delta specs if needed, then archive the completed change (`openspec-sync-specs` / `/opsx:sync`, `openspec-archive-change` / `/opsx:archive`)
- Do not implement until apply-required artifacts are complete (per `openspec status`).
- Keep exploring/updating planning artifacts when decisions change mid-flight; do not silently drift from the change docs.
- Exceptions: pure docs/typos, trivial one-line fixes, or when the user explicitly asks to skip OpenSpec.

## Test-Driven Development
- During Apply (and any implementation work), follow TDD by reading and applying the `/tdd` skill at `.agents/skills/tdd/SKILL.md` (including its linked `tests.md` and `mocking.md` as needed).
- Do not invent a parallel TDD process.
- Confirm seams with the user before writing tests, as required by that skill.
- Derive the behaviors under test from the OpenSpec change artifacts (specs and tasks).
- Exceptions: pure docs/typos, or when the user explicitly asks to skip TDD.

## End-to-End Testing (Playwright)
- Every user-facing behavior gets a Playwright test in `e2e/` that drives the app in a real browser the way a user would.
- Derive each test from the OpenSpec spec scenarios, and reuse the scenario name as the test title.
- Write the Playwright test inside the TDD loop for the slice it covers; it is one of the seams confirmed with the user.
- A task that changes what a user sees or does is complete only when its Playwright test passes.
- Run the full suite with `npm run test:e2e` before closing a task group and before Sync / Archive.
- For a bug fix, first reproduce the bug with a failing Playwright test, then fix it.
- Find elements by role, label, and visible text, and rely on auto-waiting assertions; use no fixed waits.
- Keep retries at 0; when a test is flaky, fix the cause.
- Review the screenshots and traces from each run for visual issues, and fix the ones found.
- Exceptions: pure docs/typos, changes with no user-facing effect, or when the user explicitly asks to skip end-to-end tests.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
