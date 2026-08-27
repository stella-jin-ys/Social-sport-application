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
