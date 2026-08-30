# Sportship Signed-in Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show authenticated members their joined groups and upcoming activities on the home page while keeping a public sport/city finder and recommendations available.

**Architecture:** Keep `src/app/page.tsx` as the server boundary. Fetch the current user and database-backed personalized data there, render a signed-in dashboard when available, and extract the existing interactive finder into a client component. Reuse `PublicGroupCard` for recommendations and `ActivitySession` for training/events.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7, PostgreSQL, Vitest, Testing Library, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-30-signed-in-home-dashboard-design.md`

## Global Constraints

- Existing authentication, join actions, attendance actions, `/discover`, and group detail behavior remain unchanged.
- Active memberships only: `GroupMembership.status = ACTIVE`.
- Activities must be non-canceled and future-dated; order by `startsAt` ascending.
- Recommendations must exclude groups the member already actively joined.
- Signed-out visitors retain the public sport-and-city finder.
- No new event database model; `ActivitySession` represents training/events.
- Keep the current mobile-first visual system and reduced-motion behavior.

---

### Task 1: Add dashboard query contracts and failing query tests

**Files:**
- Modify: `src/modules/groups/contracts.ts`
- Modify: `tests/integration/group-queries.test.ts`

**Interfaces:**
- Produce `JoinedGroupCard`, `UpcomingActivity`, and `HomeDashboardData` types for the query and UI tasks.
- Tests will call `listJoinedGroups(userId)`, `listUpcomingActivities(userId)`, and `listRecommendedGroups(userId)` from `src/modules/groups/group-queries.ts`.

- [ ] **Step 1: Add failing integration tests**

Add tests that create a user, join `soder-sparks`, mark one session canceled, and assert:

```ts
it("returns only active joined groups with their next activity", async () => {
  await createTestUser("dashboard-member");
  await joinOpenGroup("dashboard-member", "soder-sparks");

  const joined = await listJoinedGroups("dashboard-member");

  expect(joined).toHaveLength(1);
  expect(joined[0]).toMatchObject({ slug: "soder-sparks", sportSlug: "innebandy" });
  expect(joined[0].nextActivity?.id).toBe("session-soder-sparks-next");
});

it("orders upcoming activities and excludes joined groups from recommendations", async () => {
  await createTestUser("dashboard-member");
  await joinOpenGroup("dashboard-member", "soder-sparks");

  const activities = await listUpcomingActivities("dashboard-member");
  const recommendations = await listRecommendedGroups("dashboard-member");

  expect(activities[0].groupSlug).toBe("soder-sparks");
  expect(recommendations.some((group) => group.slug === "soder-sparks")).toBe(false);
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `pnpm exec vitest run tests/integration/group-queries.test.ts`

Expected: FAIL because the three query functions and dashboard types do not exist yet.

- [ ] **Step 3: Add the contract types**

Define display-ready types with `nextActivity: UpcomingActivity | null`, including session id, group slug/name, title, `startsAt`, `endsAt`, venue, and going count. Keep recommendations typed as `PublicGroupCard[]`.

- [ ] **Step 4: Run typecheck to verify the contract shape**

Run: `pnpm exec tsc --noEmit`

Expected: PASS or failures limited to the not-yet-created query functions referenced by the tests.

### Task 2: Implement membership, activity, and recommendation queries

**Files:**
- Modify: `src/modules/groups/group-queries.ts`
- Test: `tests/integration/group-queries.test.ts`

**Interfaces:**
- `listJoinedGroups(userId: string): Promise<JoinedGroupCard[]>`
- `listUpcomingActivities(userId: string): Promise<UpcomingActivity[]>`
- `listRecommendedGroups(userId: string): Promise<PublicGroupCard[]>`

- [ ] **Step 1: Implement `listJoinedGroups`**

Query active memberships for `userId`, include each group and its earliest future, non-canceled session, order by `joinedAt` ascending, and map to `JoinedGroupCard`.

- [ ] **Step 2: Implement `listUpcomingActivities`**

Query `ActivitySession` records where `canceled = false`, `startsAt > new Date()`, and the related group has an active membership for `userId`; order by `startsAt` ascending and map to `UpcomingActivity`.

- [ ] **Step 3: Implement `listRecommendedGroups`**

Query public groups with `NOT` active membership for `userId`, include the existing next-session relation, preserve recommendation/name ordering, and map through the existing `toCard` helper.

- [ ] **Step 4: Run the integration tests**

Run: `pnpm exec vitest run tests/integration/group-queries.test.ts`

Expected: all query tests PASS. If the test database points at the development database, set the project’s test `DATABASE_URL` as defined by `tests/integration/database.ts` before rerunning; do not change production query behavior to accommodate test configuration.

- [ ] **Step 5: Commit the query layer**

Run: `git add src/modules/groups/contracts.ts src/modules/groups/group-queries.ts tests/integration/group-queries.test.ts && git commit -m "Add home dashboard group queries"`

### Task 3: Extract the public finder and build signed-in dashboard components

**Files:**
- Create: `src/components/home/home-finder.tsx`
- Create: `src/components/home/home-dashboard.tsx`
- Create: `src/components/home/joined-group-card.tsx`
- Create: `src/components/home/upcoming-activity.tsx`
- Create: `src/components/home/recommended-groups.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/home-page.test.tsx`

**Interfaces:**
- `HomeFinder`: receives public group data and renders the existing sport/city search interaction.
- `HomeDashboard`: receives `HomeDashboardData` and renders joined groups, activities, search action, recommendations, and empty states.
- `HomePage`: server component calls `getCurrentUser()`, selects public or personalized view, and passes data to one of the two surfaces.

- [ ] **Step 1: Add failing component tests**

Cover signed-out rendering, signed-in rendering with a joined group and upcoming activity, signed-in empty state, and recommendation/search links. Use a fixed `HomeDashboardData` fixture; do not mock Prisma in component tests.

- [ ] **Step 2: Extract the existing finder into `HomeFinder`**

Move the current sport/city state, filtering, sport icons, and result cards without changing behavior or copy. Keep the existing `Find groups` form and `View group` links.

- [ ] **Step 3: Implement the dashboard components**

Render joined group cards first, followed by an upcoming activity list. Include “Search other groups” linking to `/discover`. For no memberships, render a concise empty state and keep the finder/recommendations below. For groups without a next activity, render “No upcoming activity”.

- [ ] **Step 4: Convert `HomePage` to the server boundary**

Call `getCurrentUser()`. For signed-out visitors render `HomeFinder` with public group data. For signed-in users fetch joined groups, upcoming activities, and recommendations. Catch personalized query errors, log them, and fall back to the public finder with a neutral message.

- [ ] **Step 5: Run component tests and typecheck**

Run: `pnpm exec vitest run tests/unit/home-page.test.tsx tests/unit/home-dashboard.test.tsx`

Expected: all new and existing home tests PASS.

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

### Task 4: Verify the complete app and local demo

**Files:**
- Modify: `src/app/globals.css` only if the new dashboard needs responsive styling.
- Test: `tests/unit/*.test.tsx`, `tests/integration/*.test.ts`

- [ ] **Step 1: Run focused and full checks**

Run:

```bash
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm exec eslint src tests
node /Users/stella/.codex/skills/impeccable/scripts/detect.mjs --json src/app/page.tsx src/components/home src/modules/groups
git diff --check
```

- [ ] **Step 2: Seed the local database**

Run: `pnpm db:seed`

Confirm the local `/discover` route still lists the seeded catalog.

- [ ] **Step 3: Verify the browser paths**

Open `/` signed out and confirm the finder. Sign in with a local test account, join a group, return home, and confirm joined groups, upcoming activity, recommendations, and the search action. Do not expose or commit credentials.

- [ ] **Step 4: Commit the implementation**

Run: `git add src/app/page.tsx src/components/home src/modules/groups/contracts.ts src/modules/groups/group-queries.ts tests && git commit -m "Add signed-in Sportship home dashboard"`
