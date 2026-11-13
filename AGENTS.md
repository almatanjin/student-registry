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
  3. **Apply** - implement only from the approved change tasks (`openspec-apply-change` / `/opsx:apply`), using TDD as below
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
