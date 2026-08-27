import { prisma } from "@/lib/db";

export { prisma };

export async function resetDomainData() {
  await prisma.$transaction([
    prisma.attendanceResponse.deleteMany(),
    prisma.groupMembership.deleteMany(),
    prisma.activitySession.deleteMany(),
    prisma.group.deleteMany(),
  ]);
}

export async function createTestUser(id: string) {
  return prisma.user.upsert({
    where: { email: `${id}@example.test` },
    update: {},
    create: { id, email: `${id}@example.test`, name: id },
  });
}
