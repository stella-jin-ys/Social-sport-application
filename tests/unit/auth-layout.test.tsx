import { render, screen } from "@testing-library/react";
import AuthLayout from "@/app/(auth)/layout";

it("places standalone authentication inside a padded constrained card", () => {
  render(<AuthLayout><p>Authentication form</p></AuthLayout>);

  expect(screen.getByRole("main")).toHaveClass("auth-page");
  expect(screen.getByText("Authentication form").parentElement).toHaveClass("auth-page__card");
  expect(screen.getByRole("link", { name: /huddle home/i })).toHaveAttribute("href", "/");
});
