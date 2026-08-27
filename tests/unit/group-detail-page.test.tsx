import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/modules/groups/group-queries", () => ({
  getGroupPageData: vi.fn(),
}));

import GroupDetailPage from "@/app/groups/[slug]/page";
import { getCurrentUser } from "@/lib/current-user";
import type { GroupPageData } from "@/modules/groups/contracts";
import { getGroupPageData } from "@/modules/groups/group-queries";

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

it("renders server-provided group and next-training details", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "member-a", name: "Member A", email: "member-a@example.test" });
  vi.mocked(getGroupPageData).mockResolvedValue(group);

  render(await GroupDetailPage({ params: Promise.resolve({ slug: "soder-sparks" }) }));

  expect(screen.getByRole("heading", { name: "Söder Sparks" })).toBeInTheDocument();
  expect(screen.getByText("Stockholm · Södermalm")).toBeInTheDocument();
  expect(screen.getByText(/organized by lina berg/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /next training/i })).toBeInTheDocument();
});
