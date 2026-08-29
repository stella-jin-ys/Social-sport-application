import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
import { authClient } from "@/lib/auth-client";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

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
  vi.mocked(authClient.signUp.email).mockReset();
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

it("restores sign-in submission and shows a retryable alert when authentication rejects", async () => {
  vi.mocked(authClient.signIn.email).mockRejectedValue(new Error("transport rejected"));
  const user = userEvent.setup();

  render(<AuthForm variant="sign-in" />);
  await user.type(screen.getByLabelText(/email/i), "member@example.test");
  await user.type(screen.getByLabelText(/password/i), "long-enough");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in. Please try again.");
  expect(screen.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
});

it("restores sign-up submission and shows a retryable alert when authentication rejects", async () => {
  vi.mocked(authClient.signUp.email).mockRejectedValue(new Error("transport rejected"));
  const user = userEvent.setup();

  render(<AuthForm variant="sign-up" />);
  await user.type(screen.getByLabelText(/name/i), "Test Member");
  await user.type(screen.getByLabelText(/email/i), "member@example.test");
  await user.type(screen.getByLabelText(/password/i), "long-enough");
  await user.click(screen.getByRole("button", { name: /^sign up$/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to create your account. Please try again.");
  expect(screen.getByRole("button", { name: /^sign up$/i })).toBeEnabled();
});

it.each([
  { variant: "sign-in" as const, label: "Signing in", button: "Sign in" },
  { variant: "sign-up" as const, label: "Creating account", button: "Sign up" },
])("shows an accessible indeterminate state while $variant is pending", async ({ variant, label, button }) => {
  const pendingAuth = deferred<{ data: object; error: null }>();
  const method = variant === "sign-up" ? authClient.signUp.email : authClient.signIn.email;
  vi.mocked(method).mockReturnValue(pendingAuth.promise as never);
  const user = userEvent.setup();

  render(<AuthForm variant={variant} />);
  if (variant === "sign-up") {
    await user.type(screen.getByLabelText(/name/i), "Test Member");
  }
  await user.type(screen.getByLabelText(/email/i), "member@example.test");
  await user.type(screen.getByLabelText(/password/i), "long-enough");
  await user.click(screen.getByRole("button", { name: button }));

  expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("progressbar", { name: label })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: button })).toBeDisabled();
  expect(screen.getByRole("progressbar", { name: label })).not.toHaveAttribute("aria-valuenow");

  pendingAuth.resolve({ data: {}, error: null });
  await waitFor(() => expect(screen.queryByRole("progressbar", { name: label })).not.toBeInTheDocument());
});
