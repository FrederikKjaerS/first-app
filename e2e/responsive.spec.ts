import { test, expect, Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "small-phone", width: 320, height: 568 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-14-max", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-4k", width: 2560, height: 1440 },
];

async function noHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    result.scrollWidth,
    `horizontal overflow: scrollWidth(${result.scrollWidth}) > clientWidth(${result.clientWidth})`,
  ).toBeLessThanOrEqual(result.clientWidth);
}

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow — ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await noHorizontalOverflow(page);
  });
}

test("phone — chip row scrolls horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const chips = page.locator(".chips");
  await expect(chips).toBeVisible();

  const box = await chips.boundingBox();
  expect(box).not.toBeNull();
  // chips container must not exceed viewport width
  expect(box!.width).toBeLessThanOrEqual(390 + 1);

  // chips content overflows → scrollable
  const scrollable = await chips.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(scrollable).toBe(true);
});

test("phone — recipe cards render as horizontal rows", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const firstCard = page.locator(".card").first();
  await expect(firstCard).toBeVisible();

  // Card should be wider than tall (horizontal row layout)
  const box = await firstCard.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(box!.height);
});

test("phone — tab bar is visible at bottom", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".tabbar")).toBeVisible();
});

test("desktop — tab bar is hidden, header nav is visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".tabbar")).toBeHidden();
  await expect(page.locator(".nav")).toBeVisible();
});

test("desktop — recipe grid renders multiple columns", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator(".card");
  await expect(cards.first()).toBeVisible();

  // At least two cards should be on the same row (same y position)
  const boxes = await cards.evaluateAll((els) =>
    els.slice(0, 6).map((el) => el.getBoundingClientRect().y),
  );
  const uniqueRows = new Set(boxes.map((y) => Math.round(y)));
  expect(uniqueRows.size).toBeGreaterThan(1);
});

test("tablet — recipe grid renders multiple columns", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator(".card");
  await expect(cards.first()).toBeVisible();

  const boxes = await cards.evaluateAll((els) =>
    els.slice(0, 4).map((el) => el.getBoundingClientRect().y),
  );
  const uniqueRows = new Set(boxes.map((y) => Math.round(y)));
  expect(uniqueRows.size).toBeGreaterThan(1);
});

test("hero actions stack vertically on phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const buttons = page.locator(".hero-actions .btn");
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(2);

  const boxes = await buttons.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()),
  );
  // All buttons should be on different rows (stacked)
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y);
  }
});

test("week planner page has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/uge");
  await page.waitForLoadState("networkidle");
  await noHorizontalOverflow(page);
});
