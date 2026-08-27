import { prisma } from "../src/lib/db";
import { seedGroups } from "../src/modules/groups/seed-groups";

seedGroups()
  .finally(async () => {
    await prisma.$disconnect();
  });
