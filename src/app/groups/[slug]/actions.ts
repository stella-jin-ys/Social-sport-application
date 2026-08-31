"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import type { AttendanceActionResult, AttendanceChoice, CommentActionResult, GroupUpdateActionResult, GroupUpdateInput, JoinGroupActionResult } from "@/modules/groups/contracts";
import { sportOptions } from "@/lib/group-creation-options";
import { AttendanceError, setAttendance } from "@/modules/activities/attendance-service";
import { JoinGroupError, joinOpenGroup } from "@/modules/groups/membership-service";

const groupSlugInput = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const attendanceInput = z.object({
  sessionId: z.string().min(1).max(120),
  status: z.enum(["GOING", "NOT_GOING"]),
});
const commentBodyInput = z.string().trim().min(1).max(500);
const groupUpdateInput = z.object({
  sport: z.string().refine((value) => sportOptions.includes(value as (typeof sportOptions)[number])),
  title: z.string().trim().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  venue: z.string().trim().min(2).max(120),
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

export async function createGroupCommentAction(groupSlug: string, body: string): Promise<CommentActionResult> {
  const parsedSlug = groupSlugInput.safeParse(groupSlug);
  const parsedBody = commentBodyInput.safeParse(body);

  if (!parsedSlug.success) {
    return { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found." };
  }

  if (!parsedBody.success) {
    return { ok: false, code: "INVALID_BODY", message: "Write a comment before posting." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, code: "AUTH_REQUIRED", message: "Please sign in to join the conversation." };
  }

  try {
    const group = await prisma.group.findUnique({ where: { slug: parsedSlug.data }, select: { id: true } });

    if (!group) {
      return { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found." };
    }

    const membership = await prisma.groupMembership.findFirst({
      where: { groupId: group.id, userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });

    if (!membership) {
      return { ok: false, code: "NOT_MEMBER", message: "Join the group to comment." };
    }

    const comment = await prisma.groupComment.create({
      data: { groupId: group.id, userId: user.id, body: parsedBody.data },
      include: { user: { select: { name: true } } },
    });

    revalidatePath(`/groups/${parsedSlug.data}`);

    return {
      ok: true,
      comment: {
        id: comment.id,
        body: comment.body,
        authorName: comment.user.name,
        createdAt: comment.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to create group comment", error);
    return { ok: false, code: "UNKNOWN", message: "We could not post your comment. Please try again." };
  }
}

export async function updateGroupDetailsAction(groupSlug: string, input: GroupUpdateInput): Promise<GroupUpdateActionResult> {
  const parsedSlug = groupSlugInput.safeParse(groupSlug);
  const parsedInput = groupUpdateInput.safeParse(input);
  if (!parsedSlug.success) return { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found." };
  if (!parsedInput.success) return { ok: false, code: "INVALID_INPUT", message: "Check the sport and next training details." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH_REQUIRED", message: "Please sign in as an organizer to edit this group." };

  try {
    const group = await prisma.group.findUnique({
      where: { slug: parsedSlug.data },
      include: { memberships: { where: { userId: user.id, status: "ACTIVE", role: "ORGANIZER" }, select: { id: true } }, sessions: { where: { canceled: false, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 1 } },
    });
    if (!group) return { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found." };
    if (!group.memberships.length) return { ok: false, code: "NOT_ORGANIZER", message: "Only the creator or an organizer can edit this group." };

    const [startHour, startMinute] = parsedInput.data.startTime.split(":").map(Number);
    const [endHour, endMinute] = parsedInput.data.endTime.split(":").map(Number);
    const startsAt = new Date(`${parsedInput.data.date}T${parsedInput.data.startTime}:00+02:00`);
    const endsAt = new Date(`${parsedInput.data.date}T${parsedInput.data.endTime}:00+02:00`);
    if (!Number.isFinite(startHour) || !Number.isFinite(startMinute) || !Number.isFinite(endHour) || !Number.isFinite(endMinute) || endsAt <= startsAt) {
      return { ok: false, code: "INVALID_INPUT", message: "The end time must be after the start time." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.group.update({ where: { id: group.id }, data: { sport: parsedInput.data.sport, sportSlug: parsedInput.data.sport.toLowerCase() } });
      const next = group.sessions[0];
      if (next) await tx.activitySession.update({ where: { id: next.id }, data: { title: parsedInput.data.title, startsAt, endsAt, venue: parsedInput.data.venue } });
    });
    revalidatePath(`/groups/${parsedSlug.data}`);
    revalidatePath("/");
    revalidatePath("/discover");
    return { ok: true };
  } catch (error) {
    console.error("Failed to update group details", error);
    return { ok: false, code: "UNKNOWN", message: "We could not update this group. Please try again." };
  }
}
