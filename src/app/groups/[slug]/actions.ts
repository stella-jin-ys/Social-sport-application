"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import type { AttendanceActionResult, AttendanceChoice, JoinGroupActionResult } from "@/modules/groups/contracts";
import { AttendanceError, setAttendance } from "@/modules/activities/attendance-service";
import { JoinGroupError, joinOpenGroup } from "@/modules/groups/membership-service";

const groupSlugInput = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const attendanceInput = z.object({
  sessionId: z.string().min(1).max(120),
  status: z.enum(["GOING", "NOT_GOING"]),
});

export async function joinGroupAction(groupSlug: string): Promise<JoinGroupActionResult> {
  const parsedSlug = groupSlugInput.safeParse(groupSlug);

  if (!parsedSlug.success) {
    return { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in to join this group.",
    };
  }

  try {
    const result = await joinOpenGroup(user.id, parsedSlug.data);

    revalidatePath(`/groups/${parsedSlug.data}`);

    return { ok: true, memberCount: result.memberCount };
  } catch (error) {
    if (error instanceof JoinGroupError) {
      return { ok: false, code: error.code, message: error.message };
    }

    console.error("Failed to join group", error);

    return {
      ok: false,
      code: "UNKNOWN",
      message: "We could not join this group. Please try again.",
    };
  }
}

export async function setAttendanceAction(
  sessionId: string,
  status: AttendanceChoice,
): Promise<AttendanceActionResult> {
  const parsedInput = attendanceInput.safeParse({ sessionId, status });

  if (!parsedInput.success) {
    return { ok: false, code: "SESSION_NOT_FOUND", message: "Training session not found." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, code: "AUTH_REQUIRED", message: "Please sign in to respond." };
  }

  try {
    const result = await setAttendance(user.id, parsedInput.data.sessionId, parsedInput.data.status);
    const session = await prisma.activitySession.findUnique({
      where: { id: parsedInput.data.sessionId },
      select: { group: { select: { slug: true } } },
    });

    if (session) {
      revalidatePath(`/groups/${session.group.slug}`);
    }

    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof AttendanceError) {
      return { ok: false, code: error.code, message: error.message };
    }

    console.error("Failed to set attendance", error);

    return {
      ok: false,
      code: "UNKNOWN",
      message: "We could not save your response. Please try again.",
    };
  }
}
