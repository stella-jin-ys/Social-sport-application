# Recurring Training and Organizer Edits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic next-week training generation and organizer-only editing for group sport and the next event.

**Architecture:** Store the recurring cadence on `Group`, keep concrete attendance targets in `ActivitySession`, and lazily materialize exactly one next recurring session during group reads. A typed server action authorizes active organizers and updates only the next session plus the group sport/cadence fields.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma PostgreSQL, Better Auth, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-31-recurring-training-organizer-edits-design.md`

## Global Constraints

- Recurring schedule edits change only the next upcoming training.
- Only the creator or an active organizer can edit.
- Members and visitors remain read-only.
- Automatic session creation must be idempotent.
- Keep the existing mobile-first group-page flow.

---

### Task 1: Add recurrence and edit contracts

**Files:** `prisma/schema.prisma`, `src/modules/groups/contracts.ts`, `tests/unit/group-detail-page.test.tsx`

- [ ] Add failing fixture assertions for `canEdit`, structured recurrence data, and an edit control.
- [ ] Run `pnpm exec vitest run tests/unit/group-detail-page.test.tsx --reporter=dot` and confirm failure.
- [ ] Add nullable `recurrenceWeekday`, `recurrenceStartTime`, `recurrenceEndTime`, and `recurrenceVenue` fields to `Group`; add `canEdit` and recurrence data to `GroupPageData`.
- [ ] Add `GroupEditActionResult` with typed validation/authorization errors.
- [ ] Run `pnpm exec prisma db push && pnpm exec prisma generate`.
- [ ] Commit: `git commit -m "Add recurring training contracts"`.

### Task 2: Generate next-week sessions and implement organizer updates

**Files:** `src/modules/groups/group-queries.ts`, `src/modules/groups/group-management.ts`, `src/app/groups/[slug]/actions.ts`, `tests/integration/group-queries.test.ts`, `tests/unit/group-actions-server.test.ts`

- [ ] Add failing tests for a recurring group returning a future session, repeated reads not duplicating it, non-organizer rejection, and organizer updating only the next session.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement a date helper that calculates the next occurrence for a stored weekday/time in Europe/Stockholm and an idempotent transaction that creates the concrete `ActivitySession` if no future session exists.
- [ ] Include recurring fields and `canEdit` in `getGroupPageData`.
- [ ] Implement `updateGroupDetailsAction(groupSlug, input)` with Zod validation, active organizer authorization, group sport update, recurrence update, and next-session update.
- [ ] Revalidate the group and home paths after success.
- [ ] Run focused unit tests, type-checking, and integration tests; record the existing Prisma reset-hook failure if it still prevents integration setup.
- [ ] Commit: `git commit -m "Add recurring training and organizer updates"`.

### Task 3: Build the organizer editor

**Files:** `src/app/groups/[slug]/group-editor.tsx`, `src/app/groups/[slug]/group-detail.tsx`, `tests/unit/group-editor.test.tsx`, `tests/unit/group-detail-page.test.tsx`

- [ ] Add failing tests for hidden editor controls, organizer rendering, submitting next-session changes, and preserving form values after an error.
- [ ] Run `pnpm exec vitest run tests/unit/group-editor.test.tsx --reporter=dot` and confirm failure.
- [ ] Implement a mobile-friendly organizer editor with sport, event title, date, start/end time, venue, and recurrence fields; use a collapsible/details surface rather than a modal.
- [ ] Render it only when `group.viewer.canEdit` is true and refresh on success.
- [ ] Run focused UI tests and the full unit suite.
- [ ] Commit: `git commit -m "Add organizer group editor"`.

### Task 4: Verify locally and show the demo

**Files:** no source files expected unless a directly related verification defect appears.

- [ ] Run `pnpm exec vitest run tests/unit --reporter=dot`, `pnpm exec tsc --noEmit`, and `git diff --check`.
- [ ] Apply the schema to the local database and seed it.
- [ ] Open `http://127.0.0.1:3000/groups/soder-sparks` and verify the next training date/time is shown.
- [ ] Sign in as the organizer, edit the sport/event fields, refresh, and verify only the next session changed.
- [ ] Leave deployment untouched until the user explicitly asks to deploy after reviewing the local demo.
