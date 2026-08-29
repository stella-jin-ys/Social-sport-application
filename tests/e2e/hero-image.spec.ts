import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`keeps the shared hero image centered in a 16:10 frame at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const frame = page.locator("[data-hero-frame]");
    const image = page.getByRole("img", { name: /women playing floorball/i });
    const box = await frame.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width / box!.height).toBeCloseTo(1.6, 1);
    await expect(image).toHaveAttribute("src", /sports-community-hero\.png/);
    expect(await image.evaluate((element) => getComputedStyle(element).objectPosition)).toBe("50% 50%");
    await expect(page.locator("[data-hero-filter]")).toHaveCount(0);
    await expect(page.getByText("Tonight in Stockholm")).toBeVisible();
    await expect(page.getByText("Next session")).toBeVisible();
  });
}
