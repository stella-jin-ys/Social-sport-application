import { beforeEach, expect, it } from "vitest";
import { createTestUser, prisma, resetDomainData } from "./database";
import { joinOpenGroup } from "@/modules/groups/membership-service";
import { seedGroups } from "@/modules/groups/seed-groups";

beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
  await createTestUser("member-a");
});

async function waitForConcurrentMembershipCalls() {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    const [{ waiting }] = await prisma.$queryRaw<{ waiting: number }[]>`
      SELECT COUNT(*)::int AS "waiting"
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND wait_event_type = 'Lock'
        AND query LIKE '%GroupMembership%'
    `;

    if (waiting >= 2) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("Concurrent membership calls did not overlap");
}

async function runConcurrentJoins() {
  let markLockAcquired!: () => void;
  let releaseLock!: () => void;
  const lockAcquired = new Promise<void>((resolve) => {
    markLockAcquired = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const lockTransaction = prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('LOCK TABLE "GroupMembership" IN ACCESS EXCLUSIVE MODE');
    markLockAcquired();
    await release;
  });

  await lockAcquired;
  const calls = Promise.all([
    joinOpenGroup("member-a", "soder-sparks"),
    joinOpenGroup("member-a", "soder-sparks"),
  ]);
  let overlapError: unknown;

  try {
    await waitForConcurrentMembershipCalls();
  } catch (error) {
    overlapError = error;
  } finally {
    releaseLock();
    await lockTransaction;
  }

  const results = await calls;
  if (overlapError) throw overlapError;
  return results;
}

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

it("creates exactly one membership and count increment for concurrent initial joins", async () => {
  const results = await runConcurrentJoins();

  expect(results.filter((result) => result.joined)).toHaveLength(1);
  expect(await prisma.groupMembership.count({ where: { userId: "member-a" } })).toBe(1);
  expect(await prisma.group.findUniqueOrThrow({ where: { slug: "soder-sparks" } }))
    .toMatchObject({ memberCount: 43 });
});

it("reactivates exactly once and increments the count once for concurrent joins", async () => {
  await joinOpenGroup("member-a", "soder-sparks");
  await prisma.groupMembership.updateMany({
    where: { userId: "member-a" },
    data: { status: "INACTIVE" },
  });
  await prisma.group.update({
    where: { slug: "soder-sparks" },
    data: { memberCount: { decrement: 1 } },
  });

  const results = await runConcurrentJoins();

  expect(results.filter((result) => result.joined)).toHaveLength(1);
  expect(await prisma.groupMembership.count({ where: { userId: "member-a" } })).toBe(1);
  expect(await prisma.group.findUniqueOrThrow({ where: { slug: "soder-sparks" } }))
    .toMatchObject({ memberCount: 43 });
});
