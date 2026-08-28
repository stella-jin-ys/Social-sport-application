import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

const router = { push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/app/groups/[slug]/actions", () => ({
  joinGroupAction: vi.fn(),
  setAttendanceAction: vi.fn(),
}));

import { GroupActions } from "@/app/groups/[slug]/group-actions";
import { joinGroupAction, setAttendanceAction } from "@/app/groups/[slug]/actions";
import { readPendingJoin, setPendingJoin } from "@/lib/pending-join";

const baseProps = {
  groupSlug: "soder-sparks",
  memberCount: 42,
  nextTraining: {
    id: "session-soder-sparks-next",
    date: "Tuesday · 2 September",
    time: "18:30–19:30",
    venue: "Eriksdalshallen",
    goingCount: 12,
  },
  attendanceStatus: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

it("opens authentication and records intent for a signed-out visitor", async () => {
  const user = userEvent.setup();
  render(<GroupActions {...baseProps} isAuthenticated={false} isMember={false} />);

  await user.click(screen.getByRole("button", { name: "Join group" }));

  expect(readPendingJoin()).toEqual({
    groupSlug: "soder-sparks",
    returnTo: "/groups/soder-sparks",
  });
  expect(router.push).toHaveBeenCalledWith("/sign-in?returnTo=%2Fgroups%2Fsoder-sparks");
});

it("joins directly for an authenticated non-member", async () => {
  const user = userEvent.setup();
  vi.mocked(joinGroupAction).mockResolvedValue({ ok: true, memberCount: 43 });
  render(<GroupActions {...baseProps} isAuthenticated isMember={false} />);

  await user.click(screen.getByRole("button", { name: "Join group" }));

  expect(joinGroupAction).toHaveBeenCalledWith("soder-sparks");
  expect(screen.getByRole("button", { name: "Joined" })).toHaveAttribute("aria-pressed", "true");
});

it("restores join controls and shows a retryable alert when joining rejects", async () => {
  const user = userEvent.setup();
  vi.mocked(joinGroupAction).mockRejectedValue(new Error("network unavailable"));
  render(<GroupActions {...baseProps} isAuthenticated isMember={false} />);

  await user.click(screen.getByRole("button", { name: "Join group" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("We could not join this group. Please try again.");
  expect(screen.getByRole("button", { name: "Join group" })).toBeEnabled();
});

it("handles a rejected automatic pending join without leaving controls pending", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(joinGroupAction).mockRejectedValue(new Error("server action rejected"));

  render(<GroupActions {...baseProps} isAuthenticated isMember={false} />);

  expect(await screen.findByRole("alert")).toHaveTextContent("We could not join this group. Please try again.");
  expect(screen.getByRole("button", { name: "Join group" })).toBeEnabled();
});

it("lets an active member persist going and not-going states", async () => {
  const user = userEvent.setup();
  vi.mocked(setAttendanceAction)
    .mockResolvedValueOnce({ ok: true, status: "GOING", goingCount: 13 })
    .mockResolvedValueOnce({ ok: true, status: "NOT_GOING", goingCount: 12 });
  render(<GroupActions {...baseProps} isAuthenticated isMember />);

  await user.click(screen.getByRole("button", { name: "I'm coming" }));
  expect(screen.getByRole("button", { name: "You're coming" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "You're coming" }));
  expect(screen.getByRole("button", { name: "I'm coming" })).toHaveAttribute("aria-pressed", "false");
});

it("restores attendance controls and shows a retryable alert when saving rejects", async () => {
  const user = userEvent.setup();
  vi.mocked(setAttendanceAction).mockRejectedValue(new Error("network unavailable"));
  render(<GroupActions {...baseProps} isAuthenticated isMember scope="attendance" />);

  await user.click(screen.getByRole("button", { name: "I'm coming" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("We could not save your response. Please try again.");
  expect(screen.getByRole("button", { name: "I'm coming" })).toBeEnabled();
});

it("locks attendance until the visitor joins the group", async () => {
  const user = userEvent.setup();
  render(<GroupActions {...baseProps} isAuthenticated isMember={false} />);

  expect(screen.getByText("Join the group to respond")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "I'm coming" }));

  expect(setAttendanceAction).not.toHaveBeenCalled();
});
