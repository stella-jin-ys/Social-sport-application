# Account Control and Auth Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive standalone authentication card and a reusable session-aware header control that shows Sign in to visitors and an initials dropdown with account details and sign-out to authenticated users.

**Architecture:** Keep Better Auth as the session source. A client `AccountControl` owns session rendering, dropdown interaction, and sign-out, while the existing headers consume it without restructuring their pages. A route-group layout owns standalone sign-in/sign-up composition so the intercepted group-auth modal remains unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Better Auth 1.7, Tailwind CSS 4 plus established global tokens, Vitest, Testing Library, Playwright, and axe-core.

**Spec:** `docs/superpowers/specs/2026-08-28-account-control-auth-layout-design.md`

## Global Constraints

- Do not add a `/profile` route or profile-editing features.
- Signed-out headers render a visible **Sign in** link and no avatar.
- Signed-in headers render a circular initials avatar button with a 44px minimum target.
- The account dropdown displays only the current user's name, email, and **Sign out** action.
- Escape, outside click, successful sign-out, and route teardown close the dropdown.
- Rejected sign-out restores the action and shows a retryable alert without exposing transport details.
- Standalone `/sign-in` and `/sign-up` use a maximum 30rem card with safe mobile padding.
- The intercepted sign-in modal retains its existing composition and behavior.
- Preserve existing Huddle typography, orange accent, light surfaces, imagery, navigation, and primary actions.
- Do not add dependencies.

## File Structure

```text
src/
  app/
    (auth)/layout.tsx                 standalone auth shell only
    globals.css                       auth-page and account-control styles
    page.tsx                          home header consumes AccountControl
    discover/discover-client.tsx      Discover header consumes AccountControl
    groups/[slug]/group-detail.tsx    group header consumes AccountControl
  components/
    account-control.tsx               session UI, dropdown, sign-out, initials
tests/
  unit/
    account-control.test.tsx          account states and interaction
    auth-layout.test.tsx              standalone auth composition
    home-page.test.tsx                home header integration
    discover-page.test.tsx            Discover header integration
    group-detail-page.test.tsx        group header integration
  e2e/
    account-control.spec.ts           real auth, dropdown, sign-out, mobile layout
```

---

### Task 1: Standalone authentication layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/unit/auth-layout.test.tsx`

**Interfaces:**
- Consumes: existing `AuthForm` routes under `src/app/(auth)`.
- Produces: `AuthLayout({ children }: Readonly<{ children: ReactNode }>)` and the CSS hooks `auth-page`, `auth-page__home`, and `auth-page__card`.

- [ ] **Step 1: Write the failing auth-layout test**

```tsx
import { render, screen } from "@testing-library/react";
import AuthLayout from "@/app/(auth)/layout";

it("places standalone authentication inside a padded constrained card", () => {
  render(<AuthLayout><p>Authentication form</p></AuthLayout>);

  expect(screen.getByRole("main")).toHaveClass("auth-page");
  expect(screen.getByText("Authentication form").parentElement).toHaveClass("auth-page__card");
  expect(screen.getByRole("link", { name: /huddle home/i })).toHaveAttribute("href", "/");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/auth-layout.test.tsx
```

Expected: FAIL because `src/app/(auth)/layout.tsx` does not exist.

- [ ] **Step 3: Implement the minimal shared route layout**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="auth-page">
      <Link aria-label="Huddle home" className="auth-page__home font-display" href="/">
        huddle<span>.</span>
      </Link>
      <div className="auth-page__card">{children}</div>
    </main>
  );
}
```

Add CSS that gives `.auth-page` `min-height: 100dvh`, grid centering, and `padding: clamp(1rem, 4vw, 3rem)`. Give `.auth-page__card` `width: min(100%, 30rem)`, existing surface/border/radius tokens, and `padding: clamp(1.5rem, 5vw, 2.25rem)`. Position the home link above the card without absolute positioning so narrow screens cannot overlap.

- [ ] **Step 4: Run the focused test and auth-form regressions**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/auth-layout.test.tsx tests/unit/auth-form.test.tsx
```

Expected: both files pass and intercepted-modal tests remain unaffected because they do not use the route-group layout.

- [ ] **Step 5: Commit only Task 1 files**

```bash
git commit -m "fix: constrain standalone auth pages" -- src/app/'(auth)'/layout.tsx src/app/globals.css tests/unit/auth-layout.test.tsx
```

---

### Task 2: Session-aware account control

**Files:**
- Create: `src/components/account-control.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/unit/account-control.test.tsx`

**Interfaces:**
- Consumes: `authClient.useSession()`, `authClient.signOut()`, `useRouter()`.
- Produces: `AccountControl(): JSX.Element` and `accountInitials(name: string, email: string): string`.

- [ ] **Step 1: Write failing tests for signed-out, loading, and signed-in states**

Mock `@/lib/auth-client` with `useSession` and `signOut`, and mock `next/navigation` with `push` and `refresh`. Add these assertions:

```tsx
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
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { name: "Ada Lovelace", email: "ada@example.test" } },
    isPending: false,
  } as never);
  render(<AccountControl />);
  await userEvent.click(screen.getByRole("button", { name: /open account menu/i }));
  expect(screen.getByRole("button", { name: /open account menu/i })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Ada Lovelace")).toBeVisible();
  expect(screen.getByText("ada@example.test")).toBeVisible();
  expect(screen.getByText("AL", { selector: ".account-control__avatar" })).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/account-control.test.tsx
```

Expected: FAIL because `AccountControl` does not exist.

- [ ] **Step 3: Implement session states and initials**

Create a client component. `accountInitials` trims the name, uses the first character of the first and last name when two or more words exist, uses the first two characters for a single name, and falls back to the first two characters before `@` in the email. Return uppercase output.

Render:

- a `.account-control__skeleton` span with `aria-hidden="true"` while pending;
- the existing-style `/sign-in` link when `data?.user` is absent;
- a `.account-control__avatar` button with `aria-expanded`, `aria-controls="account-dropdown"`, and `aria-label="Open account menu"` when signed in;
- an anchored `<section aria-label="Account details" id="account-dropdown">` only while open.

- [ ] **Step 4: Write failing interaction and error tests**

Add tests that open the dropdown and prove:

```tsx
await user.keyboard("{Escape}");
expect(screen.queryByLabelText("Account details")).not.toBeInTheDocument();

await user.pointer({ keys: "[MouseLeft]", target: document.body });
expect(screen.queryByLabelText("Account details")).not.toBeInTheDocument();

vi.mocked(authClient.signOut).mockRejectedValue(new Error("offline"));
await user.click(screen.getByRole("button", { name: "Sign out" }));
expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out. Please try again.");
expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
```

Add a successful sign-out test that expects `signOut`, `router.push("/")`, and `router.refresh()` and verifies the dropdown closes.

- [ ] **Step 5: Run interaction tests and verify RED**

Run the same focused test command. Expected: the new dismissal and sign-out tests fail because those handlers are missing.

- [ ] **Step 6: Implement dismissal and sign-out recovery**

When open, register document `pointerdown` and `keydown` listeners in one effect. Close when the pointer target is outside the component ref or the key is Escape, and remove both listeners in cleanup. During sign-out, disable the action and clear a previous error. Use `try/catch/finally`; on success close, push `/`, and refresh; on rejection keep the dropdown open and show `Unable to sign out. Please try again.`.

- [ ] **Step 7: Add account-control CSS**

Use existing variables only. The control root is `position: relative`; avatar and skeleton are exactly 2.75rem square; dropdown is absolutely positioned at `right: 0`, has `width: min(20rem, calc(100vw - 2rem))`, and uses the existing surface, line, radius, and shadow language. Ensure name/email wrap safely, controls are at least 44px high, focus is visible, and no menu animation runs under reduced motion.

- [ ] **Step 8: Run focused tests and commit Task 2**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/account-control.test.tsx
```

Expected: all account-control tests pass with no unhandled rejections.

Commit:

```bash
git commit -m "feat: add account dropdown control" -- src/components/account-control.tsx src/app/globals.css tests/unit/account-control.test.tsx
```

---

### Task 3: Integrate the account control into every main header

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/discover/discover-client.tsx`
- Modify: `src/app/groups/[slug]/group-detail.tsx`
- Modify: `tests/unit/home-page.test.tsx`
- Modify: `tests/unit/discover-page.test.tsx`
- Modify: `tests/unit/group-detail-page.test.tsx`

**Interfaces:**
- Consumes: `AccountControl` from Task 2.
- Produces: consistent signed-in/out account entry points in all three main headers.

- [ ] **Step 1: Add failing header-integration assertions**

In each page test, mock the component:

```tsx
vi.mock("@/components/account-control", () => ({
  AccountControl: () => <div data-testid="account-control">Account control</div>,
}));
```

Add one assertion per rendered page:

```tsx
expect(screen.getByTestId("account-control")).toBeInTheDocument();
```

- [ ] **Step 2: Run the three tests and verify RED**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/home-page.test.tsx tests/unit/discover-page.test.tsx tests/unit/group-detail-page.test.tsx
```

Expected: FAIL because none of the headers renders the mocked control.

- [ ] **Step 3: Replace only the duplicated Sign in links**

Import `AccountControl` in each page and replace the existing standalone `/sign-in` link in the header action group with `<AccountControl />`. Keep **Start a group**, Discover navigation, logo, spacing, and mobile behavior unchanged. The group-detail header currently has no Sign in link, so insert `<AccountControl />` before **Start a group**.

- [ ] **Step 4: Run integration tests and the unit suite**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit/home-page.test.tsx tests/unit/discover-page.test.tsx tests/unit/group-detail-page.test.tsx
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit
```

Expected: focused page tests and the complete unit suite pass.

- [ ] **Step 5: Commit Task 3**

```bash
git commit -m "feat: expose account control in app headers" -- src/app/page.tsx src/app/discover/discover-client.tsx src/app/groups/'[slug]'/group-detail.tsx tests/unit/home-page.test.tsx tests/unit/discover-page.test.tsx tests/unit/group-detail-page.test.tsx
```

---

### Task 4: Browser acceptance and final verification

**Files:**
- Create: `tests/e2e/account-control.spec.ts`
- Modify only if a real failing regression requires it: Task 1–3 files associated with that regression.

**Interfaces:**
- Consumes: complete auth layout and account control from Tasks 1–3.
- Produces: executable browser acceptance for signed-out, signed-in, sign-out, and narrow auth layout.

- [ ] **Step 1: Write the failing end-to-end journey**

Use the existing database reset/seed helpers. Add a test that:

```ts
test("shows account details after sign-up and returns to Sign in after sign-out", async ({ page }) => {
  const email = `account-control-${Date.now()}@example.test`;
  await page.goto("/sign-up");

  const card = page.locator(".auth-page__card");
  await expect(card).toBeVisible();
  await page.getByLabel(/name/i).fill("Ada Runner");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);

  await page.getByRole("button", { name: /open account menu/i }).click();
  await expect(page.getByLabel("Account details")).toContainText("Ada Runner");
  await expect(page.getByLabel("Account details")).toContainText(email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: /open account menu/i })).toHaveCount(0);
});
```

Add a 390×844 test that checks `.auth-page__card` stays within the viewport with at least 16px left/right clearance and runs axe on the sign-up page and the open account dropdown.

- [ ] **Step 2: Run the focused E2E and verify RED if browser behavior is incomplete**

Run:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/playwright test tests/e2e/account-control.spec.ts
```

Expected before Tasks 1–3: FAIL because the card and account-control selectors do not exist. During ordered execution, confirm the committed test exercises the completed behavior and passes.

- [ ] **Step 3: Run the complete quality gate**

Run in this order:

```bash
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/unit
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/vitest run tests/integration
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/tsc --noEmit
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/eslint .
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/next build --webpack
PATH=/Users/stella/.nvm/versions/node/v22.16.0/bin:$PATH node_modules/.bin/playwright test
```

Expected: all commands exit 0; `/discover` remains dynamic in the build output; existing Join/modal/attendance journeys remain green.

- [ ] **Step 4: Perform one bounded live visual review**

At desktop and 390×844:

- verify the sign-up card has safe viewport padding and a maximum readable width;
- verify visitors see Sign in and no avatar;
- create/sign into an account and verify the avatar and dropdown stay within the header/viewport;
- verify name/email wrapping, 44px targets, visible focus, Escape/outside-click dismissal, and no browser errors;
- preserve existing page images, colors, and layout outside the changed surfaces.

Run the Impeccable detector only if it has not already run in this session; it already ran for the current session, so do not rerun it.

- [ ] **Step 5: Commit the browser acceptance test**

```bash
git commit -m "test: cover account dropdown journey" -- tests/e2e/account-control.spec.ts
```

---

## Definition of done

- [ ] Standalone sign-in and sign-up pages use the constrained padded card at desktop and mobile sizes.
- [ ] Signed-out headers show Sign in and no avatar.
- [ ] Signed-in headers show a 44px initials avatar.
- [ ] The dropdown displays the current name and email and never renders for visitors.
- [ ] Escape, outside click, and successful sign-out close the dropdown.
- [ ] Rejected sign-out restores the action and announces a retryable error.
- [ ] No `/profile` route exists.
- [ ] Unit, integration, typecheck, lint, build, E2E, axe, and live visual checks pass.

