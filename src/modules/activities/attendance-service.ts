import { prisma } from "@/lib/db";
import type { AttendanceChoice, AttendanceResult } from "@/modules/groups/contracts";

export class AttendanceError extends Error {
  constructor(
    public readonly code: "SESSION_NOT_FOUND" | "NOT_MEMBER",
    message: string,
  ) {
    super(message);
  }
}

export async function setAttendance(
  userId: string,
  sessionId: string,
  status: AttendanceChoice,
): Promise<AttendanceResult> {
  return prisma.$transaction(async (tx) => {
    const lockedSession = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "ActivitySession"
      WHERE "id" = ${sessionId}
      FOR UPDATE
    `;

    if (!lockedSession[0]) {
      throw new AttendanceError("SESSION_NOT_FOUND", "Training session not found.");
    }

    const session = await tx.activitySession.findUniqueOrThrow({ where: { id: sessionId } });

    const membership = await tx.groupMembership.findFirst({
      where: { groupId: session.groupId, userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!membership) {
      throw new AttendanceError("NOT_MEMBER", "Join the group before responding.");
    }

    const previous = await tx.attendanceResponse.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      select: { status: true },
    });
    const delta =
      previous?.status === status ? 0 :
      previous?.status === "GOING" ? -1 :
      status === "GOING" ? 1 : 0;

    await tx.attendanceResponse.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId, status },
      update: { status },
    });

    const updatedSession = delta === 0
      ? session
      : await tx.activitySession.update({
          where: { id: sessionId },
          data: { goingCount: { increment: delta } },
        });

    return { status, goingCount: updatedSession.goingCount };
  });
}
