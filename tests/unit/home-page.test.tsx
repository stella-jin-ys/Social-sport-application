import { render, screen, within } from "@testing-library/react";
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
    expect(within(screen.getByRole("navigation")).getByTestId("account-control")).toBeInTheDocument();
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
    expect(innebandy).toHaveStyle({ backgroundColor: "#ffd9cd", color: "#7d2d20" });
    expect(padel).toHaveStyle({ backgroundColor: "#e6ddff", color: "#4b3488" });
    expect(screen.getByText(/18 groups/i)).toHaveClass("text-[var(--ink)]");
    expect(groupsSection).toHaveClass("bg-[var(--paper)]");
    expect(screen.getAllByRole("article")[0]).toHaveClass("bg-[var(--surface-muted)]");
  });
});

describe("PWA manifest", () => {
  it("exposes the installable app details", () => {
    const appManifest = manifest();

    expect(appManifest.name).toBe("Group Sport");
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
