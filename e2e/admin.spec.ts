import { expect, test, type Page } from "@playwright/test";

async function adminLogin(page: Page) {
  await page.goto("/login?next=/admin");
  await page.getByLabel("Email", { exact: true }).fill("owner@e2e.test");
  await page.getByLabel("Password", { exact: true }).fill("OwnerPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test("customers cannot open the admin area", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Plain Customer");
  await page.getByLabel("Email", { exact: true }).fill(`plain_${Date.now()}@example.com`);
  await page.getByLabel(/^Password/).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admins only" })).toBeVisible();
});

test("admin: dashboard, add product (visible on storefront), coupon, and every section loads", async ({ page }) => {
  const stamp = Date.now(), toy = `E2E Rocket ${stamp}`, code = `E2E${String(stamp).slice(-6)}`;
  await adminLogin(page);
  await expect(page.getByText("Total sales")).toBeVisible();

  await page.goto("/admin/products");
  await page.getByRole("button", { name: "+ Add product" }).click();
  await page.getByLabel("Name").fill(toy);
  await page.getByLabel("Price (₹)").fill("1500");
  await page.getByLabel("Discount (%)").fill("20");
  await page.getByLabel("Stock", { exact: true }).fill("7");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText(toy)).toBeVisible();

  await page.goto(`/products?q=${stamp}`);
  await expect(page.getByText(toy).first()).toBeVisible();
  await expect(page.getByText("₹1,200").first()).toBeVisible();

  await page.goto("/admin/coupons");
  await page.getByRole("button", { name: "+ Add coupon" }).click();
  await page.getByLabel("Code").fill(code);
  await page.getByLabel("Value", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(code)).toBeVisible();

  for (const [path, heading] of [["/admin/orders", "Orders"], ["/admin/customers", "Customers"], ["/admin/inventory", "Inventory"], ["/admin/categories", "Categories"], ["/admin/brands", "Brands"], ["/admin/banners", "Banners"], ["/admin/reviews", "Review moderation"], ["/admin/payments", "Payments"], ["/admin/analytics", "Sales analytics"], ["/admin/notifications", "Notifications"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
});
