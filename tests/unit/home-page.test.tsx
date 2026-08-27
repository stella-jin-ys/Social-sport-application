import { render, screen } from "@testing-library/react";
import manifest from "@/app/manifest";
import HomePage from "@/app/page";

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
        expect.objectContaining({ src: "/icon.svg" }),
      ]),
    );
  });
});
