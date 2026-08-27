import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
import { authClient } from "@/lib/auth-client";

const router = { push: vi.fn() };
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

beforeEach(() => {
  router.push.mockReset();
  searchParams = new URLSearchParams({ returnTo: "/\\evil.example" });
  vi.mocked(authClient.signIn.email).mockReset();
});

it("falls back home instead of navigating to a backslash-prefixed network path", async () => {
  vi.mocked(authClient.signIn.email).mockResolvedValue({ data: {}, error: null } as never);
  const user = userEvent.setup();

  render(<AuthForm variant="sign-in" />);
  await user.type(screen.getByLabelText(/email/i), "member@example.test");
  await user.type(screen.getByLabelText(/password/i), "long-enough");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));

  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
});
