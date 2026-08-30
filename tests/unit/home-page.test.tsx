import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import manifest from "@/app/manifest";
import { HomeFinder } from "@/components/home/home-finder";
import type { PublicGroupCard } from "@/modules/groups/contracts";

const groups: PublicGroupCard[] = [
  { slug: "soder-sparks", name: "Söder Sparks", sport: "Innebandy", sportSlug: "innebandy", location: "Stockholm · Södermalm", time: "Tue 18:30", schedule: "Every Tuesday", audience: "Women only", members: "12 going", recommended: true, tone: "#7d2d20", accent: "#ffd9cd" },
  { slug: "parken-5-a-side", name: "Parken 5-a-side", sport: "Football", sportSlug: "football", location: "Stockholm · Vasastan", time: "Wed 19:00", schedule: "Every Wednesday", audience: "Mixed group", members: "8 going", recommended: true, tone: "#3158b7", accent: "#f0f3ff" },
];

describe("HomeFinder", () => {
  it("lets visitors find groups by sport and city", async () => {
    const user = userEvent.setup();
    render(<HomeFinder groups={groups} />);

    await user.selectOptions(screen.getByRole("combobox", { name: /sport/i }), "football");
    await user.clear(screen.getByRole("textbox", { name: /city/i }));
    await user.type(screen.getByRole("textbox", { name: /city/i }), "Stockholm");
    await user.click(screen.getByRole("button", { name: /find groups/i }));

    expect(screen.getByRole("heading", { name: /football groups in stockholm/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /parken 5-a-side/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /söder sparks/i })).not.toBeInTheDocument();
  });

  it("uses the current city when a sport chip is tapped", async () => {
    const user = userEvent.setup();
    render(<HomeFinder groups={groups} />);

    await user.clear(screen.getByRole("textbox", { name: /city/i }));
    await user.type(screen.getByRole("textbox", { name: /city/i }), "Uppsala");
    await user.click(screen.getByRole("button", { name: /football/i }));

    expect(screen.getByRole("heading", { name: /football groups in uppsala/i })).toBeInTheDocument();
  });
});

describe("PWA manifest", () => {
  it("exposes the installable app details", () => {
    const appManifest = manifest();
    expect(appManifest.name).toBe("Sportship");
    expect(appManifest.short_name).toBe("Sportship");
    expect(appManifest.display).toBe("standalone");
  });
});
