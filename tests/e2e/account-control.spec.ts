import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { prisma, resetDomainData } from "../integration/database";
import { seedGroups } from "@/modules/groups/seed-groups";

function accountEmail(testId: string) {
  return `account-control-${testId.replace(/[^a-z0-9]/gi, "")}@example.test`;
}

test.beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
});

test.afterEach(async ({}, testInfo) => {
  await prisma.user.deleteMany({ where: { email: accountEmail(testInfo.testId) } });
});

test("shows account details after sign-up and returns to Sign in after sign-out", async ({ page }) => {
  const email = accountEmail(test.info().testId);
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
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/sign-up");

    const card = page.locator(".auth-page__card");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(16);
    expect(width - (box!.x + box!.width)).toBeGreaterThanOrEqual(16);
    expect((await new AxeBuilder({ page }).include(".auth-page").analyze()).violations).toEqual([]);
  }

  await page.setViewportSize({ width: 390, height: 844 });

  const email = accountEmail(test.info().testId);
  await page.getByLabel(/name/i).fill("Ada Runner");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);
  await page.getByRole("button", { name: /open account menu/i }).click();
  const accountDetails = page.getByLabel("Account details");
  await expect(accountDetails).toBeVisible();
  await expect(accountDetails).toContainText("Ada Runner");
  await expect(accountDetails).toContainText(email);
  const detailsBox = await accountDetails.boundingBox();
  const avatarBox = await page.getByRole("button", { name: /open account menu/i }).boundingBox();
  expect(detailsBox).not.toBeNull();
  expect(avatarBox).not.toBeNull();
  expect(detailsBox!.x).toBeGreaterThanOrEqual(16);
  expect(390 - (detailsBox!.x + detailsBox!.width)).toBeGreaterThanOrEqual(16);
  expect(Math.abs(detailsBox!.x + detailsBox!.width - (avatarBox!.x + avatarBox!.width))).toBeLessThanOrEqual(1);
  expect((await new AxeBuilder({ page }).include(".account-control").analyze()).violations).toEqual([]);
});
