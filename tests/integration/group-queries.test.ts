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
