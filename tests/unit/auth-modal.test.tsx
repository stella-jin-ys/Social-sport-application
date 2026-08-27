import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthModal } from "@/components/auth/auth-modal";
import { authClient } from "@/lib/auth-client";
import { clearPendingJoin, readPendingJoin, setPendingJoin } from "@/lib/pending-join";
import { joinGroupAction } from "@/app/groups/[slug]/actions";

const router = { back: vi.fn(), push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

vi.mock("@/app/groups/[slug]/actions", () => ({
  joinGroupAction: vi.fn(),
}));

function submitCredentials() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "member@example.test" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "long-enough" } });
  fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
}

beforeEach(() => {
  window.sessionStorage.clear();
  router.back.mockReset();
  router.push.mockReset();
  router.refresh.mockReset();
  vi.mocked(authClient.signIn.email).mockReset();
  vi.mocked(authClient.signUp.email).mockReset();
  vi.mocked(joinGroupAction).mockReset();
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.open = false;
  });
});

afterEach(() => clearPendingJoin());

it("completes the pending join only after successful authentication", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({ data: {}, error: null } as never);
  vi.mocked(joinGroupAction).mockResolvedValue({ ok: true, memberCount: 43 });

  render(<AuthModal />);
  submitCredentials();

  await waitFor(() => expect(joinGroupAction).toHaveBeenCalledWith("soder-sparks"));
  expect(readPendingJoin()).toBeNull();
  expect(router.back).toHaveBeenCalled();
});

it("keeps intent after failed authentication and clears it on close", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email).mockResolvedValue({
    data: null,
    error: { message: "Invalid credentials" },
  } as never);

  render(<AuthModal />);
  submitCredentials();

  await screen.findByRole("alert");
  expect(joinGroupAction).not.toHaveBeenCalled();
  expect(readPendingJoin()).not.toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  expect(readPendingJoin()).toBeNull();
});

it("completes the same pending join after a successful retry", async () => {
  setPendingJoin({ groupSlug: "soder-sparks", returnTo: "/groups/soder-sparks" });
  vi.mocked(authClient.signIn.email)
    .mockResolvedValueOnce({ data: null, error: { message: "Invalid credentials" } } as never)
    .mockResolvedValueOnce({ data: {}, error: null } as never);
  vi.mocked(joinGroupAction).mockResolvedValue({ ok: true, memberCount: 43 });

  render(<AuthModal />);
  submitCredentials();
  await screen.findByRole("alert");
  expect(joinGroupAction).not.toHaveBeenCalled();
  submitCredentials();

  await waitFor(() => expect(joinGroupAction).toHaveBeenCalledWith("soder-sparks"));
});
