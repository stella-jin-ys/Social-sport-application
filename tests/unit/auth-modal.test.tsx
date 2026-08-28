import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthModal } from "@/components/auth/auth-modal";
import { authClient } from "@/lib/auth-client";
import { clearPendingJoin, readPendingJoin, setPendingJoin } from "@/lib/pending-join";

const router = { back: vi.fn(), push: vi.fn(), refresh: vi.fn() };
let user: ReturnType<typeof userEvent.setup>;
let replaceLocation: ReturnType<typeof vi.fn>;

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

async function submitCredentials() {
  const email = screen.getByLabelText(/email/i);
  const password = screen.getByLabelText(/password/i);

  await user.clear(email);
  await user.type(email, "member@example.test");
  await user.clear(password);
  await user.type(password, "long-enough");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

beforeEach(() => {
  user = userEvent.setup();
  window.sessionStorage.clear();
  router.back.mockReset();
  router.push.mockReset();
  router.refresh.mockReset();
  replaceLocation = vi.fn();
  vi.stubGlobal("location", { replace: replaceLocation });
  vi.mocked(authClient.signIn.email).mockReset();
  vi.mocked(authClient.signUp.email).mockReset();
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.open = false;
  });
});

afterEach(async () => {
  cleanup();
  clearPendingJoin();
  await new Promise((resolve) => window.setTimeout(resolve));
  vi.unstubAllGlobals();
});

it("focuses the modal heading when the dialog opens", async () => {
  render(<AuthModal />);

  expect(await screen.findByRole("heading", { name: "Join group" })).toHaveFocus();
});

it("returns to the pending group only after successful authentication", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({ data: {}, error: null } as never);

  render(<AuthModal />);
  await submitCredentials();

  await waitFor(() => expect(replaceLocation).toHaveBeenCalledWith("/groups/soder-sparks"));
  expect(readPendingJoin()).not.toBeNull();
});

it("preserves pending join intent during a transient modal remount", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });

  render(<StrictMode><AuthModal /></StrictMode>);

  await new Promise((resolve) => window.setTimeout(resolve));
  expect(readPendingJoin()).not.toBeNull();
});

it("keeps intent after failed authentication and clears it on close", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({
    data: null,
    error: { message: "Invalid credentials" },
  } as never);

  render(<AuthModal />);
  await submitCredentials();

  await screen.findByRole("alert");
  expect(readPendingJoin()).not.toBeNull();

  await user.click(screen.getByRole("button", { name: /close/i }));
  expect(readPendingJoin()).toBeNull();
});

it("completes the same pending join after a successful retry", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email)
    .mockResolvedValueOnce({ data: null, error: { message: "Invalid credentials" } } as never)
    .mockResolvedValueOnce({ data: {}, error: null } as never);

  render(<AuthModal />);
  await submitCredentials();
  await screen.findByRole("alert");
  await submitCredentials();

  await waitFor(() => expect(replaceLocation).toHaveBeenCalledWith("/groups/soder-sparks"));
});
