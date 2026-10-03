import { expect, test } from "@playwright/test";

test("homepage renders hero, categories and product sections without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shop by Category" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured Toys" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Educational Toys/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("no horizontal scrolling on key pages", async ({ page }) => {
  for (const url of ["/", "/products", "/products/mega-brick-castle-500pc", "/cart", "/login"]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${url}`).toBeLessThanOrEqual(1);
  }
});

test("catalog: filter by category, load more and search", async ({ page }) => {
  await page.goto("/products?category=dolls");
  await expect(page.getByRole("heading", { name: "Dolls", level: 1 })).toBeVisible();
  await page.goto("/products");
  await expect(page.getByRole("button", { name: "Load more toys" })).toBeVisible();
  await page.getByRole("button", { name: "Load more toys" }).click();
  await expect(page.getByRole("link", { name: /Memory Match Cards|Birthday Surprise|Strategy Chess/ }).first()).toBeVisible();
  await page.goto("/products?q=castle");
  await expect(page.getByText("Mega Brick Castle 500pc").first()).toBeVisible();
  await page.goto("/products?minPrice=300&maxPrice=500&rating=4.5&inStock=true");
  await expect(page.getByText(/toys? found/)).toBeVisible();
});

test("product page has variants, SEO metadata and structured data", async ({ page, request }) => {
  await page.goto("/products/mega-brick-castle-500pc");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mega Brick Castle 500pc");
  await expect(page.getByRole("button", { name: "800 pcs" })).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("Product");
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain("/products/mega-brick-castle-500pc");
  for (const path of ["/robots.txt", "/sitemap.xml"]) expect((await request.get(path)).ok()).toBeTruthy();
  const headers = (await request.get("/")).headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect((await request.get("/products/does-not-exist")).status()).toBe(404);
});

test("cross-site API writes are blocked and private APIs reject anonymous access", async ({ request }) => {
  const r = await request.post("/api/auth/login", { headers: { origin: "https://evil.example" }, data: { email: "a@b.co", password: "x" } });
  expect(r.status()).toBe(403);
  expect((await request.get("/api/orders")).status()).toBe(401);
  expect((await request.get("/api/admin/stats")).status()).toBe(401);
});
