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

const GQL = process.env.PP_GRAPHQL ?? 'http://localhost:8080/graphql'

test.describe.serial('Tournament Lifecycle', () => {
  let page: Page
  let tournamentName: string
  let tournamentId = ''

  test.beforeAll(async ({ browser }) => {
    const context = await newManagerContext(browser)
    page = await context.newPage()
    tournamentName = `E2E Test Tournament - ${Date.now()}`
  })

  // Hand the tables back. A live tournament holds the tables it is linked to,
  // so without this the suite poisoned its own fixture: each run consumed 2 of
  // the seeded club's 4 tables for good, and the next run against the same seed
  // failed at "Assign tables" with nothing left to link.
  //
  // Done over the API rather than the UI on purpose: from the UI, ending a
  // tournament that still has players seated opens the results modal instead of
  // finishing it, so there is no button that just releases the tables.
  // Best-effort throughout, so a cleanup problem can never bury the failure
  // that got us here.
  test.afterAll(async ({ playwright }) => {
    try {
      const token = await page.evaluate(() => {
        const raw = window.localStorage.getItem('auth-backup')
        return raw ? ((JSON.parse(raw) as { authToken?: string }).authToken ?? null) : null
      })
      if (token && tournamentId) {
        const api = await playwright.request.newContext()
        await api.post(GQL, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            query:
              'mutation($i:UpdateTournamentStatusInput!){updateTournamentStatus(input:$i){id liveStatus}}',
            variables: { i: { tournamentId, liveStatus: 'FINISHED' } },
          },
        })
        await api.dispose()
      }
    } catch {
      // pp-service/fixtures still resets the club if this ever stops working.
    }
    await page.close()
  })

  test('Step 1: Create a tournament and open it', async () => {
    await createAndOpenTournament(page, tournamentName)
    tournamentId = /\/tournament\/([0-9a-f-]{36})/.exec(page.url())?.[1] ?? ''
    expect(tournamentId, 'tournament id should be in the URL').not.toBe('')
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

  // ─── Step 12: Seating operation — bust a player ─────────────────────

  test('Step 12: Bust a seated player and see BUSTED on the Players tab', async () => {
    const victim = INITIAL_PLAYERS[0]

    // Open the per-seat action modal for the victim, then the danger "Bust"
    // action (no confirm for a non-PKO tournament).
    await switchTab(page, 'seating')
    await getByTestId(page, 'table-player-action')
      .filter({ has: page.getByText(victim) })
      .first()
      .click()
    const bust = getByTestId(page, 'player-bust')
    await expect(bust).toBeVisible({ timeout: 10_000 })
    await bust.click()

    // Authoritative, subscription-backed view: the players table shows BUSTED.
    await switchTab(page, 'players')
    const row = playerRow(page, victim)
    await expect(row).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText('Busted')).toBeVisible({ timeout: 15_000 })
  })
})
