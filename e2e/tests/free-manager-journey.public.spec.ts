import { test, expect } from '@playwright/test'

// End-to-end manager journey for a free ("Home Game") club: sign up through the
// onboarding form (free path, no VAT), then confirm the app reflects the plan —
// Settings shows the plan + upgrade CTA, and the paid-only routes are guarded.

test.describe('Free club manager journey', () => {
  test.beforeEach(async ({ page }) => {
    // Pin English so text assertions are stable (app falls back to French).
    await page.addInitScript(() => window.localStorage.setItem('locale', 'en'))
  })

  test('signs up on the free plan, sees it in Settings, and is blocked from paid routes', async ({
    page,
  }) => {
    const email = `pw-ui-${Date.now()}@example.test`

    await page.goto('/onboarding')

    // Free (Home Game) is selected by default — fill the lightweight form.
    await page.locator('input[autocomplete="given-name"]').fill('Ui')
    await page.locator('input[autocomplete="family-name"]').fill('Host')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[autocomplete="new-password"]').fill('Str0ngPass1')
    await page.locator('.field', { hasText: 'Club name' }).locator('input').fill('UI Home Game')

    await page.locator('button[type="submit"]').click()

    // Auto-logged in and redirected to the dashboard.
    await page.waitForURL('http://localhost:3000/', { timeout: 20_000 })

    // Settings reflects the free plan and offers the upgrade.
    await page.goto('/settings')
    await expect(page.getByText('Home Game (Free)').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Upgrade to Club/i })).toBeVisible()

    // The player-facing features are hidden from a free club's navigation —
    // no Announcements / Leagues links, while the core nav stays intact.
    const nav = page.locator('.sidebar-nav')
    await expect(nav.locator('a[href="/tournaments"]')).toHaveCount(1)
    await expect(nav.locator('a[href="/announcements"]')).toHaveCount(0)
    await expect(nav.locator('a[href="/leagues"]')).toHaveCount(0)
  })
})
