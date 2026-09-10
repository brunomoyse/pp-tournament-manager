import { test, expect, type Page } from '@playwright/test'

import {
  BUY_IN_CENTS,
  changeStatus,
  checkinPlayers,
  createAndOpenTournament,
  expectExactlySeated,
  getByTestId,
  linkTables,
  newManagerContext,
  playerRow,
  readPrizePool,
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
 * verify final seating → prize pool and a rebuy → move to IN_PROGRESS →
 * bust → break → level changes → move a player.
 *
 * All structural interactions go through the stable `data-testid` hooks (via
 * the helpers). Only i18n status labels and confirm dialogs are matched by
 * text — those have no test ID and are the assertion targets anyway.
 */

const INITIAL_PLAYERS = ['Damien', 'Rico', 'Aliosha', 'Rami', 'Jean-Marie', 'Guillaume']
const LATE_REG_PLAYERS = ['Manu', 'Fabien']
/** The player Step 12 busts; later steps expect them gone from the chart. */
const VICTIM = 'Damien'
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

    // Exactly these four, and no one carried over from another tournament.
    await expectExactlySeated(page, PRE_START_CHECKIN)
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

    await expectExactlySeated(page, [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS])
  })

  // ─── The money: every check-in is a buy-in ──────────────────────────

  test('Step 11: The prize pool counts every checked-in player', async () => {
    await switchTab(page, 'overview')

    const seated = [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS]
    await expect(getByTestId(page, 'prize-pool-entries')).toHaveText(String(seated.length), {
      timeout: 15_000,
    })
    await expect(async () => {
      expect(await readPrizePool(page)).toBe(seated.length * BUY_IN_CENTS)
    }).toPass({ timeout: 15_000 })
  })

  // ─── Rebuys, the other half of the cash desk ─────────────────────────

  test('Step 12: Sell a rebuy from the players table', async () => {
    await switchTab(page, 'overview')
    const before = await readPrizePool(page)

    await switchTab(page, 'players')
    const buyer = INITIAL_PLAYERS[1]
    const row = playerRow(page, buyer)
    await row.getByRole('button', { name: 'Actions' }).click()

    const addEntry = getByTestId(page, 'player-add-entry')
    await expect(addEntry).toBeVisible({ timeout: 10_000 })
    await addEntry.click()

    // The modal opens on REBUY at the tournament's buy-in, which is the common
    // case; the manager only touches it to change the amount or the method.
    const submit = getByTestId(page, 'add-entry-submit')
    await expect(submit).toBeVisible({ timeout: 10_000 })
    await submit.click()
    await expect(submit).toBeHidden({ timeout: 15_000 })

    // The rebuy has to reach the pool the payouts are computed from, live.
    await switchTab(page, 'overview')
    await expect(async () => {
      expect(await readPrizePool(page)).toBe(before + BUY_IN_CENTS)
    }).toPass({ timeout: 15_000 })
  })

  test('Step 13: Close late registration and move to IN_PROGRESS', async () => {
    // LATE_REGISTRATION → IN_PROGRESS action is labelled "Close Late Registration".
    await changeStatus(page, 'Close Late Registration')
    await expect(page.getByText('In Progress')).toBeVisible({ timeout: 15_000 })

    await switchTab(page, 'clock')
    await expect(page.getByRole('button', { name: /^PAUSE$/i })).toBeVisible({ timeout: 10_000 })
    await expect(getByTestId(page, 'clock-live-text')).toBeVisible()
  })

  // ─── Step 14: Seating operation — bust a player ─────────────────────

  test('Step 14: Bust a seated player and see BUSTED on the Players tab', async () => {
    const victim = VICTIM

    // Open the per-seat action modal for the victim, then the danger "Bust"
    // action (no confirm for a non-PKO tournament).
    //
    // Aim at the seat's own name attribute, and check whose modal actually
    // opened before acting on it. This is what caught the seating chart serving
    // every player ever seated at the physical table: clicking Damien's row
    // opened the modal of someone from an older tournament, and a run silently
    // busted the wrong player.
    await switchTab(page, 'seating')
    const openedFor = getByTestId(page, 'player-action-name')
    await expect(async () => {
      if (await openedFor.isVisible()) {
        await page.keyboard.press('Escape')
        await expect(openedFor).toBeHidden()
      }
      await page
        .locator(`[data-testid="table-player-action"][data-player-name*="${victim}"]`)
        .first()
        .click()
      await expect(openedFor).toContainText(victim, { timeout: 3_000 })
    }).toPass({ timeout: 30_000 })

    const bust = getByTestId(page, 'player-bust')
    await expect(bust).toBeVisible({ timeout: 10_000 })
    await bust.click()

    // Authoritative, subscription-backed view: the players table shows BUSTED.
    await switchTab(page, 'players')
    const row = playerRow(page, victim)
    await expect(row).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText('Busted')).toBeVisible({ timeout: 15_000 })

    // And the chart drops them: seven left, the victim gone.
    await switchTab(page, 'seating')
    await expectExactlySeated(
      page,
      [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS].filter((n) => n !== VICTIM),
    )
  })

  // ─── Step 15: the break, which every club takes every hour ───────────

  test('Step 15: Pause the clock for a break and resume it', async () => {
    await switchTab(page, 'clock')

    // The Start/Pause button renders even when the store holds no clock, and
    // clicking it then does nothing at all. Prove we have a clock first.
    await expect(page.locator('.clock-card__disconnected')).toHaveCount(0)

    const toggle = page.locator('.clock-card__main-button')
    await expect(toggle).toHaveText(/^PAUSE$/i, { timeout: 10_000 })

    await toggle.click()
    await expect(toggle).toHaveText(/^RESUME$/i, { timeout: 10_000 })
    await expect(getByTestId(page, 'clock-live-text')).toHaveCount(0)

    await toggle.click()
    await expect(toggle).toHaveText(/^PAUSE$/i, { timeout: 10_000 })
    await expect(getByTestId(page, 'clock-live-text')).toBeVisible({ timeout: 10_000 })
  })

  // ─── Step 16: level changes, and getting one back ────────────────────

  test('Step 16: Advance a blind level, then revert it', async () => {
    await switchTab(page, 'clock')
    const activeLevel = page.locator('.structure-level--active .structure-level-number')
    await expect(activeLevel).toBeVisible({ timeout: 10_000 })

    const before = Number(await activeLevel.innerText())
    expect(before, 'the structure should mark a current level').toBeGreaterThan(0)

    const dialog = page.locator('[role="dialog"]')

    // Advancing is consequential mid-tournament, so it confirms first.
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(dialog.getByText('Advance to next level?')).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(activeLevel).toHaveText(String(before + 1), { timeout: 15_000 })

    // Reverting has to work too: a level advanced by mistake is the single
    // most common thing a manager needs to take back.
    await page.getByRole('button', { name: 'Previous', exact: true }).click()
    await expect(dialog.getByText('Revert to previous level?')).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(activeLevel).toHaveText(String(before), { timeout: 15_000 })
  })

  // ─── Step 17: moving a player, the other half of seat management ─────

  test('Step 17: Move a player to the other table and see them land there', async () => {
    const survivors = [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS].filter((n) => n !== VICTIM)
    await switchTab(page, 'seating')

    // Coming back from the Clock tab the chart remounts, so let it settle
    // before reading seats off it.
    await expect(getByTestId(page, 'table-card').first()).toBeVisible({ timeout: 15_000 })
    await expectExactlySeated(page, survivors)

    const tableOf = async (name: string) => {
      const cards = getByTestId(page, 'table-card')
      for (let i = 0; i < (await cards.count()); i++) {
        const card = cards.nth(i)
        const here = await card
          .getByTestId('table-card-player-name')
          .filter({ hasText: name })
          .count()
        if (here > 0) return (await card.getAttribute('data-table-number')) ?? ''
      }
      return ''
    }

    const mover = survivors[0]
    const from = await tableOf(mover)
    expect(from, `${mover} should be seated somewhere`).not.toBe('')

    const numbers = await getByTestId(page, 'table-card').evaluateAll((cards) =>
      cards.map((c) => c.getAttribute('data-table-number') ?? ''),
    )
    const to = numbers.find((n) => n !== from)
    expect(to, 'the lifecycle links two tables, so there is somewhere to move to').toBeTruthy()

    // Open the mover's own modal, and prove it is theirs before acting.
    const openedFor = getByTestId(page, 'player-action-name')
    await expect(async () => {
      if (await openedFor.isVisible()) {
        await page.keyboard.press('Escape')
        await expect(openedFor).toBeHidden()
      }
      await page
        .locator(`[data-testid="table-player-action"][data-player-name*="${mover}"]`)
        .first()
        .click()
      await expect(openedFor).toContainText(mover, { timeout: 3_000 })
    }).toPass({ timeout: 30_000 })

    await getByTestId(page, 'player-move').click()

    // Picking the seat is the confirm; there is no second step.
    const moveDialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator('.pp-modal-title', { hasText: 'Move Player' }) })
    await expect(moveDialog).toBeVisible({ timeout: 10_000 })
    const target = moveDialog
      .locator('.seating-manager__move-table')
      .filter({ has: page.getByRole('heading', { name: `Table ${to}`, exact: true }) })
    await target.locator('button.seating-manager__move-seat:not([disabled])').first().click()
    await expect(moveDialog).toBeHidden({ timeout: 15_000 })

    // The move must stick server-side, not just on screen: reload and look
    // again. The step below covers the other half, that the live chart keeps up
    // without a reload.
    await page.reload()
    await switchTab(page, 'seating')
    await expect(getByTestId(page, 'table-card').first()).toBeVisible({ timeout: 15_000 })
    await expect(async () => {
      expect(await tableOf(mover)).toBe(to)
    }).toPass({ timeout: 15_000 })

    // Nobody was lost or duplicated on the way.
    await expectExactlySeated(page, survivors)
  })

  // ─── The chart has to keep up with the floor ─────────────────────────
  //
  // This was red for a while: after a move the chart kept showing the player in
  // their old seat until the page was reloaded or the tab switched. The
  // subscription and the refetch were both fine; the seating component's
  // `defineExpose` sat after a top-level `await`, which makes it a no-op, so
  // the page's `refreshSeatingData()` call silently did nothing.
  //
  // It matters on a live floor: the manager moves a player, the screen
  // disagrees, and they move them again or seat someone into an occupied chair.
  test('Step 18: the chart updates live after a move', async () => {
    const survivors = [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS].filter((n) => n !== VICTIM)
    await switchTab(page, 'seating')
    await expect(getByTestId(page, 'table-card').first()).toBeVisible({ timeout: 15_000 })

    const cardOf = async (name: string) => {
      const cards = getByTestId(page, 'table-card')
      for (let i = 0; i < (await cards.count()); i++) {
        const card = cards.nth(i)
        if (
          (await card.getByTestId('table-card-player-name').filter({ hasText: name }).count()) > 0
        )
          return (await card.getAttribute('data-table-number')) ?? ''
      }
      return ''
    }

    const mover = survivors[1]
    const from = await cardOf(mover)
    expect(from).not.toBe('')

    const openedFor = getByTestId(page, 'player-action-name')
    await page
      .locator(`[data-testid="table-player-action"][data-player-name*="${mover}"]`)
      .first()
      .click()
    await expect(openedFor).toContainText(mover, { timeout: 10_000 })
    await getByTestId(page, 'player-move').click()

    const moveDialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator('.pp-modal-title', { hasText: 'Move Player' }) })
    await expect(moveDialog).toBeVisible({ timeout: 10_000 })
    const other = moveDialog
      .locator('.seating-manager__move-table')
      .filter({ hasNot: page.getByRole('heading', { name: `Table ${from}`, exact: true }) })
      .last()
    await other.locator('button.seating-manager__move-seat:not([disabled])').first().click()
    await expect(moveDialog).toBeHidden({ timeout: 15_000 })

    // No reload, no tab switch: the live chart alone must reflect the move.
    await expect(async () => {
      expect(await cardOf(mover)).not.toBe(from)
    }).toPass({ timeout: 20_000 })
  })
})
