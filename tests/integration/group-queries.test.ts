import { beforeEach, expect, it } from "vitest";
import { createTestUser, prisma, resetDomainData } from "./database";
import { setAttendance } from "@/modules/activities/attendance-service";
import { listPublicGroups, getGroupPageData, listJoinedGroups, listUpcomingActivities, listRecommendedGroups } from "@/modules/groups/group-queries";
import { joinOpenGroup } from "@/modules/groups/membership-service";
import { seedGroups } from "@/modules/groups/seed-groups";

beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

it("returns database-backed public cards in recommendation order", async () => {
  const groups = await listPublicGroups();

  expect(groups).toHaveLength(6);
  expect(groups[0]).toMatchObject({
    slug: "soder-sparks",
    audience: "Women only",
    schedule: "Every Tuesday evening",
  });
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

it("returns member and attendance state for an authenticated viewer", async () => {
  await createTestUser("member-a");
  await joinOpenGroup("member-a", "soder-sparks");
  await setAttendance("member-a", "session-soder-sparks-next", "GOING");

  const group = await getGroupPageData("soder-sparks", "member-a");

  expect(group?.viewer).toEqual({
    isAuthenticated: true,
    isMember: true,
    attendanceStatus: "GOING",
  });
  expect(group?.nextTraining?.goingCount).toBe(13);
});

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
