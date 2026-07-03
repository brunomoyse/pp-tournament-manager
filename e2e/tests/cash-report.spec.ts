import { test, expect, type Page } from '@playwright/test'

import { getByTestId, newManagerContext } from './helpers'

/**
 * Reports page (/reports): the club analytics + leaderboard rendered from
 * seeded finished tournaments and their results, plus the CSV export.
 *
 * Deterministic against the fixtures: the manager's club (Poker One) has
 * finished tournaments within the last ~12 days, so the default CURRENT_YEAR
 * period yields a non-zero tournament count and a populated leaderboard.
 */

test.describe.serial('Reports and leaderboard', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await (await newManagerContext(browser)).newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('stat strip shows a non-zero tournament count', async () => {
    await page.goto('/reports')
    await expect(getByTestId(page, 'reports-stats')).toBeVisible({ timeout: 15_000 })

    const count = await getByTestId(page, 'stat-tournaments').innerText()
    expect(Number.parseInt(count, 10)).toBeGreaterThan(0)
  })

  test('leaderboard is populated from seeded results', async () => {
    await expect(getByTestId(page, 'leaderboard-row').first()).toBeVisible({ timeout: 15_000 })
    expect(await getByTestId(page, 'leaderboard-row').count()).toBeGreaterThan(0)
  })

  test('leaderboard CSV export downloads a file', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      getByTestId(page, 'leaderboard-export').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })
})
