import { render, screen } from "@testing-library/react";
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
