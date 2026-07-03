import { test, expect, type Page } from '@playwright/test'

import {
  changeStatus,
  checkinPlayers,
  createAndOpenTournament,
  getByTestId,
  linkTables,
  newManagerContext,
  playerRow,
  registerPlayers,
  startClock,
  switchTab,
} from './helpers'

/**
 * Tournament Lifecycle E2E Test
 *
 * Validates the full tournament management flow end to end:
 * create → link tables → open registration → register → check in (auto-seat)
 * → verify seating → late registration → start clock → late players →
 * verify final seating → move to IN_PROGRESS.
 *
 * All structural interactions go through the stable `data-testid` hooks (via
 * the helpers). Only i18n status labels and confirm dialogs are matched by
 * text — those have no test ID and are the assertion targets anyway.
 */

const INITIAL_PLAYERS = ['Damien', 'Rico', 'Aliosha', 'Rami', 'Jean-Marie', 'Guillaume']
const LATE_REG_PLAYERS = ['Manu', 'Fabien']
const PRE_START_CHECKIN = INITIAL_PLAYERS.slice(0, 4)
const REMAINING_REGISTERED = INITIAL_PLAYERS.slice(4)

test.describe.serial('Tournament Lifecycle', () => {
  let page: Page
  let tournamentName: string

  test.beforeAll(async ({ browser }) => {
    const context = await newManagerContext(browser)
    page = await context.newPage()
    tournamentName = `E2E Test Tournament - ${Date.now()}`
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Step 1: Create a tournament and open it', async () => {
    await createAndOpenTournament(page, tournamentName)
  })

  test('Step 2: Assign tables to the tournament', async () => {
    await linkTables(page, 2)
  })

  test('Step 3: Open registration', async () => {
    await changeStatus(page, 'Open Registration')
    await expect(page.getByText('Registration Open')).toBeVisible({ timeout: 15_000 })
  })

  test('Step 4: Register players', async () => {
    await registerPlayers(page, INITIAL_PLAYERS)

    for (const name of INITIAL_PLAYERS) {
      await expect(playerRow(page, name).getByTestId('player-name')).toBeVisible({ timeout: 5_000 })
    }
  })

  test('Step 5: Check in 4 players (auto-seats)', async () => {
    await checkinPlayers(page, PRE_START_CHECKIN)

    for (const name of REMAINING_REGISTERED) {
      await expect(playerRow(page, name).getByText('Registered')).toBeVisible()
    }
  })

  test('Step 6: Verify seating chart shows the seated players', async () => {
    await switchTab(page, 'seating')
    await expect(page.getByText('Table Management')).toBeVisible({ timeout: 10_000 })

    for (const name of PRE_START_CHECKIN) {
      await expect(
        getByTestId(page, 'table-card-player-name').filter({ hasText: name }).first(),
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('Step 7: Start late registration', async () => {
    // REGISTRATION_OPEN → LATE_REGISTRATION action is labelled "Start Tournament".
    await changeStatus(page, 'Start Tournament')
    await expect(page.getByText('Late Registration').first()).toBeVisible({ timeout: 15_000 })
  })

  test('Step 8: Start the clock', async () => {
    await startClock(page)
  })

  test('Step 9: Check in remaining + register & check in late players', async () => {
    await checkinPlayers(page, REMAINING_REGISTERED)
    await registerPlayers(page, LATE_REG_PLAYERS)
    await checkinPlayers(page, LATE_REG_PLAYERS)
  })

  test('Step 10: Verify all 8 players are seated', async () => {
    await switchTab(page, 'seating')
    await expect(page.getByText('Table Management')).toBeVisible({ timeout: 10_000 })

    for (const name of [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS]) {
      await expect(
        getByTestId(page, 'table-card-player-name').filter({ hasText: name }).first(),
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('Step 11: Close late registration and move to IN_PROGRESS', async () => {
    // LATE_REGISTRATION → IN_PROGRESS action is labelled "Close Late Registration".
    await changeStatus(page, 'Close Late Registration')
    await expect(page.getByText('In Progress')).toBeVisible({ timeout: 15_000 })

    await switchTab(page, 'clock')
    await expect(page.getByRole('button', { name: /^PAUSE$/i })).toBeVisible({ timeout: 10_000 })
    await expect(getByTestId(page, 'clock-live-text')).toBeVisible()
  })
})
