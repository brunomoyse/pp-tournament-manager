import { test as setup } from '@playwright/test'

import { AUTH_FILE, MANAGER_CREDENTIALS } from './helpers'

setup('authenticate as manager', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Fill email field
  const emailInput = page.locator('input[type="email"]')
  await emailInput.waitFor({ state: 'visible' })
  await emailInput.fill(MANAGER_CREDENTIALS.email)

  // Fill password field
  await page.locator('input[type="password"]').fill(MANAGER_CREDENTIALS.password)

  // Check "remember me": the session only reaches localStorage (which
  // storageState captures) for remembered logins - plain logins live in
  // sessionStorage, which Playwright does not persist.
  await page.locator('input.remember-checkbox').check({ force: true })

  // Submit the login form
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to the dashboard — the auth guard only lets us off /login
  // once authenticated, so reaching '/' already proves login succeeded.
  await page.waitForURL('/', { timeout: 15_000 })

  // Confirm the remembered session persisted before capturing state. This is
  // locale-independent (the old `h1` contains a localized greeting, not a stable
  // string) and guarantees the token is in localStorage for storageState.
  await page.waitForFunction(() => window.localStorage.getItem('auth-backup') !== null, null, {
    timeout: 10_000,
  })

  // Save storage state for reuse
  await page.context().storageState({ path: AUTH_FILE })
})
