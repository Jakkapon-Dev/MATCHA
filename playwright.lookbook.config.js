import { defineConfig, devices } from '@playwright/test';

// The lookbook gallery can be checked without a database or checkout backend.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'lookbook-responsive.spec.js',
  timeout: 35000,
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5175' },
  webServer: {
    command: 'npm run dev --prefix frontend -- --host 127.0.0.1 --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175/lookbook',
    reuseExistingServer: false,
    timeout: 60000
  }
});
