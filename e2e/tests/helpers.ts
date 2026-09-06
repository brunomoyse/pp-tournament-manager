import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

/**
 * Shared e2e helpers.
 *
 * The whole point of this file: keep the reusable lifecycle steps and the
 * stable-selector conventions in ONE place. When a component is redesigned we
 * update the `data-testid` here (or in the component) instead of chasing text
 * and CSS classes across a dozen specs — which is exactly the breakage that
 * motivated this suite.
 *
 * Selector policy:
 *  - Prefer `getByTestId()` (the `data-testid` hooks added to shared primitives
 *    PpButton/PpModal and the per-page anchors).
 *  - Fall back to role/text only for content the app renders from i18n and that
 *    no test ID covers (status labels, confirm dialogs).
 */

export const AUTH_FILE = 'e2e/.auth/manager.json'

export const MANAGER_CREDENTIALS = {
  email: 'contact@brunomoyse.be',
  password: 'admin',
}

export type TournamentTab = 'overview' | 'clock' | 'players' | 'seating' | 'settings'

/** Locate an element by its stable `data-testid`. */
export function getByTestId(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"]`)
}

/**
 * Build an authenticated context with English locale pinned and the onboarding
 * tour pre-dismissed (its welcome modal otherwise covers the dashboard and
 * blocks every click on a fresh profile).
 */
export async function newManagerContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ storageState: AUTH_FILE })
  await context.addInitScript(() => window.localStorage.setItem('locale', 'en'))
  await context.addCookies([
    {
      name: 'tour',
      value: encodeURIComponent(
        JSON.stringify({
          hasSeenWelcome: true,
          tourCompleted: true,
          checklistDismissed: true,
          hasAddedPlayer: true,
        }),
      ),
      domain: 'localhost',
      path: '/',
    },
  ])
  return context
}

/** Switch tournament-detail tabs via the stable `tab-<value>` hooks. */
export async function switchTab(page: Page, tab: TournamentTab): Promise<void> {
  await getByTestId(page, `tab-${tab}`).click()
}

/**
 * The register/create-player dialog, scoped by its i18n title so unrelated
 * dialogs in the DOM don't match. The title text is stable enough (and no
 * test ID distinguishes dialogs by purpose yet).
 */
export function registerDialog(page: Page) {
  return page
    .locator('[role="dialog"]')
    .filter({ has: page.locator('.pp-modal-title', { hasText: 'Register Player' }) })
}

/** A player's row in the tournament players table, matched by name. */
export function playerRow(page: Page, name: string) {
  return getByTestId(page, 'player-row').filter({ hasText: name })
}

/**
 * Create a tournament from the dashboard and open its detail page.
 * Returns the tournament name so the caller can assert against it later.
 */
export async function createAndOpenTournament(page: Page, name: string): Promise<string> {
  await page.goto('/')
  await expect(page.locator('h1.page-title')).toBeVisible()

  await page.getByText('Create Tournament', { exact: false }).first().click()

  const modal = page.locator('[role="dialog"]').first()
  await expect(modal).toBeVisible()
  await expect(modal.locator('h2')).toContainText('Create Tournament')

  await modal.locator('input[type="text"]').first().fill(name)

  const startTime = new Date(Date.now() + 60 * 60 * 1000)
  await modal.locator('input[type="datetime-local"]').fill(startTime.toISOString().slice(0, 16))

  const numberInputs = modal.locator('input[type="number"]')
  await numberInputs.first().fill('25') // buy-in EUR
  await numberInputs.nth(1).fill('18') // seat cap

  const templateSelect = modal.locator('select')
  await templateSelect.waitFor({ state: 'visible' })
  await expect(templateSelect.locator('option').nth(1)).toBeAttached({ timeout: 10_000 })
  const firstOptionValue = await templateSelect.locator('option').nth(1).getAttribute('value')
  if (firstOptionValue) await templateSelect.selectOption(firstOptionValue)

  await modal.locator('button[type="submit"]').click()
  await expect(modal).toBeHidden({ timeout: 15_000 })

  // The list refetches right after creation; a click can land on a card node
  // Vue is about to replace and get swallowed. Retry click-then-navigate.
  await expect(async () => {
    await page.getByText(name).first().click()
    await expect(page).toHaveURL(/\/tournament\//, { timeout: 3_000 })
  }).toPass({ timeout: 20_000 })
  await expect(getByTestId(page, 'tab-overview')).toBeVisible({ timeout: 10_000 })

  return name
}

/** Link up to `max` club tables to the currently open tournament. */
export async function linkTables(page: Page, max = 2): Promise<void> {
  await switchTab(page, 'seating')
  await expect(page.getByText('Table Management', { exact: false })).toBeVisible({
    timeout: 10_000,
  })

  await page.getByText('Link Table(s)', { exact: false }).first().click()

  const modal = page.locator('[role="dialog"]').first()
  await expect(modal).toBeVisible()
  await expect(modal.locator('input[type="checkbox"]').first()).toBeVisible({ timeout: 10_000 })

  const checkboxes = modal.locator('input[type="checkbox"]:not(:disabled)')
  const count = Math.min(await checkboxes.count(), max)
  for (let i = 0; i < count; i++) await checkboxes.nth(i).check()

  expect(count, 'the picker offered no selectable table').toBeGreaterThan(0)

  await modal.getByRole('button', { name: /Link \d+ Table/i }).click()
  await expect(modal).toBeHidden({ timeout: 15_000 })

  // Not just "a card appeared". An exact count would be wrong: creating a
  // tournament already auto-assigns the club's default tables, so the picker
  // tops that up rather than starting from nothing.
  await expect(async () => {
    expect(await getByTestId(page, 'table-card').count()).toBeGreaterThanOrEqual(count)
  }).toPass({ timeout: 15_000 })
}

/** Register a batch of existing club players into the open tournament. */
export async function registerPlayers(page: Page, names: string[]): Promise<void> {
  await switchTab(page, 'players')
  await expect(page.getByText('Register Player')).toBeVisible({ timeout: 10_000 })

  for (const name of names) {
    await page.getByRole('button', { name: 'Register Player' }).first().click()

    const modal = registerDialog(page)
    await expect(modal).toBeVisible()
    await modal.locator('input[type="text"]').fill(name)
    await expect(modal.getByText('player(s) found', { exact: false })).toBeVisible({
      timeout: 10_000,
    })
    await modal
      .getByRole('button', { name: /^Register/ })
      .first()
      .click()

    // Modal auto-closes on success; close it manually only if it lingers.
    if (await modal.isVisible().catch(() => false)) {
      await getByTestId(page, 'modal-close')
        .first()
        .click()
        .catch(() => {})
    }
    await expect(modal).toBeHidden({ timeout: 10_000 })
    await page.waitForTimeout(500)
  }
}

/** Check in players (auto-seats them) and wait for the SEATED status. */
export async function checkinPlayers(page: Page, names: string[]): Promise<void> {
  await switchTab(page, 'players')
  for (const name of names) {
    const row = playerRow(page, name)
    await row.locator('button').filter({ hasText: 'Check In' }).click()
    await expect(row.getByText('Seated')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(500)
  }
}

/**
 * Assert the seating chart shows exactly these players and nobody else.
 *
 * Checking only that each expected name is present is what let a real bug ship:
 * the chart was serving every player ever seated at the physical table, so it
 * listed strangers from other tournaments alongside the right names and every
 * "is Damien on the chart?" assertion still passed. Count and set membership
 * both matter.
 */
export async function expectExactlySeated(page: Page, expected: string[]): Promise<void> {
  await expect(async () => {
    const shown = (await getByTestId(page, 'table-card-player-name').allTextContents())
      .map((n) => n.trim())
      .filter(Boolean)

    expect(shown, `seated players on the chart: ${shown.join(', ')}`).toHaveLength(expected.length)

    for (const name of expected) {
      const hits = shown.filter((s) => s.includes(name))
      expect(hits, `${name} should hold exactly one seat, got ${hits.length}`).toHaveLength(1)
    }

    const strangers = shown.filter((s) => !expected.some((name) => s.includes(name)))
    expect(strangers, `nobody else belongs on this chart: ${strangers.join(', ')}`).toEqual([])
  }).toPass({ timeout: 15_000 })
}

/** Start the tournament clock from the Clock tab and confirm it runs. */
export async function startClock(page: Page): Promise<void> {
  await switchTab(page, 'clock')
  await expect(page.getByText('Tournament Clock')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /^START$/i }).click()
  await expect(page.getByRole('button', { name: /^PAUSE$/i })).toBeVisible({ timeout: 10_000 })
  await expect(getByTestId(page, 'clock-live-text')).toBeVisible()
}

/**
 * Advance the open tournament's status via the Overview action button, then
 * confirm in the status dialog. `actionLabel` is the button text (i18n EN).
 */
export async function changeStatus(page: Page, actionLabel: string | RegExp): Promise<void> {
  await switchTab(page, 'overview')
  // Heading (not getByText) so a lingering "Tournament status updated" success
  // toast from a prior change doesn't create a strict-mode double match.
  await expect(page.getByRole('heading', { name: 'Tournament Status' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: actionLabel }).click()

  const dialog = page.locator('[role="dialog"]').first()
  await expect(dialog).toBeVisible()
  await dialog.getByText('Confirm', { exact: true }).click()
}
