import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetDomainData } from "../integration/database";
import { seedGroups } from "@/modules/groups/seed-groups";

test.beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

test("joining while signed in enables attendance without a reload", async ({ page }) => {
  const email = `direct-member-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel(/name/i).fill("Direct Member");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);

  await page.goto("/groups/soder-sparks");
  await page.getByRole("button", { name: "Join group" }).click();

  await expect(page.getByRole("button", { name: "Joined" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'm coming" })).toBeEnabled();
});

test("creates an account, completes the pending join, and persists attendance", async ({ page }) => {
  const email = `member-${Date.now()}@example.test`;
  await page.goto("/discover");
  await page.getByRole("link", { name: "View group" }).first().click();
  await page.getByRole("button", { name: "Join group" }).click();

  const dialog = page.getByRole("dialog", { name: /join group/i });
  await expect(dialog).toBeVisible();
  await page.locator("dialog > button").last().click();
  await dialog.getByLabel(/name/i).fill("Test Member");
  await dialog.getByLabel(/email/i).fill(email);
  await dialog.getByLabel(/password/i).fill("long-enough-password");
  await Promise.all([
    page.waitForNavigation(),
    dialog.getByRole("button", { name: "Sign up" }).click(),
  ]);

  await expect(page).toHaveURL(/\/groups\/soder-sparks$/);
  await expect(page.getByRole("button", { name: "Joined" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'm coming" })).toBeEnabled();
  await page.getByRole("button", { name: "I'm coming" }).click();
  await expect(page.getByRole("button", { name: "You're coming" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Joined" })).toBeVisible();
  await expect(page.getByRole("button", { name: "You're coming" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("failed authentication leaves the visitor unjoined and permits dismissal", async ({ page }) => {
  const email = `existing-member-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel(/name/i).fill("Existing Member");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);
  await page.context().clearCookies();

  await page.goto("/groups/soder-sparks");
  await page.getByRole("button", { name: "Join group" }).click();
  const dialog = page.getByRole("dialog", { name: /join group/i });
  await dialog.getByLabel(/email/i).fill(email);
  await dialog.getByLabel(/password/i).fill("incorrect-password");
  await dialog.getByRole("button", { name: "Sign in" }).click();

  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Joined" })).toHaveCount(0);
  await dialog.getByRole("button", { name: /close/i }).click();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
});

test("closing authentication leaves the visitor unjoined", async ({ page }) => {
  await page.goto("/groups/soder-sparks");
  await page.getByRole("button", { name: "Join group" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /close/i }).click();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
});

test("browser Back clears join intent before direct sign-in", async ({ page }) => {
  const email = `back-member-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel(/name/i).fill("Back Member");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);
  await page.context().clearCookies();

  await page.goto("/groups/soder-sparks");
  await page.getByRole("button", { name: "Join group" }).click();
  await expect(page.getByRole("dialog", { name: /join group/i })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();

  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/$/);

  await page.goto("/groups/soder-sparks");
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
});

test("narrow viewport keeps join keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/groups/soder-sparks");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const joinGroup = page.getByRole("button", { name: "Join group" });
  await joinGroup.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement;
    return active instanceof HTMLElement && document.querySelector("dialog")?.contains(active);
  })).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(joinGroup).toBeFocused();
});
