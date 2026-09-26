import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://dawenli-green.vercel.app',
    trace: 'retain-on-failure',
    channel: 'chrome',
    ...devices['Desktop Chrome'],
  },
  reporter: [['list']],
});
