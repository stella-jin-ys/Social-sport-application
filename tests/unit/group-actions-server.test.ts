import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/modules/groups/membership-service", () => ({
  joinOpenGroup: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { joinGroupAction } from "@/app/groups/[slug]/actions";
import { getCurrentUser } from "@/lib/current-user";
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
