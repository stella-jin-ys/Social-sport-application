import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { StartGroupLink } from "@/components/start-group-link";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
}));

afterEach(() => vi.clearAllMocks());

it("sends signed-in users directly to group creation", () => {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada", email: "ada@example.test" } },
    isPending: false,
  } as never);

  render(<StartGroupLink />);

  expect(screen.getByRole("link", { name: /start a group/i })).toHaveAttribute("href", "/groups/new");
});

it("sends signed-out users to sign in before group creation", () => {
  vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never);

  render(<StartGroupLink />);

  expect(screen.getByRole("link", { name: /start a group/i })).toHaveAttribute("href", "/sign-in?returnTo=%2Fgroups%2Fnew");
});
