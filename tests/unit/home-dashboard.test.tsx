import { render, screen } from "@testing-library/react";
import { HomeDashboard } from "@/components/home/home-dashboard";
import type { HomeDashboardData } from "@/modules/groups/contracts";

const data: HomeDashboardData = {
  joinedGroups: [{ slug: "soder-sparks", name: "Söder Sparks", sport: "Innebandy", sportSlug: "innebandy", location: "Stockholm · Södermalm", time: "Tue 18:30", schedule: "Every Tuesday", audience: "Women only", members: "12 going", recommended: true, tone: "#7d2d20", accent: "#ffd9cd", membershipId: "membership-1", joinedAt: "2026-08-30T08:00:00.000Z", nextActivity: { id: "session-1", groupSlug: "soder-sparks", groupName: "Söder Sparks", title: "Söder Sparks training", startsAt: "2026-09-01T16:30:00.000Z", endsAt: "2026-09-01T18:00:00.000Z", venue: "Eriksdalsskolan sports hall", goingCount: 12 } }],
  upcomingActivities: [{ id: "session-1", groupSlug: "soder-sparks", groupName: "Söder Sparks", title: "Söder Sparks training", startsAt: "2026-09-01T16:30:00.000Z", endsAt: "2026-09-01T18:00:00.000Z", venue: "Eriksdalsskolan sports hall", goingCount: 12 }],
  recommendedGroups: [{ slug: "parken-5-a-side", name: "Parken 5-a-side", sport: "Football", sportSlug: "football", location: "Stockholm · Vasastan", time: "Wed 19:00", schedule: "Every Wednesday", audience: "Mixed group", members: "8 going", recommended: true, tone: "#3158b7", accent: "#f0f3ff" }],
};

it("shows joined groups, upcoming activity, and search recommendations", () => {
  render(<HomeDashboard data={data} userName="Jin" />);

  expect(screen.getByRole("heading", { name: /your groups/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /söder sparks/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /upcoming training & events/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /search other groups/i })).toHaveAttribute("href", "/discover");
  expect(screen.getByRole("heading", { name: /groups you might like/i })).toBeInTheDocument();
  const upcomingHeading = screen.getByRole("heading", { name: /upcoming training & events/i });
  const joinedHeading = screen.getByRole("heading", { name: /your groups/i });
  expect(upcomingHeading.compareDocumentPosition(joinedHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByText(/next up/i)).not.toBeInTheDocument();
});

it("shows a find-a-group empty state for members without groups", () => {
  render(<HomeDashboard data={{ joinedGroups: [], upcomingActivities: [], recommendedGroups: [] }} userName="Jin" />);

  expect(screen.getByRole("heading", { name: /your groups will live here/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /find a group/i })).toHaveAttribute("href", "/discover");
});
