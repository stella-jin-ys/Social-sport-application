import { prisma } from "@/lib/db";
import type { JoinResult } from "./contracts";

export class JoinGroupError extends Error {
  constructor(
    public readonly code: "GROUP_NOT_FOUND" | "GROUP_NOT_OPEN",
    message: string,
  ) {
    super(message);
  }
}

export async function joinOpenGroup(userId: string, groupSlug: string): Promise<JoinResult> {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({ where: { slug: groupSlug } });

    if (!group) {
      throw new JoinGroupError("GROUP_NOT_FOUND", "Group not found.");
    }

    if (group.membershipMode !== "PUBLIC_OPEN") {
      throw new JoinGroupError("GROUP_NOT_OPEN", "This group is not open to new members.");
    }

    const reactivated = await tx.groupMembership.updateMany({
      where: { groupId: group.id, userId, status: "INACTIVE" },
      data: { status: "ACTIVE", joinedAt: new Date() },
    });

    const inserted = reactivated.count === 0
      ? await tx.groupMembership.createMany({
          data: [{ groupId: group.id, userId, role: "MEMBER", status: "ACTIVE" }],
          skipDuplicates: true,
        })
      : { count: 0 };

    const joined = reactivated.count + inserted.count === 1;
    const membership = await tx.groupMembership.findUniqueOrThrow({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    const countedGroup = joined
      ? await tx.group.update({
          where: { id: group.id },
          data: { memberCount: { increment: 1 } },
        })
      : await tx.group.findUniqueOrThrow({ where: { id: group.id } });

    return {
      membershipId: membership.id,
      joined,
      memberCount: countedGroup.memberCount,
    };
  });
}
