import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/manager.json'

setup('authenticate as manager', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Fill email field
  const emailInput = page.locator('input[type="email"]')
  await emailInput.waitFor({ state: 'visible' })
  await emailInput.fill('contact@brunomoyse.be')

  // Fill password field
  await page.locator('input[type="password"]').fill('admin')

  // Check "remember me": the session only reaches localStorage (which
  // storageState captures) for remembered logins - plain logins live in
  // sessionStorage, which Playwright does not persist.
  await page.locator('input.remember-checkbox').check({ force: true })

  // Submit the login form
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 15_000 })
  await expect(page.locator('h1')).toContainText('PocketPair')

  // Save storage state for reuse
  await page.context().storageState({ path: authFile })
})
