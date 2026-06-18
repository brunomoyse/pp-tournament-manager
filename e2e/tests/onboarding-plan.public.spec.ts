import { test, expect } from '@playwright/test'

// Public (unauthenticated) onboarding flow: the plan picker must offer Home Game
// (free) vs Club, and the free path must hide the VAT / legal-entity fields that
// only the paid Club path needs.

test.describe('Onboarding — plan choice (public)', () => {
  test.beforeEach(async ({ page }) => {
    // Pin English so text assertions are stable (app falls back to French).
    await page.addInitScript(() => window.localStorage.setItem('locale', 'en'))
  })

  test('offers both plans; Home Game hides VAT, Club reveals it', async ({ page }) => {
    await page.goto('/onboarding')

    const freeCard = page.getByRole('radio', { name: /Home Game/i })
    const clubCard = page.getByRole('radio', { name: /Club/i })
    await expect(freeCard).toBeVisible()
    await expect(clubCard).toBeVisible()

    // Free is the default → no VAT field.
    await expect(page.getByText('VAT number', { exact: false })).toHaveCount(0)

    // Choosing Club reveals the VAT field.
    await clubCard.click()
    await expect(page.getByText('VAT number', { exact: false })).toBeVisible()

    // Switching back to Home Game hides it again.
    await freeCard.click()
    await expect(page.getByText('VAT number', { exact: false })).toHaveCount(0)
  })
})
