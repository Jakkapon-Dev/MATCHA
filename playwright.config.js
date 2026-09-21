import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for MatchA
 * Strictly isolates test environment from Production.
 * Retains trace, screenshots, and video on failure.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 35000,
  expect: {
    timeout: 7000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
