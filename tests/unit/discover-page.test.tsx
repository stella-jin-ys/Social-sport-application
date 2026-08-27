import { fireEvent, render, screen } from "@testing-library/react";
import { DiscoverClient } from "@/app/discover/discover-client";
import type { PublicGroupCard } from "@/modules/groups/contracts";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const groupFixtures: PublicGroupCard[] = [
  {
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
  },
  {
    slug: "parken-5-a-side",
    name: "Parken 5-a-side",
    sport: "Football",
    sportSlug: "football",
    location: "Stockholm · Vasastan",
    time: "Wed 19:00",
    audience: "Mixed group",
    members: "8 going",
    recommended: true,
    tone: "#3158b7",
    accent: "#f0f3ff",
  },
  {
    slug: "sunrise-miles",
    name: "Sunrise Miles",
    sport: "Running",
    sportSlug: "running",
    location: "Stockholm · Djurgården",
    time: "Sat 09:15",
    audience: "Open to all",
    members: "16 going",
    recommended: true,
    tone: "#8c6110",
    accent: "#fff8dd",
  },
];

describe("DiscoverClient", () => {
  it("gives anyone a public way to browse groups", () => {
    render(<DiscoverClient groups={groupFixtures} />);

    expect(screen.getByRole("heading", { name: /find a group that fits your week/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /sport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /women only/i })).toBeInTheDocument();
    expect(screen.getByText(/recommended groups/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view group/i })[0]).toHaveAttribute("href", "/groups/soder-sparks");
  });

  it("filters groups by sport and location", () => {
    render(<DiscoverClient groups={groupFixtures} />);

    fireEvent.change(screen.getByRole("combobox", { name: /sport/i }), { target: { value: "running" } });
    expect(screen.getByText("Sunrise Miles")).toBeInTheDocument();
    expect(screen.queryByText("Söder Sparks")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: /location/i }), { target: { value: "Uppsala" } });
    expect(screen.getByText("No groups match those filters")).toBeInTheDocument();
  });

  it("filters groups by participation type", () => {
    render(<DiscoverClient groups={groupFixtures} />);

    fireEvent.click(screen.getByRole("button", { name: /women only/i }));

    expect(screen.getByText("Söder Sparks")).toBeInTheDocument();
    expect(screen.queryByText("Parken 5-a-side")).not.toBeInTheDocument();
  });
});
