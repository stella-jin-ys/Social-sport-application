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
