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
