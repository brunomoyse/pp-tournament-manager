import { test, expect } from '@playwright/test'

import { getByTestId } from './helpers'

// What a brand-new club owner actually sees on day one, exercised against the
// beta signup path (Club is the only selectable plan).
//
// This file exists because nothing covered the first-run experience end to end,
// which is how the "No Club Found" bug survived: broadcastAuth() posted a Vue
// reactive Proxy over a BroadcastChannel, and the DataCloneError aborted
// storeAuthState before register() could select the new club.

test.describe('New club onboarding (public)', () => {
  test.beforeEach(async ({ page }) => {
    // Pin English so text assertions are stable (app falls back to French).
    await page.addInitScript(() => window.localStorage.setItem('locale', 'en'))
  })

  /** Sign up a fresh club and land on the dashboard. Returns the email used. */
  async function signUp(page: import('@playwright/test').Page, tag: string) {
    const email = `pw-${tag}-${Date.now()}@example.test`
    await page.goto('/onboarding')
    await page.locator('input[autocomplete="given-name"]').fill('Ui')
    await page.locator('input[autocomplete="family-name"]').fill('Owner')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[autocomplete="new-password"]').fill('Str0ngPass1')
    await page.locator('.field', { hasText: 'Club name' }).locator('input').fill('UI Test Club')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('http://localhost:3000/', { timeout: 20_000 })
    return email
  }

  /** Dismiss the onboarding welcome modal the dashboard opens with. */
  async function skipWelcome(page: import('@playwright/test').Page) {
    await expect(page.getByText('Welcome to PocketPair')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Skip for now/i }).click()
  }

  test('the dashboard opens on the setup guide, not a wall of zeros', async ({ page }) => {
    await signUp(page, 'onboarding')

    // The club is selected by the time the dashboard mounts, so the tour starts
    // instead of the "No Club Found" alert.
    await skipWelcome(page)

    // Setup guide: four outcome-based items, none of them done yet.
    await expect(page.getByText('0/4')).toBeVisible()
    await expect(page.getByText('Invite your team')).toBeVisible()
    await expect(page.getByText('Run a tournament')).toBeVisible()

    // Team is a first-class destination, not buried in Settings.
    await expect(page.locator('.sidebar-nav').locator('a[href="/team"]')).toHaveCount(1)

    // The stat tiles stay hidden until there is something to count.
    await expect(page.locator('.stats-grid')).toHaveCount(0)

    // The empty tournaments list offers a way out of itself.
    await page.goto('/tournaments')
    await expect(
      page.locator('.pp-empty-state').getByRole('button', { name: /Create Tournament/i }),
    ).toBeVisible()
  })

  test('a fresh club can reach a creatable tournament form', async ({ page }) => {
    await signUp(page, 'creatable')
    await skipWelcome(page)

    await page.goto('/tournaments')
    await page
      .locator('.pp-empty-state')
      .getByRole('button', { name: /Create Tournament/i })
      .click()

    // The seeded blind structures (after_insert_club_seed_templates in
    // pp-service) must give the required dropdown real options, or a new club
    // cannot create a tournament at all.
    const templateSelect = getByTestId(page, 'template-select')
    await expect(templateSelect).toBeVisible()
    await expect(templateSelect.locator('option:not([disabled])')).not.toHaveCount(0)
  })
})
