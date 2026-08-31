import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

const router = { refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/app/groups/[slug]/actions", () => ({
  createGroupCommentAction: vi.fn(),
}));

import { GroupComments } from "@/app/groups/[slug]/group-comments";
import { createGroupCommentAction } from "@/app/groups/[slug]/actions";

const comments = [{
  id: "comment-1",
  body: "Bring a light layer for the cool evening.",
  authorName: "Lina Berg",
  createdAt: "2026-08-30T10:00:00.000Z",
}];

beforeEach(() => {
  vi.clearAllMocks();
});

it("renders the discussion and member comment form", () => {
  render(<GroupComments groupSlug="soder-sparks" comments={comments} isAuthenticated isMember />);

  expect(screen.getByRole("heading", { name: /discussion/i })).toBeInTheDocument();
  expect(screen.getByText("Bring a light layer for the cool evening.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /join the conversation/i })).toBeInTheDocument();
});

it("prompts signed-out visitors to sign in", () => {
  render(<GroupComments groupSlug="soder-sparks" comments={comments} isAuthenticated={false} isMember={false} />);

  expect(screen.getByRole("link", { name: /sign in to join the conversation/i })).toHaveAttribute("href", "/sign-in");
});

it("prevents non-members from posting", () => {
  render(<GroupComments groupSlug="soder-sparks" comments={comments} isAuthenticated isMember={false} />);

  expect(screen.getByText("Join the group to comment.")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("posts a comment, clears the form, and refreshes", async () => {
  const user = userEvent.setup();
  vi.mocked(createGroupCommentAction).mockResolvedValue({
    ok: true,
    comment: { id: "comment-2", body: "See you there!", authorName: "Jin Demo", createdAt: "2026-08-30T12:00:00.000Z" },
  });
  render(<GroupComments groupSlug="soder-sparks" comments={comments} isAuthenticated isMember />);

  const textbox = screen.getByRole("textbox", { name: /join the conversation/i });
  await user.type(textbox, "See you there!");
  await user.click(screen.getByRole("button", { name: /post comment/i }));

  expect(createGroupCommentAction).toHaveBeenCalledWith("soder-sparks", "See you there!");
  expect(router.refresh).toHaveBeenCalled();
  expect(textbox).toHaveValue("");
});
