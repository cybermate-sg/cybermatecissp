import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests in sequence for CRUD operations
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker for database consistency
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project - runs first to authenticate
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Guest tests - no authentication required
    {
      name: 'guest',
      use: {
        ...devices['Desktop Chrome'],
        // No storage state - fresh browser context
      },
      testMatch: /.*guest.*\.spec\.ts/,
      // No dependencies - runs without authentication
    },
    // Authenticated tests - depend on setup being complete
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use signed-in state from setup
        storageState: 'playwright/.auth/user.json',
      },
      testIgnore: /.*guest.*\.spec\.ts/, // Don't run guest tests in authenticated mode
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
