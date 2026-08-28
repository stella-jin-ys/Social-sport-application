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
    attendanceStatus: "GOING",
  },
  nextTraining: {
    id: "session-soder-sparks-next",
    date: "Tuesday · 2 September",
    time: "18:30–19:30",
    venue: "Eriksdalshallen",
    goingCount: 12,
  },
};

it("renders an injected group and next-training details", () => {
  render(<GroupDetail group={group} />);

  expect(screen.getByRole("heading", { name: "Söder Sparks" })).toBeInTheDocument();
  expect(screen.getByText("Stockholm · Södermalm")).toBeInTheDocument();
  expect(screen.getByText(/organized by lina berg/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /next training/i })).toBeInTheDocument();
  expect(within(screen.getByRole("navigation")).getByTestId("account-control")).toBeInTheDocument();
});
