import { expect, test } from "@playwright/test";

test("desktop header gives the middle navigation a centered, usable lane", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const navigation = page.getByRole("navigation");
  const menu = navigation.locator(".main-nav__menu");
  const navigationBox = await navigation.boundingBox();
  const menuBox = await menu.boundingBox();

  expect(navigationBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.width).toBeGreaterThanOrEqual(480);
  expect(
    Math.abs(
      menuBox!.x + menuBox!.width / 2 -
        (navigationBox!.x + navigationBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
});
