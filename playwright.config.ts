import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3101",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `"${process.execPath}" node_modules/next/dist/bin/next dev --webpack --port 3101`,
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: {
      ...process.env,
      BETTER_AUTH_URL: "http://localhost:3101",
      BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3101,http://127.0.0.1:3101",
    },
  },
});
