# Persistent Membership and Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist public group membership and training attendance in PostgreSQL, with a signed-out Join action that opens modal authentication and completes the pending join only after successful authentication.

**Architecture:** Prisma becomes the source of truth for the six public groups, their next sessions, memberships, and attendance. Next.js server components load public and user-specific state; focused services enforce idempotency and authorization; thin server actions expose mutations. A route-intercepted authentication modal consumes a tab-scoped pending join intent after Better Auth succeeds, while direct sign-in never joins a group.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9 strict mode, PostgreSQL 17, Prisma ORM 7, Better Auth 1.7, Zod 4, Vitest, Testing Library, Playwright, and axe-core.

**Spec:** `docs/superpowers/specs/2026-08-27-persistent-membership-attendance-design.md`

## Global Constraints

- Public group profiles remain visible without authentication.
- Only a pending intent created by pressing **Join group** may complete membership after modal authentication.
- Failed authentication creates no membership and keeps the intent only while the modal remains open for retry.
- Closing, cancelling, or navigating Back from the modal clears the intent and creates no membership.
- Direct `/sign-in` and `/sign-up` visits never create membership.
- Public open groups join instantly; no approval, invitation, moderation UI, chat, waiting list, or recurring-session generation is added.
- Only active members can set attendance.
- Join and attendance writes are idempotent and authorized on the server.
- Preserve the existing Huddle visual design, responsive behavior, keyboard focus treatment, and accessible state labels.
- Preserve unrelated staged and untracked work. Use path-scoped `git commit --only` commands and never reset the worktree.

## File Structure

```text
prisma/
  schema.prisma                         Domain models beside Better Auth models
  seed.ts                               Executable public-group seed entrypoint
  migrations/20260827150000_groups_membership_attendance/migration.sql
                                         Committed domain migration
src/
  app/
    @modal/default.tsx                  Empty parallel-route fallback
    @modal/(.)sign-in/page.tsx          Intercepted authentication modal
    (auth)/sign-in/page.tsx             Direct sign-in page using shared form
    (auth)/sign-up/page.tsx             Direct sign-up page using shared form
    discover/discover-client.tsx        Existing interactive filters and cards
    discover/page.tsx                   Server loader for public group cards
    groups/[slug]/actions.ts             Authenticated join and attendance actions
    groups/[slug]/group-actions.tsx      Client Join and attendance controls
    groups/[slug]/page.tsx               Server-rendered public group profile
    layout.tsx                           Root parallel modal slot
  components/auth/
    auth-form.tsx                        Shared sign-in/sign-up form
    auth-modal.tsx                       Native accessible modal and join completion
  lib/
    current-user.ts                      Optional and required session readers
    group-catalog.ts                     Seed input plus sport labels
    pending-join.ts                      Tab-scoped intent and retry-error storage
  modules/
    groups/contracts.ts                  Stable public view and action result types
    groups/group-queries.ts              Public group and user-state reads
    groups/membership-service.ts         Idempotent membership mutation
    groups/seed-groups.ts                Repeatable seed function
    activities/attendance-service.ts     Authorized attendance upsert
tests/
  integration/database.ts               Domain reset and test-user helpers
  integration/group-seed.test.ts         Seed/read verification
  integration/membership-service.test.ts Join idempotency and reactivation
  integration/attendance-service.test.ts Attendance authorization and replacement
  unit/auth-modal.test.tsx                Pending-join authentication behavior
  unit/group-actions.test.tsx             Join and attendance component states
  unit/pending-join.test.ts               Intent validation and clearing
  e2e/join-group.spec.ts                  Full success, failure, dismissal, reload flow
```

---

### Task 1: PostgreSQL Domain Schema and Repeatable Group Seed

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260827150000_groups_membership_attendance/migration.sql`
- Create: `prisma/seed.ts`
- Create: `src/modules/groups/seed-groups.ts`
- Modify: `src/lib/group-catalog.ts`
- Create: `tests/integration/database.ts`
- Create: `tests/integration/group-seed.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Regenerate: `src/generated/prisma/**`

**Interfaces:**
- Consumes: Existing `prisma` client, Better Auth `User`, and the six `groupCatalog` entries.
- Produces: Prisma models `Group`, `GroupMembership`, `ActivitySession`, `AttendanceResponse`; `seedGroups(): Promise<void>`; `resetDomainData(): Promise<void>`; stable session IDs in the form `session-${group.slug}-next`.

- [ ] **Step 1: Add machine-readable seed values to the catalog**

Extend `GroupProfile` with numeric totals and ISO timestamps while retaining existing display strings:

```ts
memberTotal: number;
goingTotal: number;
nextTraining: {
  date: string;
  time: string;
  venue: string;
  startsAt: string;
  endsAt: string;
};
```

Use these exact values for the six entries:

```ts
const seededSessionTimes = {
  "soder-sparks": ["2026-09-01T16:30:00.000Z", "2026-09-01T18:00:00.000Z"],
  "parken-5-a-side": ["2026-09-02T17:00:00.000Z", "2026-09-02T18:30:00.000Z"],
  "sunrise-miles": ["2026-09-05T07:15:00.000Z", "2026-09-05T08:30:00.000Z"],
  "volley-after-work": ["2026-09-03T16:00:00.000Z", "2026-09-03T17:30:00.000Z"],
  "mollevangen-padel": ["2026-09-06T14:00:00.000Z", "2026-09-06T15:30:00.000Z"],
  "lund-loop-club": ["2026-09-05T09:00:00.000Z", "2026-09-05T11:00:00.000Z"],
} as const;
```

Set `memberTotal` to `42, 31, 58, 36, 24, 29` and `goingTotal` to `12, 8, 16, 10, 6, 9` in catalog order.

- [ ] **Step 2: Write the failing seed integration test**

```ts
// tests/integration/group-seed.test.ts
import { beforeEach, expect, it } from "vitest";
import { prisma, resetDomainData } from "./database";
import { seedGroups } from "@/modules/groups/seed-groups";

beforeEach(resetDomainData);

it("seeds a public group and its stable next session idempotently", async () => {
  await seedGroups();
  await prisma.group.update({
    where: { slug: "soder-sparks" },
    data: { memberCount: 43 },
  });
  await prisma.activitySession.update({
    where: { id: "session-soder-sparks-next" },
    data: { goingCount: 13 },
  });
  await seedGroups();

  const groups = await prisma.group.findMany({
    include: { sessions: true },
    orderBy: { slug: "asc" },
  });

  expect(groups).toHaveLength(6);
  const sparks = groups.find((group) => group.slug === "soder-sparks");
  expect(sparks).toMatchObject({
    memberCount: 43,
    membershipMode: "PUBLIC_OPEN",
    participation: "WOMEN_ONLY",
  });
  expect(sparks?.sessions).toEqual([
    expect.objectContaining({
      id: "session-soder-sparks-next",
      goingCount: 13,
      venue: "Eriksdalsskolan sports hall",
    }),
  ]);
});
```

Create `tests/integration/database.ts` with:

```ts
import { prisma } from "@/lib/db";

export { prisma };

export async function resetDomainData() {
  await prisma.$transaction([
    prisma.attendanceResponse.deleteMany(),
    prisma.groupMembership.deleteMany(),
    prisma.activitySession.deleteMany(),
    prisma.group.deleteMany(),
  ]);
}

export async function createTestUser(id: string) {
  return prisma.user.upsert({
    where: { email: `${id}@example.test` },
    update: {},
    create: { id, email: `${id}@example.test`, name: id },
  });
}
```

- [ ] **Step 3: Run the test and verify the missing-model failure**

Run:

```bash
docker compose up -d db
pnpm vitest run tests/integration/group-seed.test.ts
```

Expected: FAIL because `prisma.group` and `seedGroups` do not exist.

- [ ] **Step 4: Add the minimal Prisma domain models**

Add these relations to `User`:

```prisma
groupMemberships   GroupMembership[]
attendanceResponses AttendanceResponse[]
```

Add these domain definitions:

```prisma
enum ParticipationType {
  WOMEN_ONLY
  MIXED
  OPEN
}

enum MembershipMode {
  PUBLIC_OPEN
  APPROVAL_ONLY
  INVITE_ONLY
}

enum GroupRole {
  ORGANIZER
  MEMBER
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
}

enum AttendanceStatus {
  GOING
  NOT_GOING
}

model Group {
  id               String            @id @default(cuid())
  slug             String            @unique
  name             String
  sport            String
  sportSlug        String
  location         String
  timeLabel        String
  participation    ParticipationType
  membershipMode   MembershipMode    @default(PUBLIC_OPEN)
  memberCount      Int               @default(0)
  recommended      Boolean           @default(false)
  tone             String
  accent           String
  description      String
  organizerName    String
  schedule         String
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  memberships      GroupMembership[]
  sessions         ActivitySession[]

  @@index([sportSlug])
  @@index([participation])
}

model GroupMembership {
  id        String           @id @default(cuid())
  groupId   String
  userId    String
  role      GroupRole        @default(MEMBER)
  status    MembershipStatus @default(ACTIVE)
  joinedAt  DateTime         @default(now())
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  group     Group            @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([userId, status])
}

model ActivitySession {
  id          String               @id
  groupId     String
  title       String
  startsAt    DateTime
  endsAt      DateTime
  venue       String
  canceled    Boolean              @default(false)
  goingCount  Int                  @default(0)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  group       Group                @relation(fields: [groupId], references: [id], onDelete: Cascade)
  attendance  AttendanceResponse[]

  @@index([groupId, startsAt])
}

model AttendanceResponse {
  id        String           @id @default(cuid())
  sessionId String
  userId    String
  status    AttendanceStatus
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  session   ActivitySession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sessionId, userId])
  @@index([userId, status])
}
```

- [ ] **Step 5: Implement repeatable seeding and migration**

Implement `seedGroups()` by upserting each `groupCatalog` item by slug, mapping participation labels exactly as follows, then upserting its stable next session:

```ts
const participation = {
  "Women only": "WOMEN_ONLY",
  "Mixed group": "MIXED",
  "Open to all": "OPEN",
} as const;

const publicValues = {
  name: group.name,
  sport: group.sport,
  sportSlug: group.sportSlug,
  location: group.location,
  timeLabel: group.time,
  participation: participation[group.audience],
  membershipMode: "PUBLIC_OPEN" as const,
  recommended: group.recommended,
  tone: group.tone,
  accent: group.accent,
  description: group.description,
  organizerName: group.organizer,
  schedule: group.schedule,
};

const saved = await prisma.group.upsert({
  where: { slug: group.slug },
  update: publicValues,
  create: { slug: group.slug, memberCount: group.memberTotal, ...publicValues },
});

const sessionPublicValues = {
  groupId: saved.id,
  title: `${group.name} training`,
  startsAt: new Date(group.nextTraining.startsAt),
  endsAt: new Date(group.nextTraining.endsAt),
  venue: group.nextTraining.venue,
  canceled: false,
};

await prisma.activitySession.upsert({
  where: { id: `session-${group.slug}-next` },
  update: sessionPublicValues,
  create: {
    id: `session-${group.slug}-next`,
    goingCount: group.goingTotal,
    ...sessionPublicValues,
  },
});
```

Do not overwrite `memberCount` or `goingCount` in the update branches; rerunning the seed must preserve real joins and attendance.

Make `prisma/seed.ts` call `seedGroups()` and disconnect in `finally`. Add `tsx` to dev dependencies and add:

```json
"db:seed": "tsx prisma/seed.ts",
"test:integration": "vitest run tests/integration"
```

Run:

```bash
pnpm exec prisma migrate dev --name groups_membership_attendance
pnpm exec prisma generate
pnpm db:seed
```

- [ ] **Step 6: Verify schema and seed behavior**

Run:

```bash
pnpm vitest run tests/integration/group-seed.test.ts
pnpm exec prisma migrate status
pnpm typecheck
```

Expected: the integration test passes, the schema is up to date, and TypeScript reports no errors.

- [ ] **Step 7: Commit only Task 1 files**

```bash
git add package.json pnpm-lock.yaml prisma src/generated/prisma src/lib/group-catalog.ts src/modules/groups/seed-groups.ts tests/integration
git commit --only package.json pnpm-lock.yaml prisma src/generated/prisma src/lib/group-catalog.ts src/modules/groups/seed-groups.ts tests/integration -m "feat: add persistent group data"
```

---

### Task 2: Server-Backed Public Group Queries and Discover

**Files:**
- Create: `src/modules/groups/contracts.ts`
- Create: `src/modules/groups/group-queries.ts`
- Create: `src/app/discover/discover-client.tsx`
- Modify: `src/app/discover/page.tsx`
- Modify: `tests/unit/discover-page.test.tsx`
- Create: `tests/integration/group-queries.test.ts`

**Interfaces:**
- Consumes: Seeded `Group` and `ActivitySession` rows from Task 1.
- Produces: `PublicGroupCard`, `GroupPageData`, `listPublicGroups(): Promise<PublicGroupCard[]>`, and `getGroupPageData(slug: string, userId?: string): Promise<GroupPageData | null>`.

- [ ] **Step 1: Define stable view contracts**

```ts
// src/modules/groups/contracts.ts
export type Audience = "Women only" | "Mixed group" | "Open to all";
export type AttendanceChoice = "GOING" | "NOT_GOING";

export type PublicGroupCard = {
  slug: string;
  name: string;
  sport: string;
  sportSlug: string;
  location: string;
  time: string;
  audience: Audience;
  members: string;
  recommended: boolean;
  tone: string;
  accent: string;
};

export type GroupPageData = PublicGroupCard & {
  memberCount: number;
  description: string;
  organizer: string;
  schedule: string;
  viewer: {
    isAuthenticated: boolean;
    isMember: boolean;
    attendanceStatus: AttendanceChoice | null;
  };
  nextTraining: {
    id: string;
    date: string;
    time: string;
    venue: string;
    goingCount: number;
  } | null;
};
```

- [ ] **Step 2: Write failing query integration tests**

```ts
// tests/integration/group-queries.test.ts
import { beforeEach, expect, it } from "vitest";
import { prisma, resetDomainData } from "./database";
import { listPublicGroups, getGroupPageData } from "@/modules/groups/group-queries";
import { seedGroups } from "@/modules/groups/seed-groups";

beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

it("returns database-backed public cards in recommendation order", async () => {
  const groups = await listPublicGroups();
  expect(groups).toHaveLength(6);
  expect(groups[0]).toMatchObject({ slug: "soder-sparks", audience: "Women only" });
});

it("returns a public detail without private viewer state", async () => {
  const group = await getGroupPageData("soder-sparks");
  expect(group?.viewer).toEqual({
    isAuthenticated: false,
    isMember: false,
    attendanceStatus: null,
  });
  expect(group?.nextTraining?.id).toBe("session-soder-sparks-next");
});
```

- [ ] **Step 3: Run tests and verify missing query modules**

Run:

```bash
pnpm vitest run tests/integration/group-queries.test.ts
```

Expected: FAIL because `contracts.ts` and `group-queries.ts` do not exist.

- [ ] **Step 4: Implement query mapping**

Use one explicit mapper so Prisma enums do not leak into client components:

```ts
import type { Prisma } from "@/generated/prisma/client";

type GroupWithNextSession = Prisma.GroupGetPayload<{
  include: { sessions: true };
}>;

const audienceLabels = {
  WOMEN_ONLY: "Women only",
  MIXED: "Mixed group",
  OPEN: "Open to all",
} as const;

function toCard(group: GroupWithNextSession): PublicGroupCard {
  const next = group.sessions[0];
  return {
    slug: group.slug,
    name: group.name,
    sport: group.sport,
    sportSlug: group.sportSlug,
    location: group.location,
    time: group.timeLabel,
    audience: audienceLabels[group.participation],
    members: `${next?.goingCount ?? 0} going`,
    recommended: group.recommended,
    tone: group.tone,
    accent: group.accent,
  };
}
```

`listPublicGroups()` selects each group's earliest non-cancelled session and orders recommended groups first, then names alphabetically. `getGroupPageData()` selects the same session plus an active membership and that user's response only when `userId` is supplied. Format the Stockholm-facing date and time with `Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Stockholm" })` so the seeded UTC instants render the existing local labels.

- [ ] **Step 5: Split Discover into server loader and client filters**

Move the current interactive page body to `DiscoverClient({ groups }: { groups: PublicGroupCard[] })`. Keep `sports` as static filter labels, but remove `groupCatalog` from runtime filtering.

Make the route a server component:

```tsx
// src/app/discover/page.tsx
import { listPublicGroups } from "@/modules/groups/group-queries";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  return <DiscoverClient groups={await listPublicGroups()} />;
}
```

Update `tests/unit/discover-page.test.tsx` to render `<DiscoverClient groups={groupFixtures} />`, where `groupFixtures` contains Söder Sparks, Parken 5-a-side, and Sunrise Miles using the `PublicGroupCard` contract. Keep the existing three filter assertions and href assertion.

- [ ] **Step 6: Verify public discovery**

Run:

```bash
pnpm vitest run tests/unit/discover-page.test.tsx tests/integration/group-queries.test.ts
pnpm typecheck
```

Expected: component and integration tests pass with no TypeScript errors.

- [ ] **Step 7: Commit only Task 2 files**

```bash
git add src/modules/groups/contracts.ts src/modules/groups/group-queries.ts src/app/discover tests/unit/discover-page.test.tsx tests/integration/group-queries.test.ts
git commit --only src/modules/groups/contracts.ts src/modules/groups/group-queries.ts src/app/discover tests/unit/discover-page.test.tsx tests/integration/group-queries.test.ts -m "feat: load public groups from postgres"
```

---

### Task 3: Idempotent Open-Group Membership Service

**Files:**
- Create: `src/modules/groups/membership-service.ts`
- Modify: `src/lib/current-user.ts`
- Create: `src/app/groups/[slug]/actions.ts`
- Create: `tests/integration/membership-service.test.ts`
- Create: `tests/unit/group-actions-server.test.ts`

**Interfaces:**
- Consumes: Better Auth session lookup and Prisma group/membership models.
- Produces: `joinOpenGroup(userId: string, groupSlug: string): Promise<JoinResult>`, `getCurrentUser(): Promise<CurrentUser | null>`, and `joinGroupAction(groupSlug: string): Promise<JoinGroupActionResult>`.

- [ ] **Step 1: Define the result contracts**

Add to `src/modules/groups/contracts.ts`:

```ts
export type JoinResult = {
  membershipId: string;
  joined: boolean;
  memberCount: number;
};

export type JoinGroupActionResult =
  | { ok: true; memberCount: number }
  | { ok: false; code: "AUTH_REQUIRED" | "GROUP_NOT_FOUND" | "GROUP_NOT_OPEN" | "UNKNOWN"; message: string };
```

- [ ] **Step 2: Write failing membership integration tests**

```ts
// tests/integration/membership-service.test.ts
import { beforeEach, expect, it } from "vitest";
import { createTestUser, prisma, resetDomainData } from "./database";
import { joinOpenGroup } from "@/modules/groups/membership-service";
import { seedGroups } from "@/modules/groups/seed-groups";

beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
  await createTestUser("member-a");
});

it("joins an open group once when the request is repeated", async () => {
  const first = await joinOpenGroup("member-a", "soder-sparks");
  const second = await joinOpenGroup("member-a", "soder-sparks");

  expect(first.joined).toBe(true);
  expect(second.joined).toBe(false);
  expect(await prisma.groupMembership.count()).toBe(1);
  expect(second.memberCount).toBe(43);
});

it("reactivates an inactive membership without inserting another", async () => {
  await joinOpenGroup("member-a", "soder-sparks");
  await prisma.groupMembership.updateMany({
    where: { userId: "member-a" },
    data: { status: "INACTIVE" },
  });
  await prisma.group.update({
    where: { slug: "soder-sparks" },
    data: { memberCount: { decrement: 1 } },
  });

  const result = await joinOpenGroup("member-a", "soder-sparks");
  expect(result.joined).toBe(true);
  expect(result.memberCount).toBe(43);
  expect(await prisma.groupMembership.count()).toBe(1);
});
```

- [ ] **Step 3: Run tests and verify the missing service failure**

Run:

```bash
pnpm vitest run tests/integration/membership-service.test.ts
```

Expected: FAIL because `membership-service.ts` does not exist.

- [ ] **Step 4: Implement the transaction without duplicate counts**

`joinOpenGroup()` must:

1. Find the group by slug and reject missing or non-`PUBLIC_OPEN` groups with typed domain errors.
2. In one Prisma transaction, reactivate an inactive row with `updateMany`; if none changed, use `createMany({ skipDuplicates: true })`.
3. Increment `Group.memberCount` only when one row was reactivated or inserted.
4. Read and return the canonical membership and count.

Define the service error used by the server action:

```ts
export class JoinGroupError extends Error {
  constructor(
    public readonly code: "GROUP_NOT_FOUND" | "GROUP_NOT_OPEN",
    message: string,
  ) {
    super(message);
  }
}
```

Use this state-change guard:

```ts
const reactivated = await tx.groupMembership.updateMany({
  where: { groupId: group.id, userId, status: "INACTIVE" },
  data: { status: "ACTIVE", joinedAt: new Date() },
});

const inserted = reactivated.count === 0
  ? await tx.groupMembership.createMany({
      data: [{ groupId: group.id, userId, role: "MEMBER", status: "ACTIVE" }],
      skipDuplicates: true,
    })
  : { count: 0 };

const joined = reactivated.count + inserted.count === 1;
```

- [ ] **Step 5: Add optional session reading and the server action**

Refactor `src/lib/current-user.ts` to produce:

```ts
export type CurrentUser = { id: string; name: string; email: string };
export async function getCurrentUser(): Promise<CurrentUser | null>;
export async function requireUser(): Promise<CurrentUser>;
```

`getCurrentUser()` calls `auth.api.getSession({ headers: await headers() })` and returns `null` instead of redirecting. `requireUser()` reuses it and redirects only when a page explicitly requires authentication.

Create `joinGroupAction()` in `src/app/groups/[slug]/actions.ts`. Validate slugs with:

```ts
const groupSlugInput = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
```

Return `AUTH_REQUIRED` without mutating when `getCurrentUser()` is null. Map known membership errors to stable action codes; log unexpected server errors and return `{ ok: false, code: "UNKNOWN", message: "We could not join this group. Please try again." }`. Revalidate `/groups/${slug}` after success.

- [ ] **Step 6: Test the unauthenticated action boundary**

Mock `getCurrentUser` and `joinOpenGroup` in `tests/unit/group-actions-server.test.ts`:

```ts
it("does not call the membership service without a session", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  const result = await joinGroupAction("soder-sparks");
  expect(result).toMatchObject({ ok: false, code: "AUTH_REQUIRED" });
  expect(joinOpenGroup).not.toHaveBeenCalled();
});
```

- [ ] **Step 7: Verify membership behavior**

Run:

```bash
pnpm vitest run tests/integration/membership-service.test.ts tests/unit/group-actions-server.test.ts
pnpm typecheck
```

Expected: duplicate and reactivation tests pass, the signed-out action performs no mutation, and TypeScript reports no errors.

- [ ] **Step 8: Commit only Task 3 files**

```bash
git add src/modules/groups/contracts.ts src/modules/groups/membership-service.ts src/lib/current-user.ts 'src/app/groups/[slug]/actions.ts' tests/integration/membership-service.test.ts tests/unit/group-actions-server.test.ts
git commit --only src/modules/groups/contracts.ts src/modules/groups/membership-service.ts src/lib/current-user.ts 'src/app/groups/[slug]/actions.ts' tests/integration/membership-service.test.ts tests/unit/group-actions-server.test.ts -m "feat: persist open group membership"
```

---

### Task 4: Pending Join Intent and Route-Intercepted Authentication Modal

**Files:**
- Create: `src/lib/pending-join.ts`
- Create: `src/components/auth/auth-form.tsx`
- Create: `src/components/auth/auth-modal.tsx`
- Create: `src/app/@modal/default.tsx`
- Create: `src/app/@modal/(.)sign-in/page.tsx`
- Modify: `src/app/(auth)/sign-in/page.tsx`
- Modify: `src/app/(auth)/sign-up/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `tests/unit/pending-join.test.ts`
- Create: `tests/unit/auth-modal.test.tsx`

**Interfaces:**
- Consumes: `authClient`, `joinGroupAction`, and validated group return paths.
- Produces: `PendingJoin`, `setPendingJoin()`, `readPendingJoin()`, `clearPendingJoin()`, `setJoinError()`, `takeJoinError()`, reusable `AuthForm`, and the intercepted `/sign-in` modal.

- [ ] **Step 1: Write failing intent-storage tests**

```ts
// tests/unit/pending-join.test.ts
import { beforeEach, expect, it } from "vitest";
import { clearPendingJoin, readPendingJoin, setPendingJoin } from "@/lib/pending-join";

beforeEach(() => window.sessionStorage.clear());

it("stores a same-group pending join in this tab", () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  expect(readPendingJoin()).toEqual({
    groupSlug: "soder-sparks",
    returnTo: "/groups/soder-sparks",
  });
});

it("rejects arbitrary or mismatched return paths", () => {
  expect(() => setPendingJoin({
    groupSlug: "soder-sparks",
    returnTo: "https://evil.example/groups/soder-sparks",
  })).toThrow();
  expect(() => setPendingJoin({
    groupSlug: "soder-sparks",
    returnTo: "/groups/parken-5-a-side",
  })).toThrow();
});

it("clears the intent without returning a membership side effect", () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  clearPendingJoin();
  expect(readPendingJoin()).toBeNull();
});
```

- [ ] **Step 2: Implement tab-scoped storage and error handoff**

```ts
export type PendingJoin = { groupSlug: string; returnTo: string };

const intentKey = "huddle:pending-join";
const errorKey = "huddle:join-error";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(intent: PendingJoin) {
  if (!slugPattern.test(intent.groupSlug) || intent.returnTo !== `/groups/${intent.groupSlug}`) {
    throw new Error("Invalid pending join intent");
  }
}
```

`setPendingJoin()` validates and serializes to `sessionStorage`; `readPendingJoin()` parses defensively and clears malformed data; `clearPendingJoin()` removes it. `setJoinError(message)` stores one message, and `takeJoinError()` returns then removes that message so stale errors do not survive subsequent visits.

- [ ] **Step 3: Write failing modal behavior tests**

Mock `authClient`, `joinGroupAction`, and `next/navigation`. Cover these exact outcomes in `tests/unit/auth-modal.test.tsx`:

```tsx
it("completes the pending join only after successful authentication", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({ data: {}, error: null });
  vi.mocked(joinGroupAction).mockResolvedValue({ ok: true, memberCount: 43 });

  render(<AuthModal />);
  await userEvent.type(screen.getByLabelText(/email/i), "member@example.test");
  await userEvent.type(screen.getByLabelText(/password/i), "long-enough");
  await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

  expect(joinGroupAction).toHaveBeenCalledWith("soder-sparks");
  expect(readPendingJoin()).toBeNull();
  expect(router.back).toHaveBeenCalled();
});

it("keeps intent after failed authentication and clears it on close", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({
    data: null,
    error: { message: "Invalid credentials" },
  });

  render(<AuthModal />);
  await submitCredentials();
  expect(joinGroupAction).not.toHaveBeenCalled();
  expect(readPendingJoin()).not.toBeNull();

  await userEvent.click(screen.getByRole("button", { name: /close/i }));
  expect(readPendingJoin()).toBeNull();
});

it("completes the same pending join after a successful retry", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email)
    .mockResolvedValueOnce({ data: null, error: { message: "Invalid credentials" } })
    .mockResolvedValueOnce({ data: {}, error: null });
  vi.mocked(joinGroupAction).mockResolvedValue({ ok: true, memberCount: 43 });

  render(<AuthModal />);
  await submitCredentials();
  expect(joinGroupAction).not.toHaveBeenCalled();
  await submitCredentials();
  expect(joinGroupAction).toHaveBeenCalledWith("soder-sparks");
});
```

Add `@testing-library/user-event` to dev dependencies for keyboard-realistic form tests.

- [ ] **Step 4: Extract the reusable authentication form**

Create:

```ts
export type AuthFormProps = {
  variant: "sign-in" | "sign-up";
  onAuthenticated?: () => Promise<void>;
};
```

For sign-in, retain email and password after an error. For sign-up, retain name, email, and password after an error. Disable submit while pending and show the returned error in `<p role="alert">`. If `onAuthenticated` exists, await it after Better Auth succeeds; otherwise navigate only to a validated local `returnTo` path or `/`.

Replace both direct auth pages with the shared form:

```tsx
export default function SignInPage() {
  return <AuthForm variant="sign-in" />;
}
```

```tsx
export default function SignUpPage() {
  return <AuthForm variant="sign-up" />;
}
```

- [ ] **Step 5: Implement the accessible modal and intercepted route**

`AuthModal` uses a native `<dialog>` opened with `showModal()`, a labelled heading, a visible Close button, Escape handling through `onCancel`, and a sign-in/create-account toggle that swaps the shared form variant without leaving the modal. Its close helper calls `dialog.close()` before navigating Back so the native dialog restores focus to the Join button. The effect cleanup clears any unconsumed pending intent, covering browser Back and route replacement.

On successful authentication:

```ts
const intent = readPendingJoin();
if (!intent) {
  router.back();
  router.refresh();
  return;
}

const result = await joinGroupAction(intent.groupSlug);
clearPendingJoin();
if (!result.ok) setJoinError(result.message);
router.back();
router.refresh();
```

On Close, Cancel, or Escape, call `clearPendingJoin()` before `router.back()`.

Add the parallel slot to `RootLayout`:

```tsx
export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

`src/app/@modal/default.tsx` returns `null`; `src/app/@modal/(.)sign-in/page.tsx` returns `<AuthModal />`.

- [ ] **Step 6: Verify modal success, failure, retry, and dismissal**

Run:

```bash
pnpm vitest run tests/unit/pending-join.test.ts tests/unit/auth-modal.test.tsx tests/unit/auth-input.test.ts
pnpm typecheck
```

Expected: all intent and authentication cases pass, including no join call after failed authentication or dismissal.

- [ ] **Step 7: Commit only Task 4 files**

```bash
git add package.json pnpm-lock.yaml src/lib/pending-join.ts src/components/auth src/app/@modal 'src/app/(auth)' src/app/layout.tsx tests/unit/pending-join.test.ts tests/unit/auth-modal.test.tsx
git commit --only package.json pnpm-lock.yaml src/lib/pending-join.ts src/components/auth src/app/@modal 'src/app/(auth)' src/app/layout.tsx tests/unit/pending-join.test.ts tests/unit/auth-modal.test.tsx -m "feat: complete pending joins after modal auth"
```

---

### Task 5: Authorized Attendance and Persistent Group Detail Controls

**Files:**
- Create: `src/modules/activities/attendance-service.ts`
- Modify: `src/modules/groups/group-queries.ts`
- Modify: `src/app/groups/[slug]/actions.ts`
- Create: `src/app/groups/[slug]/group-actions.tsx`
- Modify: `src/app/groups/[slug]/page.tsx`
- Create: `tests/integration/attendance-service.test.ts`
- Create: `tests/unit/group-actions.test.tsx`
- Modify: `tests/unit/group-detail-page.test.tsx`

**Interfaces:**
- Consumes: Membership service, `GroupPageData`, pending intent storage, and the current user session.
- Produces: `setAttendance(userId, sessionId, status): Promise<AttendanceResult>`, `setAttendanceAction(sessionId, status): Promise<AttendanceActionResult>`, and UI controls driven by server state.

- [ ] **Step 1: Add attendance result contracts**

```ts
// src/modules/groups/contracts.ts
export type AttendanceResult = {
  status: AttendanceChoice;
  goingCount: number;
};

export type AttendanceActionResult =
  | { ok: true; status: AttendanceChoice; goingCount: number }
  | { ok: false; code: "AUTH_REQUIRED" | "NOT_MEMBER" | "SESSION_NOT_FOUND" | "UNKNOWN"; message: string };
```

- [ ] **Step 2: Write failing attendance integration tests**

```ts
// tests/integration/attendance-service.test.ts
import { beforeEach, expect, it } from "vitest";
import { setAttendance } from "@/modules/activities/attendance-service";
import { joinOpenGroup } from "@/modules/groups/membership-service";
import { seedGroups } from "@/modules/groups/seed-groups";
import { createTestUser, prisma, resetDomainData } from "./database";

beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
  await createTestUser("member-a");
});

it("rejects attendance from a non-member", async () => {
  await expect(setAttendance("member-a", "session-soder-sparks-next", "GOING"))
    .rejects.toMatchObject({ code: "NOT_MEMBER" });
  expect(await prisma.attendanceResponse.count()).toBe(0);
});

it("creates and replaces one response while keeping the count correct", async () => {
  await joinOpenGroup("member-a", "soder-sparks");
  const going = await setAttendance("member-a", "session-soder-sparks-next", "GOING");
  const repeated = await setAttendance("member-a", "session-soder-sparks-next", "GOING");
  const notGoing = await setAttendance("member-a", "session-soder-sparks-next", "NOT_GOING");

  expect(going.goingCount).toBe(13);
  expect(repeated.goingCount).toBe(13);
  expect(notGoing.goingCount).toBe(12);
  expect(await prisma.attendanceResponse.count()).toBe(1);
});
```

- [ ] **Step 3: Run the tests and verify missing attendance service**

Run:

```bash
pnpm vitest run tests/integration/attendance-service.test.ts
```

Expected: FAIL because `attendance-service.ts` does not exist.

- [ ] **Step 4: Implement authorized attendance replacement**

Inside one transaction, load the session, require an active membership for `(session.groupId, userId)`, read the prior response, and compute this exact count delta:

```ts
const delta =
  previous?.status === status ? 0 :
  previous?.status === "GOING" ? -1 :
  status === "GOING" ? 1 : 0;
```

Define and throw this service error for action mapping:

```ts
export class AttendanceError extends Error {
  constructor(
    public readonly code: "SESSION_NOT_FOUND" | "NOT_MEMBER",
    message: string,
  ) {
    super(message);
  }
}
```

Upsert on `(sessionId, userId)`, update `ActivitySession.goingCount` only when `delta !== 0`, and return canonical status/count.

- [ ] **Step 5: Add the attendance server action**

Add to `src/app/groups/[slug]/actions.ts`:

```ts
const attendanceInput = z.object({
  sessionId: z.string().min(1).max(120),
  status: z.enum(["GOING", "NOT_GOING"]),
});

export async function setAttendanceAction(
  sessionId: string,
  status: AttendanceChoice,
): Promise<AttendanceActionResult>;
```

Return `AUTH_REQUIRED` before calling the service when no session exists. Map known domain errors, return a retryable `UNKNOWN` message for unexpected failures, and revalidate the owning group route after success.

- [ ] **Step 6: Write failing client-control tests**

Mock `next/navigation`, `joinGroupAction`, and `setAttendanceAction` in `tests/unit/group-actions.test.tsx`.

```tsx
it("opens authentication and records intent for a signed-out visitor", async () => {
  render(<GroupActions {...baseProps} isAuthenticated={false} isMember={false} />);
  await userEvent.click(screen.getByRole("button", { name: "Join group" }));
  expect(readPendingJoin()).toEqual({
    groupSlug: "soder-sparks",
    returnTo: "/groups/soder-sparks",
  });
  expect(router.push).toHaveBeenCalledWith("/sign-in?returnTo=%2Fgroups%2Fsoder-sparks");
});

it("lets an active member persist going and not-going states", async () => {
  vi.mocked(setAttendanceAction)
    .mockResolvedValueOnce({ ok: true, status: "GOING", goingCount: 13 })
    .mockResolvedValueOnce({ ok: true, status: "NOT_GOING", goingCount: 12 });

  render(<GroupActions {...baseProps} isAuthenticated isMember />);
  await userEvent.click(screen.getByRole("button", { name: "I'm coming" }));
  expect(screen.getByRole("button", { name: "You're coming" })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: "You're coming" }));
  expect(screen.getByRole("button", { name: "I'm coming" })).toHaveAttribute("aria-pressed", "false");
});
```

Also assert that a non-member sees “Join the group to respond” and cannot call `setAttendanceAction`, and that `takeJoinError()` renders a one-time `<p role="alert">`.

- [ ] **Step 7: Convert the group profile to server data**

Make `src/app/groups/[slug]/page.tsx` an async server component:

```tsx
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const group = await getGroupPageData(slug, user?.id);
  if (!group) return <GroupNotFound />;

  return <GroupDetail group={group} />;
}
```

Keep `GroupNotFound` and exported `GroupDetail({ group }: { group: GroupPageData })` as focused presentational functions in the same page file. Preserve the current visual markup, but replace browser `useState` with `<GroupActions>` props from `group.viewer`, `group.memberCount`, and `group.nextTraining`. The action component must:

- send a signed-out Join click into the pending-auth flow;
- call `joinGroupAction()` directly for signed-in non-members;
- display `Joined` from server or successful action state;
- lock attendance until membership is active;
- disable only the pending control and use `Joining…` or `Saving…` labels;
- display inline retry errors with `role="alert"`;
- use `aria-pressed` for joined and going states.

Update `tests/unit/group-detail-page.test.tsx` to test a presentational `GroupDetail` with an injected `GroupPageData` fixture rather than mocking `useParams`.

- [ ] **Step 8: Verify persistent profile controls**

Run:

```bash
pnpm vitest run tests/integration/attendance-service.test.ts tests/integration/group-queries.test.ts tests/unit/group-actions.test.tsx tests/unit/group-detail-page.test.tsx tests/unit/group-actions-server.test.ts
pnpm typecheck
pnpm lint
```

Expected: authorization, replacement, count, component state, type, and lint checks all pass.

- [ ] **Step 9: Commit only Task 5 files**

```bash
git add src/modules/activities src/modules/groups/contracts.ts src/modules/groups/group-queries.ts 'src/app/groups/[slug]' tests/integration/attendance-service.test.ts tests/unit/group-actions.test.tsx tests/unit/group-detail-page.test.tsx tests/unit/group-actions-server.test.ts
git commit --only src/modules/activities src/modules/groups/contracts.ts src/modules/groups/group-queries.ts 'src/app/groups/[slug]' tests/integration/attendance-service.test.ts tests/unit/group-actions.test.tsx tests/unit/group-detail-page.test.tsx tests/unit/group-actions-server.test.ts -m "feat: persist training attendance"
```

---

### Task 6: Browser Journey, Accessibility, and Production Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/join-group.spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Complete public discovery, intercepted auth, membership, and attendance flow from Tasks 1–5.
- Produces: `pnpm test:e2e` and repeatable completion evidence on a clean PostgreSQL database.

- [ ] **Step 1: Add browser-test dependencies and configuration**

Run:

```bash
pnpm add -D @playwright/test @axe-core/playwright
pnpm exec playwright install chromium
```

Add:

```json
"test:e2e": "playwright test"
```

Configure `playwright.config.ts` with `testDir: "tests/e2e"`, one Chromium project, `baseURL: "http://127.0.0.1:3101"`, screenshots on failure, and:

```ts
webServer: {
  command: "pnpm dev -- --port 3101",
  url: "http://127.0.0.1:3101",
  reuseExistingServer: false,
  env: {
    ...process.env,
    BETTER_AUTH_URL: "http://127.0.0.1:3101",
  },
},
```

- [ ] **Step 2: Write the full successful journey**

```ts
// tests/e2e/join-group.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetDomainData } from "../integration/database";
import { seedGroups } from "@/modules/groups/seed-groups";

test.beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

test("creates an account, completes the pending join, and persists attendance", async ({ page }) => {
  const email = `member-${Date.now()}@example.test`;
  await page.goto("/discover");
  await page.getByRole("link", { name: "View group" }).first().click();
  await page.getByRole("button", { name: "Join group" }).click();

  const dialog = page.getByRole("dialog", { name: /join söder sparks/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /create account/i }).click();
  await dialog.getByLabel(/name/i).fill("Test Member");
  await dialog.getByLabel(/email/i).fill(email);
  await dialog.getByLabel(/password/i).fill("long-enough-password");
  await dialog.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/groups\/soder-sparks$/);
  await expect(page.getByRole("button", { name: "Joined" })).toBeVisible();
  await page.getByRole("button", { name: "I'm coming" }).click();
  await expect(page.getByRole("button", { name: "You're coming" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Joined" })).toBeVisible();
  await expect(page.getByRole("button", { name: "You're coming" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

- [ ] **Step 3: Add failed-authentication and dismissal journeys**

Create one user through the direct sign-up page, sign out, then test an incorrect password in the Join modal. Assert the error is visible, the dialog remains open, and **Joined** is absent. Close the modal and assert **Join group** remains.

Add a separate dismissal case:

```ts
test("closing authentication leaves the visitor unjoined", async ({ page }) => {
  await page.goto("/groups/soder-sparks");
  await page.getByRole("button", { name: "Join group" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /close/i }).click();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
});
```

- [ ] **Step 4: Add narrow-viewport keyboard verification**

Set a `390 × 844` viewport, open Join using `Tab` and `Enter`, verify focus enters the dialog, close with `Escape`, and verify focus returns to **Join group**. Run axe on the group page and modal state.

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Join group" }).focus();
await page.keyboard.press("Enter");
await expect(page.getByRole("dialog")).toBeFocused({ timeout: 2_000 });
await page.keyboard.press("Escape");
await expect(page.getByRole("button", { name: "Join group" })).toBeFocused();
```

If the native dialog focuses its first field instead of the dialog element, assert that the focused element is contained by the dialog rather than weakening the focus requirement.

- [ ] **Step 5: Run the complete verification matrix**

Run:

```bash
docker compose up -d db
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm build -- --webpack
```

Expected: all unit, integration, browser, accessibility, type, lint, and production build checks exit successfully.

- [ ] **Step 6: Verify the live demo manually**

Start the app on port 3001 and use a fresh browser tab to verify:

1. Discover loads six database-backed cards.
2. Söder Sparks opens from its card.
3. Signed-out Join opens the modal over the same group page.
4. Failed sign-in followed by Close leaves the visitor unjoined.
5. Successful account creation returns already joined.
6. Attendance persists after reload.
7. Browser console has no application errors.

- [ ] **Step 7: Commit only Task 6 files**

```bash
git add package.json pnpm-lock.yaml playwright.config.ts tests/e2e
git commit --only package.json pnpm-lock.yaml playwright.config.ts tests/e2e -m "test: verify persistent join journey"
```

## Final Acceptance Checklist

- [ ] Public Discover and group profiles work while signed out.
- [ ] Join opens a route-intercepted accessible modal over the group page.
- [ ] Successful modal authentication automatically creates exactly one active membership.
- [ ] Failed authentication creates no membership and permits retry while the modal remains open.
- [ ] Closing, cancelling, or navigating Back clears the intent and leaves the visitor unjoined.
- [ ] Direct authentication creates no group membership.
- [ ] Active membership and attendance survive reloads.
- [ ] Non-members cannot write attendance through the UI or server action.
- [ ] Repeated joins and attendance responses do not duplicate records or counts.
- [ ] Existing filters, card contrast, responsive layout, and keyboard states remain intact.
- [ ] Unit, integration, E2E, accessibility, typecheck, lint, and production build checks pass.
