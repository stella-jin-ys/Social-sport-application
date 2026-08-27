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

it("counts concurrent duplicate going responses once", async () => {
  await joinOpenGroup("member-a", "soder-sparks");
  await setAttendance("member-a", "session-soder-sparks-next", "NOT_GOING");

  let markLockAcquired!: () => void;
  let releaseLock!: () => void;
  const lockAcquired = new Promise<void>((resolve) => {
    markLockAcquired = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const lockTransaction = prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "AttendanceResponse"
      WHERE "sessionId" = ${"session-soder-sparks-next"}
        AND "userId" = ${"member-a"}
      FOR UPDATE
    `;
    markLockAcquired();
    await release;
  });

  await lockAcquired;
  const updates = Promise.all([
    setAttendance("member-a", "session-soder-sparks-next", "GOING"),
    setAttendance("member-a", "session-soder-sparks-next", "GOING"),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  releaseLock();

  await lockTransaction;
  await updates;

  const session = await prisma.activitySession.findUniqueOrThrow({
    where: { id: "session-soder-sparks-next" },
    select: { goingCount: true },
  });

  expect(session.goingCount).toBe(13);
  expect(await prisma.attendanceResponse.count()).toBe(1);
});
