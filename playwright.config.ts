import { defineConfig, devices } from "@playwright/test";

const PORT = 3113;
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: external || `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: external ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { AUTH_SECRET: "e2e-secret", ADMIN_EMAIL: "owner@e2e.test", ADMIN_PASSWORD: "OwnerPass123!", ALLOW_SANDBOX_PAYMENTS: "true", ALLOW_DEV_RESET_LINK: "true" },
  },
});
