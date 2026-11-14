import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { E2E_UPLOAD_DIR } from "./e2e/support/paths";

if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// The app under test uses the test database and a throwaway upload folder,
// and builds into its own folder so it never clashes with `npm run dev`.
const appEnv = {
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
  UPLOAD_DIR: E2E_UPLOAD_DIR,
  NEXT_DIST_DIR: ".next-e2e",
  AUTH_URL: baseURL,
};

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Signs in once per role through the real sign-in page and saves the sessions.
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /journey\.spec\.ts$/,
    },
    // The full journey adds data of its own, so it runs after every other test.
    {
      name: "journey",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["chromium"],
      testMatch: /journey\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    env: appEnv,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
