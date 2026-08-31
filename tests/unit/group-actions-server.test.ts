import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/modules/groups/membership-service", () => ({
  joinOpenGroup: vi.fn(),
}));

vi.mock("@/modules/activities/attendance-service", () => ({
  AttendanceError: class AttendanceError extends Error {},
  setAttendance: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createGroupCommentAction, joinGroupAction, setAttendanceAction } from "@/app/groups/[slug]/actions";
import { getCurrentUser } from "@/lib/current-user";
import { setAttendance } from "@/modules/activities/attendance-service";
import { joinOpenGroup } from "@/modules/groups/membership-service";

beforeEach(() => {
  vi.clearAllMocks();
});

it("does not call the membership service without a session", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);

  const result = await joinGroupAction("soder-sparks");

  expect(result).toMatchObject({ ok: false, code: "AUTH_REQUIRED" });
  expect(joinOpenGroup).not.toHaveBeenCalled();
});

it("does not call the attendance service without a session", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);

  const result = await setAttendanceAction("session-soder-sparks-next", "GOING");

  expect(result).toMatchObject({ ok: false, code: "AUTH_REQUIRED" });
  expect(setAttendance).not.toHaveBeenCalled();
});

it("does not create a comment without a session", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);

  const result = await createGroupCommentAction("soder-sparks", "hello team");

  expect(result).toMatchObject({ ok: false, code: "AUTH_REQUIRED" });
});

it("rejects blank comments before checking membership", async () => {
  const result = await createGroupCommentAction("soder-sparks", "   ");

  expect(result).toMatchObject({ ok: false, code: "INVALID_BODY" });
  expect(getCurrentUser).not.toHaveBeenCalled();
});
