import { expect, test } from "@playwright/test";
import { prisma, resetDomainData } from "../integration/database";
import { seedGroups } from "@/modules/groups/seed-groups";

const email = "group-creation@example.test";
const groupName = "Friday Football Test";

test.beforeEach(async () => {
  await resetDomainData();
  await seedGroups();
  await prisma.user.deleteMany({ where: { email } });
});

test.afterEach(async () => {
  await prisma.group.deleteMany({ where: { name: groupName } });
  await prisma.user.deleteMany({ where: { email } });
});

test("creates a recurring men-only group and displays its rhythm on the profile", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel(/name/i).fill("Test Organizer");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("long-enough-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL(/\/$/);

  await page.goto("/groups/new");
  await page.getByLabel("Group name").fill(groupName);
  await page.getByLabel("Sport").selectOption("Football");
  await page.getByLabel("City").fill("Stockholm");
  await page.getByLabel("Who can join?").selectOption("MEN_ONLY");
  await page.getByRole("checkbox", { name: /recurring schedule/i }).check();
  await page.getByLabel("Schedule rhythm").fill("Every Friday at 18:30");
  await page.getByLabel("Description").fill("A welcoming weekly five-a-side group.");
  await page.getByRole("button", { name: "Create group" }).click();

  await page.waitForURL(/\/groups\/friday-football-test-/);
  await expect(page.getByRole("heading", { name: groupName })).toBeVisible();
  await expect(page.getByText("Men only", { exact: true })).toBeVisible();
  await expect(page.getByText("Every Friday at 18:30", { exact: true })).toBeVisible();
});
