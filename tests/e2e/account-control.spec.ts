import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetDomainData } from "../integration/database";
import { seedGroups } from "@/modules/groups/seed-groups";

test.beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

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

test("keeps the sign-up card within a narrow viewport and has no axe violations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sign-up");

  const card = page.locator(".auth-page__card");
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(16);
  expect(390 - (box!.x + box!.width)).toBeGreaterThanOrEqual(16);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const email = `account-control-narrow-${Date.now()}@example.test`;
  await page.getByLabel(/name/i).fill("Ada Runner");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);
  await page.getByRole("button", { name: /open account menu/i }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
