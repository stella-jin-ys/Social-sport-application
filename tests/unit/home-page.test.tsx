import { render, screen, within } from "@testing-library/react";
import manifest from "@/app/manifest";
import HomePage from "@/app/page";
import { vi } from "vitest";

vi.mock("@/components/account-control", () => ({
  AccountControl: () => <div data-testid="account-control">Account control</div>,
}));

describe("HomePage", () => {
  it("explains the core product action", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /find your next sports group/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover groups/i })).toHaveAttribute(
      "href",
      "/discover",
    );
    expect(within(screen.getByRole("navigation")).getByTestId("account-control")).toBeInTheDocument();
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
