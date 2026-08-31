import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/account-control", () => ({
  AccountControl: () => <div data-testid="account-control">Account control</div>,
}));

import { GroupDetail } from "@/app/groups/[slug]/group-detail";
import type { GroupPageData } from "@/modules/groups/contracts";

const group: GroupPageData = {
  slug: "soder-sparks",
  name: "Söder Sparks",
  sport: "Innebandy",
  sportSlug: "innebandy",
  location: "Stockholm · Södermalm",
  time: "Tue 18:30",
  audience: "Women only",
  members: "12 going",
  recommended: true,
  tone: "#7d2d20",
  accent: "#ffd9cd",
  memberCount: 42,
  description: "A friendly after-work floorball group.",
  organizer: "Lina Berg",
  schedule: "Every Tuesday",
  viewer: {
    isAuthenticated: true,
    isMember: true,
    canEdit: true,
    attendanceStatus: "GOING",
  },
  recurrence: {
    weekday: 2,
    startTime: "18:30",
    endTime: "20:00",
    venue: "Eriksdalshallen",
  },
  nextTraining: {
    id: "session-soder-sparks-next",
    title: "Tuesday training",
    startsAt: "2026-09-02T18:30:00.000Z",
    endsAt: "2026-09-02T19:30:00.000Z",
    date: "Tuesday · 2 September",
    time: "18:30–19:30",
    venue: "Eriksdalshallen",
    goingCount: 12,
  },
  comments: [{
    id: "comment-1",
    body: "Should we warm up before Tuesday?",
    authorName: "Jin Demo",
    createdAt: "2026-08-30T10:00:00.000Z",
  }],
};

it("renders an injected group and next-training details", () => {
  render(<GroupDetail group={group} />);

  expect(screen.getByRole("heading", { name: "Söder Sparks" })).toBeInTheDocument();
  expect(screen.getByText("Stockholm · Södermalm")).toBeInTheDocument();
  expect(screen.getByText(/organized by lina berg/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /next training/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /discussion/i })).toBeInTheDocument();
  expect(screen.getByText("Should we warm up before Tuesday?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /edit group/i })).toBeInTheDocument();
  const navigation = screen.getByRole("navigation");
  expect(within(navigation).getByRole("link", { name: /sportship/i })).toBeInTheDocument();
  expect(within(navigation).getByTestId("account-control")).toBeInTheDocument();
  expect(within(navigation).queryByRole("link", { name: /start a group/i })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /start a group/i })).toBeInTheDocument();
  expect(navigation).not.toHaveClass("flex-col");
});
