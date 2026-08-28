# Consolidated Final Fix Report

Date: 2026-08-28
Base: `18dfc843d0f5c3078ee2c74725e7d3412993fde5`

## Outcome

This wave addresses the dynamic Discover blocker, rejected client promises, deterministic modal focus, the unstyled auth modal/form, explicit root-layout typing, accessible E2E selectors, concurrent membership coverage, and the unreachable join-error storage handoff. No production membership-service change was needed: deterministic concurrent integration coverage proved the existing transaction/unique-constraint behavior increments membership and count exactly once for both initial joins and reactivation.

## Changed files

- `src/app/discover/page.tsx` — calls Next 16 `connection()` before the PostgreSQL-backed catalog read so `/discover` renders per request.
- `src/app/groups/[slug]/group-actions.tsx` — catches rejected join/attendance actions, restores pending state in `finally`, and renders the existing retryable alerts; removes the unreachable stored-error consumer.
- `src/components/auth/auth-form.tsx` — catches rejected sign-in/sign-up/auth-completion promises, restores pending state in `finally`, renders retry guidance, and adds auth-form structure/classes.
- `src/components/auth/auth-modal.tsx` — focuses the `tabIndex={-1}` modal heading immediately after `showModal()` and adds structured modal markup/classes without changing native dialog behavior.
- `src/app/globals.css` — adds only auth modal/form presentation: centered native dialog, backdrop, responsive sizing/scroll, 44px controls, vertical fields, pending/error/focus states, and incumbent Huddle palette fallbacks.
- `src/app/layout.tsx` — replaces `any` with `Readonly<{ children: ReactNode; modal: ReactNode }>`.
- `src/lib/pending-join.ts` — removes unreachable join-error storage producer/consumer functions.
- `tests/unit/group-actions.test.tsx` — rejected direct join, automatic pending join, and attendance regressions; removes synthetic stored-error coverage.
- `tests/unit/auth-form.test.tsx` — rejected sign-in and sign-up regressions.
- `tests/unit/auth-modal.test.tsx` — exact initial heading-focus regression.
- `tests/integration/membership-service.test.ts` — concurrent initial-join and reactivation cases with a PostgreSQL lock barrier that proves two calls overlap before release.
- `tests/e2e/join-group.spec.ts` — post-mutation Discover request regression, accessible Create-account selector, and exact modal-heading focus assertion.

## TDD evidence

### Rejected operations and initial focus

Focused RED:

```text
node_modules/.bin/vitest run tests/unit/group-actions.test.tsx tests/unit/auth-form.test.tsx tests/unit/auth-modal.test.tsx
Test Files 3 failed
Tests 6 failed | 9 passed
Errors 5 unhandled promise rejections
```

The six expected failures were rejected sign-in, rejected sign-up, rejected direct join, rejected automatic pending join, rejected attendance, and missing heading focus. DOM snapshots showed disabled `Joining…`, `Saving…`, and `Please wait…` controls with no alert; focus remained on `<body>`.

Focused GREEN:

```text
node_modules/.bin/vitest run tests/unit/group-actions.test.tsx tests/unit/auth-form.test.tsx tests/unit/auth-modal.test.tsx tests/unit/pending-join.test.ts
Test Files 4 passed
Tests 18 passed
```

No unhandled rejection section remained.

### Dynamic Discover

With the new E2E present and `connection()` temporarily removed, the production build reported `/discover` as `○ (Static)`. The focused production E2E failed because the second request still contained `12 going` after PostgreSQL had been updated to 13.

After restoring `connection()`, the production build reported `/discover` as `ƒ (Dynamic)`, and the identical production E2E passed:

```text
1 passed (2.3s)
```

The temporary source/config mutations used to prove RED were restored before final diff review.

### Concurrent membership calls

Both added cases call `joinOpenGroup()` twice while an `ACCESS EXCLUSIVE` table lock blocks membership writes. The test polls `pg_stat_activity` until two membership queries are simultaneously waiting, then releases the lock and asserts one `joined: true`, one membership row, and `memberCount: 43`.

```text
node_modules/.bin/vitest run tests/integration/membership-service.test.ts
Test Files 1 passed
Tests 4 passed
```

## Verification outcomes

- Final shortest focused rerun after interruption, `node_modules/.bin/vitest run tests/unit/group-actions.test.tsx tests/unit/auth-form.test.tsx tests/unit/auth-modal.test.tsx tests/unit/pending-join.test.ts && git diff --check` — **passed**, 4 files / 18 tests; diff check exit 0.
- `pnpm test:unit` — **unavailable**, exact output: `Command "test:unit" not found`. No package-script change was added because that is outside this final-fix scope.
- Equivalent installed unit command, `node_modules/.bin/vitest run tests/unit` — **passed**, 9 files / 28 tests.
- `pnpm test:integration` — **passed**, 4 files / 11 tests against the local PostgreSQL container.
- `node_modules/.bin/tsc --noEmit` — **passed**, exit 0.
- `node_modules/.bin/eslint .` — **passed**, exit 0.
- `node_modules/.bin/next build --webpack` — **passed**; compilation, TypeScript, prerender generation, and build traces completed; `/discover` classified dynamic.
- Focused production Discover E2E — **passed**, 1/1.
- Complete `pnpm test:e2e` against the already-running external port-3001 dev server — **partial: 3 passed, 4 timed out in 2.2m**. Passed: fresh Discover request, modal dismissal, and narrow-viewport focus/axe path. Timed out: four pre-existing auth journeys at their sign-up navigation waits (`page.waitForURL` / `page.waitForNavigation`). The run was not claimed as passing and no external-server environment debugging was added to scope.
- `git diff --check` — **passed** before report/staging.
- Impeccable detector — **not run**, per explicit controller instruction that it had already run once.

## Live visual audit

The incumbent CSS/components and the required `craft-floor.md` and `polish.md` guidance were read before styling. A bounded in-app-browser audit covered 1280×900 and 390×844. At mobile size the dialog bounds were 352×539.6 at x=19–371 and y=152.2–691.8, it required no internal scroll, the heading was the active element, and all buttons/inputs measured 44–50px high. Screenshots showed the modal centered with a dim backdrop, vertical labels/fields/actions, safe margins, visible focus, and no group-page image/color alteration. No correction batch was needed.

## Judgments and cost if wrong

- **Use `connection()` rather than path revalidation.** This directly solves indefinite static output for every PostgreSQL mutation, including mutations outside these server actions. Cost: `/discover` now performs a request-time DB read rather than serving a static artifact.
- **Catch unknown client rejection and show stable retry copy.** This keeps transport details out of the UI and guarantees controls recover. Cost: client-side error diagnostics remain generic; operational detail must come from server/transport logging.
- **Focus the modal heading, not the first input.** This announces dialog context before credentials and matches the explicit-focus spec. Cost: keyboard users press one extra Tab before the first field.
- **Remove join-error session storage.** Full navigation retains retry alerts in live component state, and repository search found no production producer. Cost if a future flow reintroduces cross-navigation error transfer: it must add an intentional channel and tests rather than relying on this deleted dead path.
- **Keep membership production code unchanged.** Lock-barrier tests prove current PostgreSQL transaction/unique behavior for initial and reactivation races. Cost if database semantics/provider change: the PostgreSQL-specific concurrency contract and test must be revisited.
- **Use local CSS classes with token fallbacks.** This is the smallest styling fix and preserves the existing group visuals. Cost: auth styles remain in `globals.css` rather than a component stylesheet; extracting a one-use abstraction would add unjustified complexity.
- **Do not add a missing `test:unit` script.** The equivalent unit scope was run directly and passed. Cost: future operators must continue using the installed Vitest command until package scripts are addressed in a separate tooling change.

## Dirty-worktree preservation

Pre-existing staged, unstaged, and untracked changes were not edited or included. `src/app/globals.css` already contained unrelated unstaged incumbent token/base styles; the final commit is constructed with only the auth CSS block, while the pre-existing block remains in the working tree. No Impeccable detector artifacts or transient Playwright config changes are included.
