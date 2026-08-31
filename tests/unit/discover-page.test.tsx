import { fireEvent, render, screen, within } from "@testing-library/react";
import { DiscoverClient } from "@/app/discover/discover-client";
import type { PublicGroupCard } from "@/modules/groups/contracts";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/account-control", () => ({
  AccountControl: () => <div data-testid="account-control">Account control</div>,
}));

const groupFixtures: PublicGroupCard[] = [
  {
    slug: "soder-sparks",
    name: "Söder Sparks",
    sport: "Innebandy",
    sportSlug: "innebandy",
    location: "Stockholm · Södermalm",
    time: "Tue 18:30",
    schedule: "Every Tuesday evening",
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
    schedule: "Every Wednesday evening",
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
    schedule: "Every Saturday morning",
    audience: "Open to all",
    members: "16 going",
    recommended: true,
    tone: "#8c6110",
    accent: "#fff8dd",
  },
  {
    slug: "norrmalm-mens-padel",
    name: "Norrmalm Men’s Padel",
    sport: "Padel",
    sportSlug: "padel",
    location: "Stockholm · Norrmalm",
    time: "Sun 16:00",
    schedule: "Every Sunday afternoon",
    audience: "Men only",
    members: "6 going",
    recommended: false,
    tone: "#4b3488",
    accent: "#e6ddff",
  },
];

describe("DiscoverClient", () => {
  it("renders groups with duplicate names without a React key warning", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const duplicateNameGroup = { ...groupFixtures[0], slug: "soder-sparks-two" };

    render(<DiscoverClient groups={[groupFixtures[0], duplicateNameGroup]} />);

    const warnings = consoleError.mock.calls.flat().join(" ");
    expect(warnings).not.toContain("same key");
    consoleError.mockRestore();
  });

  it("gives anyone a public way to browse groups", () => {
    render(<DiscoverClient groups={groupFixtures} />);

    expect(screen.getByRole("heading", { name: /find a group that fits your week/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /sport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /women only/i })).toBeInTheDocument();
    expect(screen.getByText(/recommended groups/i)).toBeInTheDocument();
    expect(screen.getByText("Every Tuesday evening")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view group/i })[0]).toHaveAttribute("href", "/groups/soder-sparks");
    const navigation = screen.getByRole("navigation");
    expect(within(navigation).getByRole("link", { name: /sportship/i })).toBeInTheDocument();
    expect(within(navigation).getByTestId("account-control")).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /start a group/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a group/i })).toBeInTheDocument();
    expect(navigation).not.toHaveClass("flex-col");
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

  it("filters groups to men-only participation", () => {
    render(<DiscoverClient groups={groupFixtures} />);

    fireEvent.click(screen.getByRole("button", { name: /^men only$/i }));

    expect(screen.getByText("Norrmalm Men’s Padel")).toBeInTheDocument();
    expect(screen.queryByText("Söder Sparks")).not.toBeInTheDocument();
  });
});
