import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './playwright-report' }]],

  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project: authenticate and save storage state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main tests: reuse authenticated state
    {
      name: 'chromium',
      testIgnore: [/.*\.api\.spec\.ts/, /.*\.public\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/manager.json',
      },
      dependencies: ['setup'],
    },

    // Tiering checks run independently of the manager login.
    // GraphQL-level: free-tier limits + player-app exclusion.
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
    },
    // Public UI: the onboarding plan picker (no auth — onboarding is public).
    {
      name: 'public',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
