import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import AuthLayout from "@/app/(auth)/layout";

const globalsCss = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

it("places standalone authentication inside a padded constrained card", () => {
  render(<AuthLayout><p>Authentication form</p></AuthLayout>);

  expect(screen.getByRole("main")).toHaveClass("auth-page");
  expect(screen.getByText("Authentication form").parentElement).toHaveClass("auth-page__card");
  expect(screen.getByRole("link", { name: /sportship home/i })).toHaveAttribute("href", "/");
});

it("gives standalone auth controls and home link the accent focus treatment", () => {
  expect(globalsCss).toMatch(/\.auth-page :is\(button, input\):focus-visible,\s*\.auth-page__home:focus-visible\s*\{[\s\S]*?outline: 3px solid var\(--accent[^;]*;[\s\S]*?outline-offset: 3px;/);
});
