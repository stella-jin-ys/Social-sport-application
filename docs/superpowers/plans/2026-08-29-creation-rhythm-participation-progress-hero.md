# Creation rhythm, participation, progress, and hero implementation plan

**Goal:** Complete the approved first-version slice for clear pending feedback, recurring group rhythm, men-only participation, and a consistent responsive hero.

**Spec:** User-approved scope in the current task on 2026-08-29.

**Architecture:** Keep the existing Next.js App Router and Prisma structure. Add one reusable indeterminate progress component, move the interactive group form into a small client component, keep parsing/validation in a pure server-safe module, and continue storing the human-readable rhythm in the existing `Group.schedule` field.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind/CSS, Prisma/PostgreSQL, Vitest/Testing Library, Playwright.

---

## Task 1: Lock the approved behavior with failing tests

**Files:**
- Modify: `tests/unit/auth-form.test.tsx`
- Modify: `tests/unit/discover-page.test.tsx`
- Modify: `tests/unit/home-page.test.tsx`
- Create: `tests/unit/group-creation.test.tsx`
- Create: `tests/e2e/hero-image.spec.ts`

1. Add deferred authentication tests that assert the form exposes `aria-busy`, an accessible indeterminate progress bar, and a disabled submit button for both sign-in and sign-up.
2. Add creation tests for the recurring checkbox, required rhythm field, flexible fallback schedule, men-only value, and pending submit presentation.
3. Add a Discover fixture and filter assertion for `Men only`.
4. Add browser assertions at 390px and 1440px for the same hero source, approximately 16:10 geometry, centered object position, and no image filter overlay.
5. Run the focused tests and confirm they fail for the missing behavior.

## Task 2: Add the reusable pending state

**Files:**
- Create: `src/components/pending-progress.tsx`
- Modify: `src/components/auth/auth-form.tsx`
- Modify: `src/app/globals.css`

1. Render an indeterminate `role="progressbar"` only while pending, with an explicit accessible label and no percentage attributes.
2. Set `aria-busy` on active auth forms and keep their submit buttons disabled with `Processing...`.
3. Add a thin, branded animation plus a reduced-motion fallback.
4. Run the auth and pending-state tests.

## Task 3: Implement recurring rhythm in group creation

**Files:**
- Create: `src/lib/group-creation-options.ts`
- Create: `src/modules/groups/group-creation.ts`
- Create: `src/components/groups/group-creation-form.tsx`
- Modify: `src/app/groups/new/page.tsx`

1. Extract the supported sports and participation values so the UI and server validation share one source.
2. Parse `recurring` and `rhythm` from `FormData`; require a rhythm only when recurring is checked, otherwise persist `Flexible or one-time schedule`.
3. Add the checkbox and conditionally revealed rhythm input to the client form.
4. Use `useFormStatus` to show the shared progress bar and disable the create button during the server action.
5. Keep `Group.schedule` as the profile display source and run the creation tests.

## Task 4: Add men-only participation end to end

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260829090000_add_men_only_participation/migration.sql`
- Modify: `src/modules/groups/contracts.ts`
- Modify: `src/modules/groups/group-queries.ts`
- Modify: `src/modules/groups/seed-groups.ts`
- Modify: `src/app/discover/discover-client.tsx`

1. Add `MEN_ONLY` to the Prisma enum and migration.
2. Add `Men only` to creation choices, public group labels, and Discover filters.
3. Regenerate Prisma Client, apply the migration to the local demo database, and run Discover, creation, and integration tests.

## Task 5: Normalize the responsive hero and verify the demo

**Files:**
- Modify: `src/app/page.tsx`

1. Replace breakpoint-specific fixed heights with one 16:10 frame.
2. Keep `/images/sports-community-hero.png`, set centered object positioning, and remove the orange image overlay.
3. Preserve both information-card backgrounds for readable text.
4. Run lint, typecheck, unit/integration tests, and the targeted Playwright checks.
5. Inspect the live demo at 390px and 1440px, including auth pending, creation pending, rhythm display, men-only filtering, and group profile output.
