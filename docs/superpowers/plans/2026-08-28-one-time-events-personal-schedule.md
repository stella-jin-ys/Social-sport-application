# One-Time Events and Personal Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add confirmed one-time group events with city, description, member comments, and a read-only personal schedule.

**Architecture:** Extend the existing Prisma relational model with `Event` and `EventComment`, then expose small group-scoped query/service functions and server actions. Render event creation and comments in the existing group-detail experience, and add a signed-in `/schedule` page that queries upcoming events across active memberships.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/PostgreSQL, Zod, Better Auth, Tailwind CSS 4, Vitest, Testing Library, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-08-28-one-time-events-personal-schedule-design.md`

## Global Constraints

- Events are immediately confirmed when published; do not add date options, voting, event RSVP, or end times.
- Event fields are title, description, date, start time, and city; address and meeting details belong in the description.
- Only active group members can comment; only organizers can create, edit, or cancel events.
- Upcoming schedule results include only confirmed events from groups where the viewer has active membership.
- Keep existing recurring training attendance behavior unchanged.
- Use server-side authorization for every event mutation and comment mutation.
- New forms and controls require labels, visible focus styles, responsive narrow-screen layout, and feature-scoped axe coverage.

---

### Task 1: Add event and comment persistence primitives

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260828120000_add_events/migration.sql`
- Modify: `src/modules/groups/contracts.ts`
- Create: `src/modules/events/contracts.ts`
- Create: `src/modules/events/event-service.ts`
- Test: `tests/integration/event-service.test.ts`

**Interfaces:**
- Consumes: `Group`, `GroupMembership`, `User`, `getCurrentUser`, and existing Prisma client conventions.
- Produces: `EventStatus`, `EventSummary`, `EventCommentSummary`, `CreateEventInput`, `addEvent`, `listUpcomingGroupEvents`, `addEventComment`, and `listUpcomingUserEvents` for later tasks.

- [ ] **Step 1: Write failing persistence/service tests**

Add integration coverage for:

```ts
it("creates a confirmed event with a city and description");
it("lists upcoming events for an active member's groups in start-time order");
it("excludes cancelled and past events from upcoming results");
it("allows an active member to add a comment");
it("rejects comments from inactive or non-members");
```

Seed two groups, one organizer, one member, one non-member, one future event, one past event, and one cancelled event. Assert returned objects rather than database implementation details.

- [ ] **Step 2: Run the focused integration test and verify it fails**

Run:

```bash
node_modules/.bin/vitest run tests/integration/event-service.test.ts
```

Expected: FAIL because the event models and service functions do not exist.

- [ ] **Step 3: Add the Prisma models and migration**

Add:

```prisma
enum EventStatus {
  CONFIRMED
  CANCELLED
}

model Event {
  id          String      @id @default(cuid())
  groupId     String
  creatorId   String
  title       String
  description String
  startsAt    DateTime
  city        String
  status      EventStatus @default(CONFIRMED)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  group       Group       @relation(fields: [groupId], references: [id], onDelete: Cascade)
  creator     User        @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  comments    EventComment[]

  @@index([groupId, startsAt, status])
  @@index([city, startsAt, status])
}

model EventComment {
  id        String   @id @default(cuid())
  eventId   String
  authorId  String
  body      String
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([eventId, createdAt])
}
```

Add the inverse relations to `User` and `Group`, generate the migration using the repository’s Prisma command, and keep the migration checked in.

- [ ] **Step 4: Implement the service contracts and authorization**

Use these signatures:

```ts
export type EventStatus = "CONFIRMED" | "CANCELLED";
export type EventSummary = { id: string; groupSlug: string; groupName: string; title: string; description: string; city: string; startsAt: Date; status: EventStatus; comments: EventCommentSummary[] };
export type EventCommentSummary = { id: string; body: string; authorName: string; createdAt: Date };
export type CreateEventInput = { groupSlug: string; creatorId: string; title: string; description: string; startsAt: Date; city: string };
export async function addEvent(input: CreateEventInput): Promise<EventSummary>;
export async function listUpcomingGroupEvents(groupSlug: string): Promise<EventSummary[]>;
export async function listUpcomingUserEvents(userId: string): Promise<EventSummary[]>;
export async function addEventComment(eventId: string, authorId: string, body: string): Promise<EventCommentSummary>;
```

Validate non-empty bounded text in Zod contracts, require active membership for comments, require organizer role for event creation, and filter `startsAt > now` plus `status = CONFIRMED` in upcoming queries. Return the group slug/name and author display name needed by the UI.

- [ ] **Step 5: Run the focused integration test and verify it passes**

Run the same Vitest command. Expected: all event-service tests PASS.

- [ ] **Step 6: Commit the persistence slice**

```bash
git add prisma/schema.prisma prisma/migrations src/modules/events src/modules/groups/contracts.ts tests/integration/event-service.test.ts
git commit -m "feat: add one-time event persistence"
```

### Task 2: Expose authorized event and comment actions

**Files:**
- Modify: `src/app/groups/[slug]/actions.ts`
- Modify: `src/modules/events/contracts.ts`
- Create: `tests/unit/event-actions.test.ts`
- Create: `tests/integration/event-actions.test.ts`

**Interfaces:**
- Consumes: Task 1 service functions and `getCurrentUser`.
- Produces: `createEventAction`, `addEventCommentAction`, and `cancelEventAction` with stable result codes for the UI.

- [ ] **Step 1: Write failing action tests**

Cover the following calls:

```ts
await createEventAction({ groupSlug, title, description, date: "2026-09-10", time: "18:30", city: "Stockholm" });
await addEventCommentAction(eventId, "Can’t wait!");
await cancelEventAction(eventId);
```

Assert successful organizer/member results, `AUTH_REQUIRED` when signed out, `FORBIDDEN` for non-members/non-organizers, and `VALIDATION_ERROR` for blank or malformed input.

- [ ] **Step 2: Run focused action tests and verify they fail**

```bash
node_modules/.bin/vitest run tests/unit/event-actions.test.ts tests/integration/event-actions.test.ts
```

Expected: FAIL because the actions are not defined.

- [ ] **Step 3: Implement validation, authorization, revalidation, and action results**

Parse date and time into one local `Date` value using the project’s existing timezone convention. Return typed results such as:

```ts
type EventActionResult<T> =
  | { ok: true; event: T }
  | { ok: false; code: "AUTH_REQUIRED" | "FORBIDDEN" | "EVENT_NOT_FOUND" | "VALIDATION_ERROR" | "UNKNOWN"; message: string };
```

Revalidate the group page and schedule after successful event mutations or comments. Do not create attendance records.

- [ ] **Step 4: Run focused action tests and verify they pass**

Run the same Vitest command. Expected: all action tests PASS.

- [ ] **Step 5: Commit the action slice**

```bash
git add "src/app/groups/[slug]/actions.ts" src/modules/events/contracts.ts tests/unit/event-actions.test.ts tests/integration/event-actions.test.ts
git commit -m "feat: add authorized event actions"
```

### Task 3: Build group event creation, details, and comments UI

**Files:**
- Modify: `src/app/groups/[slug]/page.tsx`
- Modify: `src/app/groups/[slug]/group-detail.tsx`
- Create: `src/app/groups/[slug]/event-section.tsx`
- Create: `src/app/groups/[slug]/event-form.tsx`
- Create: `tests/unit/event-section.test.tsx`
- Create: `tests/unit/event-form.test.tsx`

**Interfaces:**
- Consumes: Task 1 `EventSummary`/`EventCommentSummary` and Task 2 action result types.
- Produces: accessible group event list, organizer-only event form, event detail view, and member-only comment form.

- [ ] **Step 1: Write failing component tests**

Test that:

```ts
render(<EventSection events={[event]} viewer={memberViewer} />);
expect(screen.getByText(event.title)).toBeInTheDocument();
expect(screen.getByText(event.city)).toBeInTheDocument();
expect(screen.getByRole("textbox", { name: /comment/i })).toBeInTheDocument();
```

Also test organizer-only create controls, signed-out/non-member read-only behavior, labelled title/description/date/time/city fields, inline validation, action error display, and empty-state copy.

- [ ] **Step 2: Run component tests and verify they fail**

```bash
node_modules/.bin/vitest run tests/unit/event-section.test.tsx tests/unit/event-form.test.tsx
```

Expected: FAIL because the components and group query data do not exist.

- [ ] **Step 3: Extend the group query and render the event section**

Load upcoming group events and comments in `getGroupPageData`, pass viewer membership and organizer state into `EventSection`, and render it below the recurring training controls. Keep the existing training attendance UI unchanged.

- [ ] **Step 4: Implement the event form and comment form**

Use controlled submission with pending state, labelled native date/time inputs, a city text input, a multiline description, and clear error/empty states. Show event description as the place for address and meeting-point details. Hide mutation controls when the viewer lacks the required permission.

- [ ] **Step 5: Run component tests and verify they pass**

Run the same Vitest command. Expected: all event UI tests PASS.

- [ ] **Step 6: Commit the group event UI**

```bash
git add "src/app/groups/[slug]" src/modules/groups/group-queries.ts tests/unit/event-section.test.tsx tests/unit/event-form.test.tsx
git commit -m "feat: add group event creation and comments"
```

### Task 4: Add the personal schedule and city event browsing

**Files:**
- Create: `src/app/schedule/page.tsx`
- Create: `src/app/schedule/schedule-list.tsx`
- Modify: `src/app/discover/discover-client.tsx`
- Modify: `src/app/discover/page.tsx`
- Create: `tests/unit/schedule-page.test.tsx`
- Create: `tests/e2e/schedule-events.spec.ts`

**Interfaces:**
- Consumes: Task 1 `listUpcomingUserEvents`, Task 2 auth state, and Task 3 event display patterns.
- Produces: signed-in `/schedule` route and city-filtered event results in the existing discovery experience.

- [ ] **Step 1: Write failing schedule and city-filter tests**

Assert that upcoming events from multiple active groups are sorted by `startsAt`, past/cancelled events are absent, no-membership users see the empty state, and a city filter shows only matching events.

- [ ] **Step 2: Run focused tests and verify they fail**

```bash
node_modules/.bin/vitest run tests/unit/schedule-page.test.tsx
```

Expected: FAIL because the schedule route and event discovery data do not exist.

- [ ] **Step 3: Implement the authenticated schedule route**

Use `getCurrentUser`; signed-out visitors receive the existing sign-in entry point. Render upcoming event cards with group, title, city, date, start time, and description. Provide a discover-groups link in the empty state.

- [ ] **Step 4: Add city filtering to event results**

Extend the existing Discover state/query path with an optional city filter for event results. Keep group filtering behavior intact and do not make event discovery a separate search system.

- [ ] **Step 5: Run focused tests and verify they pass**

Run the same Vitest command. Expected: all schedule tests PASS.

- [ ] **Step 6: Commit the schedule slice**

```bash
git add src/app/schedule src/app/discover tests/unit/schedule-page.test.tsx
git commit -m "feat: add personal event schedule"
```

### Task 5: Verify the complete event journey

**Files:**
- Modify: `tests/e2e/schedule-events.spec.ts`
- Modify: `tests/unit/*` only if a failing regression requires a focused assertion
- Modify: `docs/superpowers/README.md` and the active ledger after verification

**Interfaces:**
- Consumes: all previous tasks.
- Produces: evidence that organizer creation, member comments, authorization, city filtering, and schedule display work together.

- [ ] **Step 1: Add the end-to-end journey**

Cover:

1. Create an organizer account and group membership fixture.
2. Publish an event with description and city.
3. Verify the event appears on the group page.
4. Sign in as a member and post a comment.
5. Verify a non-member cannot comment or cancel the event.
6. Visit `/schedule` and verify the event appears with its city and start time.
7. Filter event results by city and verify a different city is excluded.
8. Verify the narrow viewport remains usable and feature-scoped axe scans have no violations.

- [ ] **Step 2: Run the complete verification set**

```bash
node_modules/.bin/vitest run
node_modules/.bin/tsc --noEmit
node_modules/.bin/eslint .
node_modules/.bin/playwright test
```

Expected: all tests pass, typecheck and lint pass, and no new feature-scoped accessibility violations are reported.

- [ ] **Step 3: Update the active ledger and commit verification artifacts**

Record exact test counts, any environment warnings, and the final commit range in the implementation notes for this plan. Update `docs/superpowers/README.md` only if the active-plan pointer changes.

- [ ] **Step 4: Commit final verification changes**

```bash
git add tests/e2e/schedule-events.spec.ts docs/superpowers/README.md
git commit -m "test: verify one-time event journey"
```
