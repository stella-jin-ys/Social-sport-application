"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import type { JoinGroupActionResult } from "@/modules/groups/contracts";
import { JoinGroupError, joinOpenGroup } from "@/modules/groups/membership-service";

const groupSlugInput = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);

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
