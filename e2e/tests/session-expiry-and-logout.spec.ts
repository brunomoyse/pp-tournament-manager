import { test, expect } from '@playwright/test'

import { MANAGER_CREDENTIALS, newManagerContext } from './helpers'

/**
 * Auth guard behaviour: an expired/cleared session must bounce protected routes
 * to /login (preserving the intended destination), re-login must land back on
 * the dashboard, and the explicit Logout control must end the session.
 *
 * The session lives in sessionStorage plus a remembered-login localStorage
 * backup (`auth-backup`); clearing both simulates an expired JWT that the
 * app can no longer silently restore.
 */

test.describe.serial('Session expiry and logout', () => {
  test('a cleared session redirects a protected route to /login', async ({ browser }) => {
    const page = await (await newManagerContext(browser)).newPage()

    // Authenticated to start with.
    await page.goto('/')
    await expect(page.locator('h1.page-title')).toBeVisible()

    // Simulate expiry: drop the persisted session and its remembered backup so
    // the app's initialize() can't restore it.
    await page.evaluate(() => {
      sessionStorage.clear()
      localStorage.removeItem('auth-backup')
    })

    // A protected route now bounces to /login, carrying the intended path.
    await page.goto('/tournaments')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/redirect=/)

    await page.close()
  })

  test('re-login from the login page restores access', async ({ browser }) => {
    const page = await (await newManagerContext(browser)).newPage()

    // Land on an app origin first — storage APIs are denied on about:blank.
    await page.goto('/')
    await page.evaluate(() => {
      sessionStorage.clear()
      localStorage.removeItem('auth-backup')
    })
    await page.goto('/login')

    await page.locator('input[type="email"]').fill(MANAGER_CREDENTIALS.email)
    await page.locator('input[type="password"]').fill(MANAGER_CREDENTIALS.password)
    await page.locator('input.remember-checkbox').check({ force: true })
    await page.locator('button[type="submit"]').click()

    await page.waitForURL('/', { timeout: 15_000 })
    await expect(page.locator('h1')).toContainText('PocketPair')

    await page.close()
  })

  test('the Logout control ends the session', async ({ browser }) => {
    const page = await (await newManagerContext(browser)).newPage()

    await page.goto('/')
    await expect(page.locator('h1.page-title')).toBeVisible()

    await page.locator('button.logout-button').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

    // And the guard holds: a protected route stays on /login.
    await page.goto('/tournaments')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

    await page.close()
  })
})
