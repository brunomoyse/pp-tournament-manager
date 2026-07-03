import { test, expect, type Page } from '@playwright/test'

import { getByTestId, newManagerContext } from './helpers'

/**
 * Club player CRUD on /players: create → search → edit → anonymise.
 *
 * Roster players are the club's address book (the manager registers them into
 * tournaments; they don't log in). This is the money-path prerequisite for
 * every tournament flow, so it must stay green through redesigns — hence the
 * `data-testid` hooks on the row, the row actions, and the search box.
 */

test.describe.serial('Club player CRUD', () => {
  let page: Page
  const stamp = Date.now()
  const firstName = `E2E-${stamp}`
  const lastName = 'Rostered'
  const editedLast = 'Renamed'

  test.beforeAll(async ({ browser }) => {
    page = await (await newManagerContext(browser)).newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('create a roster player', async () => {
    await page.goto('/players')
    await getByTestId(page, 'add-player').click()

    const modal = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator('.pp-modal-title', { hasText: 'Create Player' }) })
    await expect(modal).toBeVisible()

    const inputs = modal.locator('input[type="text"]')
    await inputs.nth(0).fill(firstName)
    await inputs.nth(1).fill(lastName)
    await modal.locator('button[type="submit"]').click()
    await expect(modal).toBeHidden({ timeout: 10_000 })

    // The row splits the name into last/first spans; match on the unique
    // first-name stamp rather than a contiguous "First Last" string.
    await expect(getByTestId(page, 'club-player-row').filter({ hasText: firstName })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('search narrows the list to the new player', async () => {
    await getByTestId(page, 'player-search').fill(firstName)
    const rows = getByTestId(page, 'club-player-row')
    await expect(rows).toHaveCount(1, { timeout: 10_000 })
    // The last name renders uppercased and before the first name, so assert on
    // the verbatim first-name stamp rather than a contiguous "First Last".
    await expect(rows.first()).toContainText(firstName)
  })

  test('edit updates the player name', async () => {
    await getByTestId(page, 'club-player-row')
      .filter({ hasText: firstName })
      .getByTestId('player-edit')
      .click()

    const modal = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator('.pp-modal-title', { hasText: 'Edit Player' }) })
    await expect(modal).toBeVisible()

    const lastNameInput = modal.locator('input[type="text"]').nth(1)
    await lastNameInput.fill(editedLast)
    await modal.locator('button[type="submit"]').click()
    await expect(modal).toBeHidden({ timeout: 10_000 })

    // Still the same player (unique first name), now with the edited last name.
    // Assert on data-player-name (original case) — the visible last name renders
    // uppercased, which would break a case-sensitive text match.
    await expect(
      getByTestId(page, 'club-player-row').filter({ hasText: firstName }),
    ).toHaveAttribute('data-player-name', `${firstName} ${editedLast}`, { timeout: 10_000 })
  })

  test('anonymise removes the roster player', async () => {
    const row = getByTestId(page, 'club-player-row').filter({ hasText: firstName })
    await row.getByTestId('player-anonymize').click()

    // Confirmation dialog: the danger button in the modal footer confirms.
    const dialog = page
      .locator('[role="dialog"]')
      .filter({ has: getByTestId(page, 'modal-footer') })
    await expect(dialog).toBeVisible()
    await getByTestId(page, 'modal-footer').getByRole('button', { name: 'Anonymise' }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })

    // The row for our (now anonymised) player no longer matches the search term.
    await getByTestId(page, 'player-search').fill(firstName)
    await expect(getByTestId(page, 'club-player-row')).toHaveCount(0, { timeout: 10_000 })
  })
})
