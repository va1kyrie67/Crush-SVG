import { test, expect } from "@playwright/test";

test.describe("Use Cases index", () => {
  test("loads for a guest and lists use cases", async ({ page }) => {
    await page.goto("/use-case");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("link", { name: /View Use Case/ }).first()).toBeVisible();
  });

  test("navbar link is active on the index and a child page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Desktop navbar links collapse into drawer on mobile viewports");
    await page.goto("/use-case");
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Use Cases" })).toHaveClass(/text-brand-primary/);
    await page.goto("/use-case/svg-to-png-for-react");
    await expect(nav.getByRole("link", { name: "Use Cases" })).toHaveClass(/text-brand-primary/);
    await expect(nav.getByRole("link", { name: "Blog" })).not.toHaveClass(/font-bold/);
  });

  test("category pill filters and All restores", async ({ page }) => {
    await page.goto("/use-case");
    const cards = page.getByRole("link", { name: /View Use Case/ });
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();
    expect(total).toBe(18);

    await page.getByRole("button", { name: "Email", exact: true }).click();
    await expect(cards).toHaveCount(1);

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(cards).toHaveCount(total);
  });

  test("card navigates directly to its use case page", async ({ page }) => {
    await page.goto("/use-case");
    const firstCard = page.getByRole("link", { name: /View Use Case/ }).first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), { timeout: 15000 });
    }
  });

  test("localized route renders", async ({ page }) => {
    const res = await page.goto("/de/use-case");
    expect(res?.status()).toBe(200);
  });
});
