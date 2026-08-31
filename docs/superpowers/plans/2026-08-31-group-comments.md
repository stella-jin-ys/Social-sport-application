# Group Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a member-only discussion thread to each Sportship group page.

**Architecture:** Store comments in a Prisma `GroupComment` model, load them with group-page data, and post through a typed Next.js server action that verifies active membership. Render a focused client component below the existing training section, with read access for everyone and write access for members.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma PostgreSQL, Better Auth, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-31-group-comments-design.md`

## Global Constraints

- Only authenticated active members can post comments.
- Visitors and non-members can read the discussion.
- New comments are trimmed, non-empty, and limited to 500 characters.
- Comments display newest first with author name and timestamp.
- Preserve the existing mobile-first group-page visual language.

---

### Task 1: Add comment data contracts and Prisma model

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/modules/groups/contracts.ts`
- Test: `tests/unit/group-detail-page.test.tsx`

**Interfaces:**
- Produces `GroupCommentView`, `CommentActionResult`, and `GroupPageData.comments` for later tasks.

- [ ] **Step 1: Add the failing rendering assertion**

Extend the injected `group` fixture with:

```tsx
comments: [{
  id: "comment-1",
  body: "Should we warm up before Tuesday?",
  authorName: "Jin Demo",
  createdAt: "2026-08-30T10:00:00.000Z",
}],
```

Then assert:

```tsx
expect(screen.getByRole("heading", { name: /discussion/i })).toBeInTheDocument();
expect(screen.getByText("Should we warm up before Tuesday?")).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/group-detail-page.test.tsx --reporter=dot`

Expected: FAIL because `GroupPageData` does not yet accept comments and `GroupDetail` has no discussion section.

- [ ] **Step 3: Add the Prisma model and TypeScript contracts**

Add to `prisma/schema.prisma`:

```prisma
model GroupComment {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([groupId, createdAt])
}
```

Add `comments: GroupCommentView[]` to `GroupPageData`, plus:

```ts
export type GroupCommentView = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type CommentActionResult =
  | { ok: true; comment: GroupCommentView }
  | { ok: false; code: "AUTH_REQUIRED" | "NOT_MEMBER" | "GROUP_NOT_FOUND" | "INVALID_BODY" | "UNKNOWN"; message: string };
```

Add `comments: GroupComment[]` relations to `User` and `Group`.

- [ ] **Step 4: Push the schema and rerun the test**

Run: `pnpm exec prisma db push`

Then run: `pnpm exec vitest run tests/unit/group-detail-page.test.tsx --reporter=dot`

Expected: the test still fails only because query/UI behavior is not implemented yet.

- [ ] **Step 5: Commit the model/contracts slice**

```bash
git add prisma/schema.prisma src/modules/groups/contracts.ts tests/unit/group-detail-page.test.tsx
git commit -m "Add group comment contracts"
```

### Task 2: Load comments and enforce member-only posting

**Files:**
- Modify: `src/modules/groups/group-queries.ts`
- Modify: `src/app/groups/[slug]/actions.ts`
- Modify: `src/modules/groups/membership-service.ts`
- Test: `tests/integration/group-queries.test.ts`
- Test: `tests/unit/group-actions-server.test.ts`

**Interfaces:**
- Consumes `GroupCommentView` and `CommentActionResult` from Task 1.
- Produces `listGroupComments(groupId: string)` behavior through `getGroupPageData`, and `createGroupCommentAction(groupSlug: string, body: string): Promise<CommentActionResult>`.

- [ ] **Step 1: Write failing query and authorization tests**

Add integration coverage that creates two users, makes only one an active member, creates two comments, and asserts newest-first author/body output. Add server-action tests asserting:

```ts
expect(await createGroupCommentAction("soder-sparks", "  hello team  ")).toMatchObject({ ok: true });
expect(await createGroupCommentAction("soder-sparks", "   ")).toMatchObject({ ok: false, code: "INVALID_BODY" });
```

Also assert a non-member receives `NOT_MEMBER` and no comment is created.

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `pnpm exec vitest run tests/integration/group-queries.test.ts tests/unit/group-actions-server.test.ts --reporter=dot`

Expected: FAIL because the comment query/action does not exist.

- [ ] **Step 3: Load comments in the group-page query**

In `getGroupPageData`, include:

```ts
comments: {
  include: { user: { select: { name: true } } },
  orderBy: { createdAt: "desc" },
  take: 50,
},
```

Map each row to `{ id, body, authorName: user.name, createdAt: createdAt.toISOString() }` and expose it as `comments` in both authenticated and signed-out branches.

- [ ] **Step 4: Implement the server action**

Validate the slug with the existing `groupSlugInput`. Validate the body with `z.string().trim().min(1).max(500)`. Resolve `getCurrentUser()`, look up an active membership for the group, create the comment, revalidate `/groups/${slug}`, and return the mapped comment. Return typed errors for invalid input, missing group, unauthenticated users, and non-members.

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `pnpm exec vitest run tests/integration/group-queries.test.ts tests/unit/group-actions-server.test.ts --reporter=dot`

Expected: PASS for the new comment assertions. If the existing integration reset hook fails before tests execute, record that existing environment blocker without weakening the application code.

- [ ] **Step 6: Commit the data/action slice**

```bash
git add src/modules/groups/group-queries.ts src/app/groups/[slug]/actions.ts src/modules/groups/membership-service.ts tests/integration/group-queries.test.ts tests/unit/group-actions-server.test.ts
git commit -m "Add member-only group comments action"
```

### Task 3: Build the discussion UI and connect it to the group page

**Files:**
- Create: `src/app/groups/[slug]/group-comments.tsx`
- Modify: `src/app/groups/[slug]/group-detail.tsx`
- Test: `tests/unit/group-comments.test.tsx`
- Modify: `tests/unit/group-detail-page.test.tsx`

**Interfaces:**
- Consumes `GroupCommentView`, `CommentActionResult`, `groupSlug`, `isAuthenticated`, and `isMember`.
- Produces a discussion section with a member form, signed-out prompt, non-member read-only state, empty state, pending state, and retryable error state.

- [ ] **Step 1: Write failing component tests**

Test these cases:

```tsx
render(<GroupComments groupSlug="soder-sparks" comments={comments} isAuthenticated isMember />);
expect(screen.getByRole("heading", { name: /discussion/i })).toBeInTheDocument();
expect(screen.getByRole("textbox", { name: /join the conversation/i })).toBeInTheDocument();
```

Also test signed-out visitors see `Sign in to join the conversation`, non-members see `Join the group to comment`, and a successful mocked action clears the textbox and calls `router.refresh()`.

- [ ] **Step 2: Run the component tests to verify failure**

Run: `pnpm exec vitest run tests/unit/group-comments.test.tsx --reporter=dot`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the client component**

Use `useState` for body, pending, and error. Render the newest-first comments with `Intl.DateTimeFormat` in `Europe/Stockholm`. Disable the submit button while posting, show a character counter, and preserve the entered text on failure. Call `createGroupCommentAction`, clear on success, then `router.refresh()`.

- [ ] **Step 4: Add the component below training**

Pass `group.comments`, `group.slug`, and viewer membership/authentication flags from `GroupDetail` into `<GroupComments />` below the attendance `GroupActions` block.

- [ ] **Step 5: Run focused UI tests**

Run: `pnpm exec vitest run tests/unit/group-comments.test.tsx tests/unit/group-detail-page.test.tsx --reporter=dot`

Expected: PASS.

- [ ] **Step 6: Commit the UI slice**

```bash
git add src/app/groups/[slug]/group-comments.tsx src/app/groups/[slug]/group-detail.tsx tests/unit/group-comments.test.tsx tests/unit/group-detail-page.test.tsx
git commit -m "Add group discussion UI"
```

### Task 4: Verify, migrate hosted data, and deploy

**Files:**
- No source files expected unless verification reveals a directly related defect.

- [ ] **Step 1: Run complete local verification**

Run: `pnpm exec vitest run tests/unit --reporter=dot`

Run: `pnpm exec tsc --noEmit`

Run: `git diff --check`

- [ ] **Step 2: Apply the schema to the hosted database**

Run `pnpm exec prisma db push` with the production `DATABASE_URL`, then seed only if the hosted catalog is empty. Do not expose the connection string in output or commit it.

- [ ] **Step 3: Deploy the production project**

Run: `vercel --prod --yes`

- [ ] **Step 4: Verify the live flow**

Open `https://social-sport-app-sportship.vercel.app/groups/soder-sparks`, sign in with a test account, join the group, post a comment, refresh, and confirm the comment remains visible with its author and timestamp.

- [ ] **Step 5: Commit any final directly related fix and report status**

Use `git status --short` and report the live URL, verification results, and any hosted-database limitations.
