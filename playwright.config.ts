import { defineConfig, devices } from "@playwright/test";

const e2ePort = 4177;
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: e2eOrigin,
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${e2ePort} --strictPort`,
    url: e2eOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
