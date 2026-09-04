# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/new-club-onboarding.public.spec.ts >> New club onboarding (public) >> the dashboard opens on the setup guide, not a wall of zeros
- Location: e2e/tests/new-club-onboarding.public.spec.ts:39:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/onboarding", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | import { getByTestId } from './helpers'
  4  | 
  5  | // What a brand-new club owner actually sees on day one, exercised against the
  6  | // beta signup path (Club is the only selectable plan).
  7  | //
  8  | // This file exists because nothing covered the first-run experience end to end,
  9  | // which is how the "No Club Found" bug survived: broadcastAuth() posted a Vue
  10 | // reactive Proxy over a BroadcastChannel, and the DataCloneError aborted
  11 | // storeAuthState before register() could select the new club.
  12 | 
  13 | test.describe('New club onboarding (public)', () => {
  14 |   test.beforeEach(async ({ page }) => {
  15 |     // Pin English so text assertions are stable (app falls back to French).
  16 |     await page.addInitScript(() => window.localStorage.setItem('locale', 'en'))
  17 |   })
  18 | 
  19 |   /** Sign up a fresh club and land on the dashboard. Returns the email used. */
  20 |   async function signUp(page: import('@playwright/test').Page, tag: string) {
  21 |     const email = `pw-${tag}-${Date.now()}@example.test`
> 22 |     await page.goto('/onboarding')
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  23 |     await page.locator('input[autocomplete="given-name"]').fill('Ui')
  24 |     await page.locator('input[autocomplete="family-name"]').fill('Owner')
  25 |     await page.locator('input[type="email"]').fill(email)
  26 |     await page.locator('input[autocomplete="new-password"]').fill('Str0ngPass1')
  27 |     await page.locator('.field', { hasText: 'Club name' }).locator('input').fill('UI Test Club')
  28 |     await page.locator('button[type="submit"]').click()
  29 |     await page.waitForURL('http://localhost:3000/', { timeout: 20_000 })
  30 |     return email
  31 |   }
  32 | 
  33 |   /** Dismiss the onboarding welcome modal the dashboard opens with. */
  34 |   async function skipWelcome(page: import('@playwright/test').Page) {
  35 |     await expect(page.getByText('Welcome to PocketPair')).toBeVisible({ timeout: 15_000 })
  36 |     await page.getByRole('button', { name: /Skip for now/i }).click()
  37 |   }
  38 | 
  39 |   test('the dashboard opens on the setup guide, not a wall of zeros', async ({ page }) => {
  40 |     await signUp(page, 'onboarding')
  41 | 
  42 |     // The club is selected by the time the dashboard mounts, so the tour starts
  43 |     // instead of the "No Club Found" alert.
  44 |     await skipWelcome(page)
  45 | 
  46 |     // Setup guide: four outcome-based items, none of them done yet.
  47 |     await expect(page.getByText('0/4')).toBeVisible()
  48 |     await expect(page.getByText('Invite your team')).toBeVisible()
  49 |     await expect(page.getByText('Run a tournament')).toBeVisible()
  50 | 
  51 |     // Team is a first-class destination, not buried in Settings.
  52 |     await expect(page.locator('.sidebar-nav').locator('a[href="/team"]')).toHaveCount(1)
  53 | 
  54 |     // The stat tiles stay hidden until there is something to count.
  55 |     await expect(page.locator('.stats-grid')).toHaveCount(0)
  56 | 
  57 |     // The empty tournaments list offers a way out of itself.
  58 |     await page.goto('/tournaments')
  59 |     await expect(
  60 |       page.locator('.pp-empty-state').getByRole('button', { name: /Create Tournament/i }),
  61 |     ).toBeVisible()
  62 |   })
  63 | 
  64 |   test('a fresh club can reach a creatable tournament form', async ({ page }) => {
  65 |     await signUp(page, 'creatable')
  66 |     await skipWelcome(page)
  67 | 
  68 |     await page.goto('/tournaments')
  69 |     await page
  70 |       .locator('.pp-empty-state')
  71 |       .getByRole('button', { name: /Create Tournament/i })
  72 |       .click()
  73 | 
  74 |     // The seeded blind structures (after_insert_club_seed_templates in
  75 |     // pp-service) must give the required dropdown real options, or a new club
  76 |     // cannot create a tournament at all.
  77 |     const templateSelect = getByTestId(page, 'template-select')
  78 |     await expect(templateSelect).toBeVisible()
  79 |     await expect(templateSelect.locator('option:not([disabled])')).not.toHaveCount(0)
  80 |   })
  81 | })
  82 | 
```