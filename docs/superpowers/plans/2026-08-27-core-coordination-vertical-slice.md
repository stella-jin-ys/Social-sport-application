# Core Coordination Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete mobile journey: create an account, discover and instantly join a public sports group, view an automatically generated weekly session, respond to attendance, and discuss that session.

**Architecture:** Use a Next.js 16 App Router modular monolith with server-rendered public pages, Server Actions for authenticated mutations, PostgreSQL for canonical state, and small domain services under `src/modules`. Prisma repositories remain inside each module, while Zod schemas define mutation and query boundaries.

**Tech Stack:** Node.js 24 LTS, pnpm 10, Next.js 16, React 19, TypeScript 5.9 strict mode, PostgreSQL 17, Prisma ORM 7, Better Auth, Zod, Tailwind CSS 4, Vitest, Testing Library, Playwright, and axe-core.

**Spec:** `docs/superpowers/specs/2026-08-27-group-sport-community-platform-design.md`

## Global Constraints

- Launch as a responsive, mobile-first web application that can be installed as a Progressive Web App.
- Public groups allow instant joining unless an organizer chooses approval-only or invite-only membership.
- The MVP discovery filters are exactly: sport; country, city, or area; women-only, mixed, or open participation.
- Exact venues, member-only profile details, and conversations are hidden from visitors.
- A member can belong to multiple groups and hold a different role in each group.
- Attendance states are `GOING`, `MAYBE`, and `NOT_GOING`; waiting-list promotion is FIFO.
- Retried joins, session generation, attendance responses, and messages cannot create duplicate records.
- Membership and role authorization is enforced on the server for every protected action.
- Phase 1 remains an internal pilot; public launch waits for the safety controls in Phase 5 of the roadmap.
- Keep the application as one deployable service and one PostgreSQL database.

## File Structure

```text
src/
  app/                         Next.js routes, layouts, and route-specific UI
  components/                  Shared visual components only
  generated/prisma/            Generated Prisma client; not edited by hand
  lib/                         Database, authentication, environment, and shared test-safe utilities
  modules/
    catalog/                   Sports, locations, and profile preferences
    groups/                    Group records, membership, authorization, and discovery
    activities/                Recurrence, generated sessions, and attendance
    conversations/             Phase-1 session threads and messages
prisma/
  schema.prisma                Database schema, including Better Auth models
  migrations/                  Committed migration history
tests/
  unit/                        Pure domain and component tests
  integration/                 PostgreSQL-backed service tests
  e2e/                         Complete browser journeys
```

---

### Task 1: Application and Test Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Test: `tests/unit/home-page.test.tsx`

**Interfaces:**
- Consumes: None.
- Produces: `pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, and the `@/*` import alias used by every later task.

- [ ] **Step 1: Write the failing home-page test**

```tsx
// tests/unit/home-page.test.tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("explains the core product action", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /find your next sports group/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover groups/i })).toHaveAttribute(
      "href",
      "/discover",
    );
  });
});
```

- [ ] **Step 2: Run the test and verify the missing application failure**

Run: `pnpm vitest run tests/unit/home-page.test.tsx`

Expected: FAIL because `package.json` and `src/app/page.tsx` do not exist.

- [ ] **Step 3: Install the foundation and add the minimal page**

Run:

```bash
pnpm init
pnpm add next@16 react@19 react-dom@19 zod
pnpm add -D typescript@5.9 @types/node@24 @types/react@19 @types/react-dom@19 tailwindcss@4 @tailwindcss/postcss eslint eslint-config-next@16 vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

Set these scripts in `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Create the page:

```tsx
// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold">Find your next sports group</h1>
      <p>Discover a community, join a weekly activity, and keep every update together.</p>
      <Link className="rounded-full bg-slate-950 px-5 py-3 text-center text-white" href="/discover">
        Discover groups
      </Link>
    </main>
  );
}
```

Configure Vitest with `globals: true`, `environment: "jsdom"`, `setupFiles: ["./tests/setup.ts"]`, the React plugin, and alias `@` to `./src`. Import `@testing-library/jest-dom/vitest` from `tests/setup.ts`. Configure TypeScript with `strict: true`, `moduleResolution: "bundler"`, and the same `@/*` alias.

- [ ] **Step 4: Run the foundation checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`

Expected: all four commands exit successfully and the home-page test passes.

- [ ] **Step 5: Commit the foundation**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.ts tests/setup.ts tests/unit/home-page.test.tsx src/app
git commit -m "chore: scaffold group sport application"
```

---

### Task 2: PostgreSQL and Account Sessions

**Files:**
- Create: `compose.yaml`
- Create: `.env.example`
- Create: `prisma.config.ts`
- Create: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `src/lib/env.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/lib/current-user.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/app/(auth)/sign-up/page.tsx`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Test: `tests/unit/auth-input.test.ts`

**Interfaces:**
- Consumes: Task 1 project scripts and `@/*` alias.
- Produces: `prisma`, `auth`, `authClient`, `requireUser(): Promise<{ id: string; name: string; email: string }>` and browser routes `/sign-up`, `/sign-in`, `/api/auth/*`.

- [ ] **Step 1: Write the failing account-input test**

```ts
// tests/unit/auth-input.test.ts
import { signUpInput } from "@/lib/auth";

describe("signUpInput", () => {
  it("requires a valid email and an eight-character password", () => {
    expect(signUpInput.safeParse({ name: "Ada", email: "bad", password: "short" }).success).toBe(false);
    expect(
      signUpInput.safeParse({
        name: "Ada",
        email: "ada@example.test",
        password: "long-enough",
      }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing auth module failure**

Run: `pnpm vitest run tests/unit/auth-input.test.ts`

Expected: FAIL with a module-resolution error for `@/lib/auth`.

- [ ] **Step 3: Configure PostgreSQL, Prisma, and Better Auth**

Run:

```bash
pnpm add better-auth @better-auth/prisma-adapter @prisma/client@7 @prisma/adapter-pg pg
pnpm add -D prisma@7 @types/pg
docker compose up -d db
pnpm exec prisma init --datasource-provider postgresql --output ../src/generated/prisma
```

Use this local service in `compose.yaml`:

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: group_sport
      POSTGRES_USER: group_sport
      POSTGRES_PASSWORD: group_sport
    ports:
      - "54329:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U group_sport"]
      interval: 2s
      timeout: 2s
      retries: 15
```

Set `.env.example` to:

```dotenv
DATABASE_URL=postgresql://group_sport:group_sport@localhost:54329/group_sport
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=development-only-secret-with-32-characters
```

Create `src/lib/auth.ts`:

```ts
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const signUpInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
```

Mount it at `src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

Run `pnpm dlx auth@latest generate --yes`, review the generated auth models, then run `pnpm exec prisma migrate dev --name init_auth` and `pnpm exec prisma generate`. Implement sign-up and sign-in forms with `authClient.signUp.email` and `authClient.signIn.email`, preserving field values and showing the returned error message when a submission fails.

- [ ] **Step 4: Verify account infrastructure**

Run: `pnpm vitest run tests/unit/auth-input.test.ts && pnpm typecheck && pnpm exec prisma migrate status`

Expected: the test passes, TypeScript reports no errors, and Prisma reports that the database schema is up to date.

- [ ] **Step 5: Commit account infrastructure**

```bash
git add compose.yaml .env.example prisma.config.ts prisma src/generated src/lib src/app/api src/app/\(auth\) tests/unit/auth-input.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add account authentication"
```

---

### Task 3: Sports Profile and Location Preferences

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `prisma/seed.ts`
- Create: `src/modules/catalog/contracts.ts`
- Create: `src/modules/catalog/profile-service.ts`
- Create: `src/app/onboarding/actions.ts`
- Create: `src/app/onboarding/page.tsx`
- Create: `tests/integration/database.ts`
- Test: `tests/integration/profile-service.test.ts`

**Interfaces:**
- Consumes: `prisma` and the authenticated Better Auth user ID from Task 2.
- Produces: `profileInput`, `saveProfile(userId: string, input: ProfileInput): Promise<void>`, and seeded `Sport` rows addressed by stable slugs.

- [ ] **Step 1: Write the failing profile persistence test**

```ts
// tests/integration/profile-service.test.ts
import { prisma, resetDatabase } from "./database";
import { saveProfile } from "@/modules/catalog/profile-service";

beforeEach(resetDatabase);

it("stores sports and manually selected locations for one user", async () => {
  const user = await prisma.user.create({
    data: { id: "user-1", name: "Stella", email: "stella@example.test", emailVerified: true },
  });
  const sport = await prisma.sport.create({ data: { name: "Innebandy", slug: "innebandy" } });

  await saveProfile(user.id, {
    sportIds: [sport.id],
    locations: [{ country: "Sweden", city: "Stockholm", area: "Södermalm" }],
  });

  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: { sports: true, locations: true },
  });
  expect(profile.sports.map(({ sportId }) => sportId)).toEqual([sport.id]);
  expect(profile.locations[0]).toMatchObject({ country: "Sweden", city: "Stockholm", area: "Södermalm" });
});
```

- [ ] **Step 2: Run the test and verify the missing model failure**

Run: `pnpm vitest run tests/integration/profile-service.test.ts`

Expected: FAIL because `UserProfile`, `Sport`, `UserSport`, and `LocationPreference` are not generated.

- [ ] **Step 3: Add catalog models and profile service**

Add Prisma models with these uniqueness rules:

```prisma
model Sport {
  id       String      @id @default(cuid())
  name     String      @unique
  slug     String      @unique
  profiles UserSport[]
}

model UserProfile {
  id        String               @id @default(cuid())
  userId    String               @unique
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  sports    UserSport[]
  locations LocationPreference[]
}

model UserSport {
  profileId String
  sportId   String
  profile   UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  sport     Sport       @relation(fields: [sportId], references: [id], onDelete: Cascade)
  @@id([profileId, sportId])
}

model LocationPreference {
  id        String      @id @default(cuid())
  profileId String
  country   String
  city      String
  area      String?
  profile   UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  @@unique([profileId, country, city, area])
}
```

Define `profileInput` with one or more sport IDs and one or more `{ country, city, area? }` records, then export `type ProfileInput = z.infer<typeof profileInput>`. Implement `saveProfile` as one transaction that upserts `UserProfile`, replaces its sports and locations, and validates that every supplied sport exists. Seed `innebandy`, `football`, `running`, `volleyball`, `cycling`, and `yoga`.

- [ ] **Step 4: Run migration and profile checks**

Run: `pnpm exec prisma migrate dev --name add_profiles && pnpm exec prisma generate && pnpm vitest run tests/integration/profile-service.test.ts`

Expected: migration succeeds and the integration test passes.

- [ ] **Step 5: Commit profile onboarding**

```bash
git add prisma src/modules/catalog src/app/onboarding tests/integration package.json
git commit -m "feat: add sports profile onboarding"
```

---

### Task 4: Public Groups, Roles, and Instant Joining

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `src/modules/groups/contracts.ts`
- Create: `src/modules/groups/authorization.ts`
- Create: `src/modules/groups/group-service.ts`
- Create: `src/app/groups/new/actions.ts`
- Create: `src/app/groups/new/page.tsx`
- Create: `src/app/groups/[slug]/join-button.tsx`
- Create: `src/app/groups/[slug]/page.tsx`
- Test: `tests/integration/group-service.test.ts`

**Interfaces:**
- Consumes: authenticated user ID and `Sport.id` from Tasks 2–3.
- Produces: `createGroup(input, actorId)`, `joinOpenGroup(groupId, userId)`, `getPublicGroup(slug, viewerId?)`, and `requireGroupRole(groupId, userId, roles)`.

- [ ] **Step 1: Write the failing group lifecycle test**

```ts
// tests/integration/group-service.test.ts
import { prisma, resetDatabase } from "./database";
import { createGroup, joinOpenGroup } from "@/modules/groups/group-service";

beforeEach(resetDatabase);

it("creates an open public group and joins a second user exactly once", async () => {
  const [owner, member] = await Promise.all([
    prisma.user.create({ data: { id: "owner", name: "Owner", email: "owner@example.test", emailVerified: true } }),
    prisma.user.create({ data: { id: "member", name: "Member", email: "member@example.test", emailVerified: true } }),
  ]);
  const sport = await prisma.sport.create({ data: { name: "Innebandy", slug: "innebandy" } });
  const group = await createGroup(
    {
      name: "Stockholm Social Innebandy",
      sportId: sport.id,
      country: "Sweden",
      city: "Stockholm",
      area: "Södermalm",
      participationType: "WOMEN_ONLY",
      membershipMode: "OPEN",
      description: "Friendly weekly innebandy for adults.",
    },
    owner.id,
  );

  await Promise.all([joinOpenGroup(group.id, member.id), joinOpenGroup(group.id, member.id)]);
  expect(await prisma.groupMembership.count({ where: { groupId: group.id, userId: member.id } })).toBe(1);
});
```

- [ ] **Step 2: Run the test and verify the missing group service failure**

Run: `pnpm vitest run tests/integration/group-service.test.ts`

Expected: FAIL because the group module and Prisma models do not exist.

- [ ] **Step 3: Add group models and transactional services**

Add enums `ParticipationType { WOMEN_ONLY MIXED OPEN }`, `MembershipMode { OPEN APPROVAL_ONLY PRIVATE }`, and `GroupRole { ORGANIZER CO_ORGANIZER MEMBER }`. Add `Group` and `GroupMembership` with `@@unique([groupId, userId])`; add a unique group slug and indexes on `sportId`, `country`, `city`, and `participationType`.

Implement `createGroup` in one transaction that creates the group and an `ORGANIZER` membership. Implement `joinOpenGroup` with `upsert`; reject non-`OPEN` groups with a typed `MembershipModeError`. `getPublicGroup` returns public fields to visitors and includes exact venue and conversation links only when `viewerId` has a membership.

- [ ] **Step 4: Verify group behavior and public privacy**

Add a second integration assertion that a visitor response omits exact venue and member-only links. Run:

`pnpm exec prisma migrate dev --name add_groups && pnpm exec prisma generate && pnpm vitest run tests/integration/group-service.test.ts`

Expected: both lifecycle and privacy assertions pass.

- [ ] **Step 5: Commit groups and membership**

```bash
git add prisma src/modules/groups src/app/groups tests/integration/group-service.test.ts
git commit -m "feat: add public groups and instant joining"
```

---

### Task 5: Discovery with the Three Approved Filters

**Files:**
- Create: `src/modules/groups/discovery.ts`
- Create: `src/app/discover/search-form.tsx`
- Create: `src/app/discover/group-card.tsx`
- Create: `src/app/discover/page.tsx`
- Test: `tests/integration/discovery.test.ts`
- Test: `tests/unit/discovery-form.test.tsx`

**Interfaces:**
- Consumes: `Group`, `Sport`, and public-field rules from Tasks 3–4.
- Produces: `groupSearchInput` and `searchGroups(query: GroupSearchQuery): Promise<PublicGroupSummary[]>`.

- [ ] **Step 1: Write failing discovery contract tests**

```ts
// tests/unit/discovery-form.test.tsx
import { render, screen } from "@testing-library/react";
import { SearchForm } from "@/app/discover/search-form";

it("offers only the approved filter categories", () => {
  render(<SearchForm sports={[{ id: "1", name: "Innebandy", slug: "innebandy" }]} />);
  expect(screen.getAllByRole("combobox").map((input) => input.getAttribute("name"))).toEqual([
    "sport",
    "location",
    "participationType",
  ]);
});
```

```ts
// tests/integration/discovery.test.ts
import { searchGroups } from "@/modules/groups/discovery";

it("combines sport, location, and participation filters", async () => {
  const results = await searchGroups({
    sport: "innebandy",
    location: "Stockholm",
    participationType: "WOMEN_ONLY",
  });
  expect(results.map(({ slug }) => slug)).toEqual(["stockholm-social-innebandy"]);
});
```

- [ ] **Step 2: Run tests and verify missing discovery modules**

Run: `pnpm vitest run tests/unit/discovery-form.test.tsx tests/integration/discovery.test.ts`

Expected: FAIL because `SearchForm` and `searchGroups` do not exist.

- [ ] **Step 3: Implement discovery query and responsive results**

Define the query contract:

```ts
export const groupSearchInput = z.object({
  sport: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).max(100).optional(),
  participationType: z.enum(["WOMEN_ONLY", "MIXED", "OPEN"]).optional(),
});

export type GroupSearchQuery = z.infer<typeof groupSearchInput>;

export type PublicGroupSummary = {
  id: string;
  slug: string;
  name: string;
  sportName: string;
  country: string;
  city: string;
  area: string | null;
  participationType: "WOMEN_ONLY" | "MIXED" | "OPEN";
  memberCount: number;
};
```

Use a case-insensitive OR across `country`, `city`, and `area` for `location`; combine supplied categories with AND; order by recent activity then name; and return only public summary fields. Render the filters as three labeled controls and results as links to `/groups/[slug]`. Do not add schedule, level, age, or cost controls.

- [ ] **Step 4: Verify discovery tests and accessibility names**

Run: `pnpm vitest run tests/unit/discovery-form.test.tsx tests/integration/discovery.test.ts && pnpm typecheck`

Expected: tests pass and all form controls have programmatic labels.

- [ ] **Step 5: Commit discovery**

```bash
git add src/modules/groups/discovery.ts src/app/discover tests/integration/discovery.test.ts tests/unit/discovery-form.test.tsx
git commit -m "feat: add public group discovery"
```

---

### Task 6: Weekly Recurrence and Idempotent Session Generation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `src/modules/activities/contracts.ts`
- Create: `src/modules/activities/recurrence.ts`
- Create: `src/modules/activities/activity-service.ts`
- Create: `src/app/groups/[slug]/activities/new/actions.ts`
- Create: `src/app/groups/[slug]/activities/new/page.tsx`
- Test: `tests/unit/recurrence.test.ts`
- Test: `tests/integration/session-generation.test.ts`

**Interfaces:**
- Consumes: organizer authorization and group records from Task 4.
- Produces: `createRecurringActivity(input, actorId)`, `weeklyOccurrences(activity, from, through)`, and `generateSessions(activityId, from, through)`.

- [ ] **Step 1: Write failing recurrence and idempotency tests**

```ts
// tests/unit/recurrence.test.ts
import { weeklyOccurrences } from "@/modules/activities/recurrence";

it("generates Wednesday sessions in the configured time zone", () => {
  expect(
    weeklyOccurrences(
      { weekday: 3, localStartTime: "19:00", durationMinutes: 90, timeZone: "Europe/Stockholm" },
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-09-15T23:59:59Z"),
    ).map((date) => date.toISOString()),
  ).toEqual(["2026-09-02T17:00:00.000Z", "2026-09-09T17:00:00.000Z"]);
});
```

```ts
// tests/integration/session-generation.test.ts
it("does not duplicate a session when generation is retried", async () => {
  await generateSessions(activity.id, rangeStart, rangeEnd);
  await generateSessions(activity.id, rangeStart, rangeEnd);
  expect(await prisma.activitySession.count({ where: { activityId: activity.id } })).toBe(2);
});
```

- [ ] **Step 2: Run tests and verify missing recurrence functions**

Run: `pnpm vitest run tests/unit/recurrence.test.ts tests/integration/session-generation.test.ts`

Expected: FAIL because the activities module does not exist.

- [ ] **Step 3: Add recurrence models and services**

Run: `pnpm add date-fns date-fns-tz`

Add `RecurringActivity` fields for group, title, weekday `0..6`, local start time, duration, IANA time zone, optional capacity, attendance opening offset, response deadline offset, member-only exact venue, active flag, and timestamps. Add `ActivitySession` with `startAt`, `endAt`, `status`, and `@@unique([activityId, startAt])`.

Use this public recurrence contract:

```ts
export type WeeklyRule = {
  weekday: number;
  localStartTime: `${number}:${number}`;
  durationMinutes: number;
  timeZone: string;
};

export function weeklyOccurrences(rule: WeeklyRule, from: Date, through: Date): Date[];
export async function generateSessions(activityId: string, from: Date, through: Date): Promise<number>;
```

`weeklyOccurrences` converts local wall-clock values with `fromZonedTime`, handles daylight-saving changes per occurrence, and emits starts in `[from, through)`. `generateSessions` uses `createMany({ skipDuplicates: true })` and returns the number inserted. `createRecurringActivity` requires `ORGANIZER` or `CO_ORGANIZER` and generates the next eight weeks after storing the series.

- [ ] **Step 4: Run recurrence verification**

Run: `pnpm exec prisma migrate dev --name add_recurring_activities && pnpm exec prisma generate && pnpm vitest run tests/unit/recurrence.test.ts tests/integration/session-generation.test.ts`

Expected: DST-aware recurrence and idempotency tests pass.

- [ ] **Step 5: Commit recurring activities**

```bash
git add package.json pnpm-lock.yaml prisma src/modules/activities src/app/groups tests/unit/recurrence.test.ts tests/integration/session-generation.test.ts
git commit -m "feat: generate weekly activity sessions"
```

---

### Task 7: Attendance, Capacity, and FIFO Waiting List

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `src/modules/activities/attendance-service.ts`
- Create: `src/app/sessions/[sessionId]/attendance-actions.ts`
- Create: `src/app/sessions/[sessionId]/attendance-control.tsx`
- Test: `tests/integration/attendance-service.test.ts`
- Test: `tests/unit/attendance-control.test.tsx`

**Interfaces:**
- Consumes: `ActivitySession`, group membership, and authenticated user ID.
- Produces: `setAttendance(sessionId, userId, status): Promise<AttendanceResult>` where result includes effective status, confirmed count, capacity, and waiting-list position.

- [ ] **Step 1: Write the failing waiting-list test**

```ts
// tests/integration/attendance-service.test.ts
it("promotes the first waiting member when a confirmed member leaves", async () => {
  await setAttendance(session.id, "member-a", "GOING");
  const queued = await setAttendance(session.id, "member-b", "GOING");
  expect(queued).toMatchObject({ effectiveStatus: "WAITING", waitingListPosition: 1 });

  await setAttendance(session.id, "member-a", "NOT_GOING");

  const promoted = await prisma.attendanceResponse.findUniqueOrThrow({
    where: { sessionId_userId: { sessionId: session.id, userId: "member-b" } },
  });
  expect(promoted.status).toBe("GOING");
});
```

- [ ] **Step 2: Run the test and verify the missing attendance service**

Run: `pnpm vitest run tests/integration/attendance-service.test.ts`

Expected: FAIL because attendance models and `setAttendance` do not exist.

- [ ] **Step 3: Implement atomic attendance transitions**

Add `AttendanceStatus { GOING MAYBE NOT_GOING WAITING }`, `AttendanceResponse` with `@@unique([sessionId, userId])`, and `WaitingListEntry` with a unique member/session pair and indexed `createdAt`.

Export the attendance boundary:

```ts
export type AttendanceChoice = "GOING" | "MAYBE" | "NOT_GOING";
export type AttendanceResult = {
  effectiveStatus: AttendanceChoice | "WAITING";
  confirmedCount: number;
  capacity: number | null;
  waitingListPosition: number | null;
};
```

Inside a serializable transaction:

1. Verify the session's group membership.
2. Lock the session row with ``SELECT "id" FROM "ActivitySession" WHERE "id" = ${sessionId} FOR UPDATE`` through `prisma.$queryRaw`.
3. Upsert one attendance response.
4. When `GOING` exceeds capacity, store `WAITING` and create one waiting-list entry.
5. When a confirmed member leaves, select the oldest waiting entry ordered by `createdAt, id`, promote it, and delete its queue entry.
6. Return the canonical result after the transaction.

The client control submits one of `GOING`, `MAYBE`, or `NOT_GOING`, disables controls while pending, and restores the selected value with an inline retry message when the action fails.

- [ ] **Step 4: Verify transitions and retry idempotency**

Add assertions for duplicate submissions, Maybe-to-Going, and non-member rejection. Run:

`pnpm exec prisma migrate dev --name add_attendance && pnpm exec prisma generate && pnpm vitest run tests/integration/attendance-service.test.ts tests/unit/attendance-control.test.tsx`

Expected: all attendance and component tests pass.

- [ ] **Step 5: Commit attendance**

```bash
git add prisma src/modules/activities/attendance-service.ts src/app/sessions tests/integration/attendance-service.test.ts tests/unit/attendance-control.test.tsx
git commit -m "feat: add attendance and waiting lists"
```

---

### Task 8: Group Home and Session Discussion

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`
- Create: `src/modules/groups/group-home.ts`
- Create: `src/modules/conversations/message-service.ts`
- Create: `src/app/groups/[slug]/member-page.tsx`
- Create: `src/app/sessions/[sessionId]/message-form.tsx`
- Create: `src/app/sessions/[sessionId]/page.tsx`
- Test: `tests/integration/group-home.test.ts`
- Test: `tests/integration/session-messages.test.ts`

**Interfaces:**
- Consumes: memberships, generated sessions, attendance, and `requireUser()`.
- Produces: `getGroupHome(slug, userId)`, `listSessionMessages(sessionId, userId)`, and `postSessionMessage({ sessionId, userId, body, clientRequestId })`.

- [ ] **Step 1: Write failing privacy and message-idempotency tests**

```ts
// tests/integration/session-messages.test.ts
it("stores one member message for a retried client request", async () => {
  const command = {
    sessionId: session.id,
    userId: member.id,
    body: "I can bring spare sticks.",
    clientRequestId: "request-123",
  };
  await postSessionMessage(command);
  await postSessionMessage(command);
  expect(await prisma.message.count({ where: { sessionId: session.id } })).toBe(1);
});

it("rejects a visitor reading a member session thread", async () => {
  await expect(listSessionMessages(session.id, visitor.id)).rejects.toThrow("GROUP_MEMBERSHIP_REQUIRED");
});
```

- [ ] **Step 2: Run tests and verify missing conversation functions**

Run: `pnpm vitest run tests/integration/group-home.test.ts tests/integration/session-messages.test.ts`

Expected: FAIL because the group-home query and message module do not exist.

- [ ] **Step 3: Add the member home and session thread**

Add `Message` with `sessionId`, `authorId`, trimmed body of 1–2,000 characters, `clientRequestId`, timestamps, and `@@unique([authorId, clientRequestId])`. Export this command type:

```ts
export type PostSessionMessageInput = {
  sessionId: string;
  userId: string;
  body: string;
  clientRequestId: string;
};
```

`postSessionMessage(input: PostSessionMessageInput)` returns the stored `Message`. Do not add general chat, topic channels, direct messages, reactions, editing, or attachments in this phase.

`getGroupHome` verifies membership and returns the next session, the caller's response, confirmed count, capacity, and five most recent session messages. The public group route renders `member-page.tsx` only for members. The session page shows the full member-only venue, attendance control, participant summary, and chronological discussion.

Preserve a failed message in the form and offer a retry using the same `clientRequestId` so a lost response cannot duplicate the post.

- [ ] **Step 4: Verify member-only data and discussion behavior**

Run: `pnpm exec prisma migrate dev --name add_session_messages && pnpm exec prisma generate && pnpm vitest run tests/integration/group-home.test.ts tests/integration/session-messages.test.ts && pnpm typecheck`

Expected: member queries pass, visitors are rejected, and retries create one message.

- [ ] **Step 5: Commit group home and discussion**

```bash
git add prisma src/modules/groups/group-home.ts src/modules/conversations src/app/groups src/app/sessions tests/integration
git commit -m "feat: add group home and session discussion"
```

---

### Task 9: Installable Mobile Shell and Full Journey Verification

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`
- Create: `src/app/manifest.ts`
- Create: `src/components/app-navigation.tsx`
- Create: `public/icon.svg`
- Create: `playwright.config.ts`
- Create: `tests/e2e/core-coordination.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `.github/workflows/quality.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: all Phase 1 browser routes and actions.
- Produces: installable metadata, mobile navigation, `pnpm e2e`, and the Phase 1 quality gate.

- [ ] **Step 1: Write the failing end-to-end journey**

```ts
// tests/e2e/core-coordination.spec.ts
import { test, expect } from "@playwright/test";

test("member discovers, joins, and signs up for weekly innebandy", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Stella Member");
  await page.getByLabel("Email").fill("stella.member@example.test");
  await page.getByLabel("Password").fill("secure-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.goto("/discover?sport=innebandy&location=Stockholm&participationType=WOMEN_ONLY");
  await page.getByRole("link", { name: "Stockholm Social Innebandy" }).click();
  await page.getByRole("button", { name: "Join group" }).click();
  await expect(page.getByRole("heading", { name: "Next activity" })).toBeVisible();
  await page.getByRole("radio", { name: "Going" }).check();
  await expect(page.getByText("You are going")).toBeVisible();
  await page.getByLabel("Message").fill("Looking forward to training!");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Looking forward to training!")).toBeVisible();
});
```

- [ ] **Step 2: Run the journey at mobile width and record the first failure**

Run: `pnpm exec playwright test tests/e2e/core-coordination.spec.ts --project=mobile-chrome`

Expected: FAIL until Playwright, seed setup, mobile project, and the complete route flow are configured.

- [ ] **Step 3: Add PWA metadata, navigation, Playwright, and deterministic seed setup**

Run: `pnpm add -D @playwright/test @axe-core/playwright && pnpm exec playwright install chromium`

Add scripts:

```json
{
  "scripts": {
    "e2e": "playwright test",
    "quality": "pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e"
  }
}
```

Return this manifest from `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Group Sport",
    short_name: "Group Sport",
    description: "Discover sports groups and coordinate weekly activities.",
    start_url: "/discover",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
```

Use this install icon:

```svg
<!-- public/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Group Sport">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <circle cx="176" cy="208" r="56" fill="#f8fafc"/>
  <circle cx="336" cy="208" r="56" fill="#f8fafc"/>
  <path d="M104 384c8-72 56-112 120-112s112 40 120 112" fill="none" stroke="#f8fafc" stroke-width="36" stroke-linecap="round"/>
</svg>
```

Render the shared mobile navigation from the root layout:

```tsx
// src/components/app-navigation.tsx
import Link from "next/link";

const destinations = [
  ["Discover", "/discover"],
  ["My Groups", "/groups"],
  ["Schedule", "/schedule"],
] as const;

export function AppNavigation() {
  return (
    <nav aria-label="Primary" className="sticky bottom-0 grid grid-cols-3 border-t bg-white p-2">
      {destinations.map(([label, href]) => (
        <Link className="rounded-lg p-3 text-center text-sm" href={href} key={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

Configure Playwright with desktop Chromium and a `mobile-chrome` project using a 390×844 viewport. Its web server runs `pnpm dev`; global setup resets the test database, seeds sports, creates the public innebandy group with its organizer, creates its weekly activity, and generates the next session.

Add `tests/e2e/accessibility.spec.ts` to run `new AxeBuilder({ page }).analyze()` on `/`, `/discover`, the public group page, and the joined group home, asserting `violations` is empty.

Create the CI gate:

```yaml
# .github/workflows/quality.yml
name: quality
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: group_sport_test
          POSTGRES_USER: group_sport
          POSTGRES_PASSWORD: group_sport
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U group_sport"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      DATABASE_URL: postgresql://group_sport:group_sport@localhost:5432/group_sport_test
      BETTER_AUTH_URL: http://localhost:3000
      BETTER_AUTH_SECRET: ci-only-secret-with-at-least-32-characters
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec prisma migrate deploy
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm quality
```

Document these exact local commands in `README.md`: `cp .env.example .env`, `docker compose up -d db`, `pnpm install`, `pnpm exec prisma migrate deploy`, `pnpm exec prisma db seed`, `pnpm dev`, and `pnpm quality`.

- [ ] **Step 4: Run the complete Phase 1 quality gate**

Run: `pnpm quality`

Expected: lint, strict type checking, all unit and integration tests, production build, the mobile journey, and accessibility tests pass.

- [ ] **Step 5: Commit the verified vertical slice**

```bash
git add package.json pnpm-lock.yaml src/app src/components public playwright.config.ts tests/e2e .github/workflows/quality.yml README.md
git commit -m "feat: complete core coordination vertical slice"
```

## Phase 1 Acceptance Checklist

- [ ] A new visitor can create an account and maintain a browser session.
- [ ] Discovery exposes exactly the three approved filter categories.
- [ ] A public group is readable without exposing exact venue or member discussion.
- [ ] An authenticated user can join an open group once, including after a retry.
- [ ] An organizer can define a weekly activity and generate sessions without duplicates.
- [ ] A member can choose Going, Maybe, or Not going.
- [ ] Capacity and FIFO waiting-list promotion are transactionally correct.
- [ ] Only members can read or write the session discussion.
- [ ] Retried message submissions create one message.
- [ ] The mobile browser journey and automated accessibility checks pass.
- [ ] Public launch remains disabled pending the Phase 5 safety gate.

## References Used for Stack Validation

- Next.js 16 App Router installation and Node requirements: `https://nextjs.org/docs/app/getting-started/installation`
- Next.js Progressive Web App guidance: `https://nextjs.org/docs/app/guides/progressive-web-apps`
- Better Auth Next.js integration: `https://better-auth.com/docs/integrations/next`
- Better Auth Prisma adapter: `https://better-auth.com/docs/adapters/prisma`
- Prisma 7 runtime requirements: `https://www.prisma.io/docs/orm/v6/more/upgrades/to-v7`
- Playwright documentation: `https://playwright.dev/docs/intro`
