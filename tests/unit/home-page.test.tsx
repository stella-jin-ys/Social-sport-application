import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import manifest from "@/app/manifest";
import HomePage from "@/app/page";
import { vi } from "vitest";

vi.mock("@/components/account-control", () => ({
  AccountControl: () => <div data-testid="account-control">Account control</div>,
}));

describe("HomePage", () => {
  it("gives visitors a browse-first starting point", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /find your people\. move together/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse groups/i })).toHaveAttribute(
      "href",
      "/discover",
    );
    expect(screen.getByRole("button", { name: /innebandy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /football/i })).toBeInTheDocument();
    expect(screen.getByText(/women only/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view group/i })[0]).toHaveAttribute("href", "/groups/soder-sparks");
    const navigation = screen.getByRole("navigation");
    expect(within(navigation).getByRole("link", { name: /sportship/i })).toBeInTheDocument();
    expect(within(navigation).getByTestId("account-control")).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /start a group/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a group/i })).toBeInTheDocument();
  });

  it("keeps sport controls and nearby groups visually distinct", () => {
    render(<HomePage />);
    const innebandy = screen.getByRole("button", { name: /innebandy/i });
    const padel = screen.getByRole("button", { name: /padel/i });
    const allSports = screen.getByRole("button", { name: /all.*browse all groups/i });
    const groupsHeading = screen.getByRole("heading", { name: /groups happening near you/i });
    const groupsSection = groupsHeading.closest("section");

    expect(innebandy).toHaveClass("hover:outline-2", "hover:outline-offset-2");
    expect(allSports).toHaveClass("hover:outline-2", "hover:outline-offset-2");
    expect(innebandy).toHaveClass("bg-[var(--surface)]", "text-[var(--ink)]");
    expect(padel).toHaveClass("bg-[var(--surface)]", "text-[var(--ink)]");
    expect(screen.getByText(/18 groups/i)).toHaveClass("text-[var(--accent-strong)]");
    expect(groupsSection).toHaveClass("bg-[var(--paper)]");
    expect(screen.getAllByRole("article")[0]).toHaveClass("bg-[var(--surface)]");
  });

  it("filters nearby groups when a sport is selected", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /football/i }));

    expect(screen.getByRole("button", { name: /football/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/showing football groups/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /parken 5-a-side/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /söder sparks/i })).not.toBeInTheDocument();
  });

  it("combines a city selection with the active sport", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /football/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /city/i }), "uppsala");

    expect(screen.getByText(/showing football groups in uppsala/i)).toBeInTheDocument();
    expect(screen.getByText(/no sample groups yet/i)).toBeInTheDocument();
  });

  it("marks the sport picker and hero for responsive reordering", () => {
    render(<HomePage />);

    const sportHeading = screen.getByRole("heading", { name: /pick a sport/i });
    const heroImage = screen.getByRole("img", { name: /women playing floorball/i });

    expect(sportHeading.closest("section")).toHaveClass("home-sports-section");
    expect(heroImage.closest("section")).toHaveClass("home-hero");
  });
});

describe("PWA manifest", () => {
  it("exposes the installable app details", () => {
    const appManifest = manifest();

    expect(appManifest.name).toBe("Sportship");
    expect(appManifest.short_name).toBe("Sportship");
    expect(appManifest.display).toBe("standalone");
    expect(appManifest.start_url).toBe("/");
    expect(appManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.svg", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512.svg", sizes: "512x512" }),
      ]),
    );
  });
});
