import { expect, test, type Page } from "@playwright/test";

const email = () => `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

async function register(page: Page, name: string, mail = email()) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(mail);
  await page.getByLabel(/^Password/).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  return mail;
}

async function addAddress(page: Page, name: string) {
  await page.getByRole("button", { name: "+ Add new address" }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Phone").fill("9876543210");
  await page.getByLabel("Address line 1").fill("21 Park Street");
  await page.getByLabel("City").fill("Kolkata");
  await page.getByLabel("State").fill("West Bengal");
  await page.getByLabel("Postal code").fill("700016");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("21 Park Street")).toBeVisible();
}

test("customer journey: wishlist, cart, coupon, address, COD checkout, tracking, review", async ({ page }) => {
  const review = `My son loves this castle set! ${Date.now()}`;
  await register(page, "Asha Verma");

  await page.goto("/products/mega-brick-castle-500pc");
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  await page.goto("/wishlist");
  await expect(page.getByText("Mega Brick Castle 500pc")).toBeVisible();

  await page.goto("/products/mega-brick-castle-500pc");
  await page.getByRole("button", { name: "800 pcs" }).click();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.goto("/cart");
  await expect(page.getByText("Option: 800 pcs")).toBeVisible();
  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/WELCOME10/).first()).toBeVisible();
  await page.getByRole("link", { name: "Proceed to checkout" }).click();

  await addAddress(page, "Asha Verma");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByRole("heading", { name: /Your order is placed/ })).toBeVisible();
  await expect(page.getByText("Order tracking")).toBeVisible();

  await page.goto("/account/orders");
  await expect(page.getByText(/^#LT/)).toBeVisible();

  await page.goto("/products/mega-brick-castle-500pc");
  await page.getByRole("button", { name: "5 stars" }).click();
  await page.getByPlaceholder("What did your child think?").fill(review);
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByRole("article").getByText(review)).toBeVisible();
});

test("online payment via sandbox gateway confirms the order", async ({ page }) => {
  await register(page, "Rohan Das");
  await page.goto("/products/junior-football-size-3");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.goto("/checkout");
  await addAddress(page, "Rohan Das");
  await page.getByText("Pay online").click();
  await page.getByRole("button", { name: /^Pay ₹/ }).click();
  await expect(page.getByRole("heading", { name: "Test payment gateway" })).toBeVisible();
  await page.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(page.getByRole("heading", { name: /Your order is placed/ })).toBeVisible();
});

test("password reset flow", async ({ page }) => {
  const mail = await register(page, "Meena Iyer");
  await page.context().clearCookies();
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(mail);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page.getByRole("link", { name: "Reset password" }).click();
  await page.getByLabel(/^New password/).fill("newpassword456");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Your password has been updated.")).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(mail);
  await page.getByLabel("Password", { exact: true }).fill("newpassword456");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account/);
});
