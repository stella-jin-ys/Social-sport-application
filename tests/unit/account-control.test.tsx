import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { accountInitials, AccountControl } from "@/components/account-control";
import { authClient } from "@/lib/auth-client";

const router = { push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

it("derives uppercase initials from names and an email fallback", () => {
  expect(accountInitials(" Ada Lovelace ", "ada@example.test")).toBe("AL");
  expect(accountInitials("Ada", "ada@example.test")).toBe("AD");
  expect(accountInitials("", "ada@example.test")).toBe("AD");
});

it("shows Sign in and no avatar to a signed-out visitor", () => {
  vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never);

  render(<AccountControl />);

  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  expect(screen.queryByRole("button", { name: /open account menu/i })).not.toBeInTheDocument();
});

it("reserves the account-control target while the session loads", () => {
  vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as never);

  const { container } = render(<AccountControl />);

  expect(container.querySelector(".account-control__skeleton")).toBeInTheDocument();
});

it("opens account details from a 44px initials avatar", async () => {
  const user = userEvent.setup();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada Lovelace", email: "ada@example.test" } },
    isPending: false,
  } as never);

  render(<AccountControl />);

  await user.click(screen.getByRole("button", { name: /open account menu/i }));

  expect(screen.getByRole("button", { name: /open account menu/i })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Ada Lovelace")).toBeVisible();
  expect(screen.getByText("ada@example.test")).toBeVisible();
  expect(screen.getByText("AL", { selector: ".account-control__avatar" })).toBeVisible();
});

it("closes account details with Escape and an outside click", async () => {
  const user = userEvent.setup();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada Lovelace", email: "ada@example.test" } },
    isPending: false,
  } as never);

  render(<AccountControl />);

  await user.click(screen.getByRole("button", { name: /open account menu/i }));
  await user.keyboard("{Escape}");
  expect(screen.queryByLabelText("Account details")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /open account menu/i }));
  await user.pointer({ keys: "[MouseLeft]", target: document.body });
  expect(screen.queryByLabelText("Account details")).not.toBeInTheDocument();
});

it("keeps account details open and enables retry after sign-out fails", async () => {
  const user = userEvent.setup();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada Lovelace", email: "ada@example.test" } },
    isPending: false,
  } as never);
  vi.mocked(authClient.signOut).mockRejectedValue(new Error("offline"));

  render(<AccountControl />);
  await user.click(screen.getByRole("button", { name: /open account menu/i }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out. Please try again.");
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
});

it("redirects home and closes account details after signing out", async () => {
  const user = userEvent.setup();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada Lovelace", email: "ada@example.test" } },
    isPending: false,
  } as never);
  vi.mocked(authClient.signOut).mockResolvedValue({} as never);

  render(<AccountControl />);
  await user.click(screen.getByRole("button", { name: /open account menu/i }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));

  expect(authClient.signOut).toHaveBeenCalledOnce();
  expect(router.push).toHaveBeenCalledWith("/");
  expect(router.refresh).toHaveBeenCalledOnce();
  expect(screen.queryByLabelText("Account details")).not.toBeInTheDocument();
});
