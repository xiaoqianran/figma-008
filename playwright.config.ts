import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for CARGO Figma replica (2026 best practices)
 * - Functional tests run against Vite dev server (fast)
 * - Visual tests can later target `npm run preview` for stable rendering
 * - Uses web-first assertions, traces on retry, data-testid convention
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  // Auto-start Vite dev server for tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers in CI if desired
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Visual regression (future dedicated project)
  snapshotDir: './e2e/snapshots',
});
