import { test, expect, type Page } from '@playwright/test';

/**
 * Tournament Lifecycle E2E Test
 *
 * Validates the full tournament management flow:
 * 1. Create tournament from dashboard
 * 2. Assign tables
 * 3. Open registration
 * 4. Register players
 * 5. Check in players (auto-seats via BALANCED strategy)
 * 6. Verify seating
 * 7. Start late registration
 * 8. Start the clock
 * 9. Handle late registration players
 * 10. Verify final seating
 * 11. Move to IN_PROGRESS
 */

// Seed player names to search for (must exist in the database)
const INITIAL_PLAYERS = ['Damien', 'Rico', 'Aliosha', 'Rami', 'Jean-Marie', 'Guillaume'];
const LATE_REG_PLAYERS = ['Manu', 'Fabien'];

// Players to check in before tournament starts (first 4 of INITIAL_PLAYERS)
const PRE_START_CHECKIN = INITIAL_PLAYERS.slice(0, 4);
// Players left as REGISTERED initially (last 2 of INITIAL_PLAYERS)
const REMAINING_REGISTERED = INITIAL_PLAYERS.slice(4);

test.describe.serial('Tournament Lifecycle', () => {
  let page: Page;
  let tournamentName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: '.auth/manager.json',
    });
    page = await context.newPage();
    tournamentName = `E2E Test Tournament - ${Date.now()}`;
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─── Step 1: Create Tournament ──────────────────────────────────────

  test('Step 1: Navigate to dashboard and create a tournament', async () => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PocketPair');

    // Click "Create Tournament" in the Quick Actions card
    await page.getByText('Create Tournament', { exact: false }).first().click();

    // Wait for the tournament form modal to appear
    const modal = page.locator('.fixed.inset-0.z-50').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Create Tournament');

    // Fill tournament name
    const nameInput = modal.locator('input[type="text"]').first();
    await nameInput.fill(tournamentName);

    // Fill start time (1 hour from now)
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const formatted = startTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    await modal.locator('input[type="datetime-local"]').fill(formatted);

    // Fill buy-in (25 EUR)
    const numberInputs = modal.locator('input[type="number"]');
    await numberInputs.first().fill('25');

    // Fill seat cap (18)
    await numberInputs.nth(1).fill('18');

    // Select the first available blind structure template
    const templateSelect = modal.locator('select');
    await templateSelect.waitFor({ state: 'visible' });
    // Wait for options to load (first option is a disabled placeholder)
    await expect(templateSelect.locator('option').nth(1)).toBeAttached({ timeout: 10_000 });
    const firstOptionValue = await templateSelect.locator('option').nth(1).getAttribute('value');
    if (firstOptionValue) {
      await templateSelect.selectOption(firstOptionValue);
    }

    // Submit the form
    await modal.locator('button[type="submit"]').click();

    // Wait for modal to close (tournament created)
    await expect(modal).toBeHidden({ timeout: 15_000 });

    // Navigate to the newly created tournament
    // The dashboard should show it in the recent tournaments list
    // Click on the tournament name to go to its detail page
    await page.getByText(tournamentName).first().click();

    // Verify we're on the tournament detail page
    await expect(page.getByText(tournamentName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Overview')).toBeVisible();
  });

  // ─── Step 2: Assign Tables ──────────────────────────────────────────

  test('Step 2: Assign tables to the tournament', async () => {
    // Click Seating tab
    await page.getByText('Seating', { exact: true }).click();

    // Wait for seating content to load
    await expect(page.getByText('Table Management', { exact: false })).toBeVisible({ timeout: 10_000 });

    // Click "Link Table(s)" button
    await page.getByText('Link Table(s)', { exact: false }).first().click();

    // Wait for the assign table modal
    const modal = page.locator('.fixed.inset-0.z-50').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Link Club Tables');

    // Select 9-max format (should be default, but click to be sure)
    await modal.getByText('9-max', { exact: true }).click();

    // Wait for club tables to load
    await expect(modal.locator('input[type="checkbox"]').first()).toBeVisible({ timeout: 10_000 });

    // Select the first 2 available (non-disabled) checkboxes
    const checkboxes = modal.locator('input[type="checkbox"]:not(:disabled)');
    const count = await checkboxes.count();
    const tablesToSelect = Math.min(count, 2);
    for (let i = 0; i < tablesToSelect; i++) {
      await checkboxes.nth(i).check();
    }

    // Click the "Link N Tables" button
    await modal.locator('button.pp-action-button--primary').last().click();

    // Wait for modal to close
    await expect(modal).toBeHidden({ timeout: 15_000 });

    // Verify tables appear in the seating chart
    await expect(page.getByText('Table', { exact: false })).toBeVisible();
  });

  // ─── Step 3: Open Registration ──────────────────────────────────────

  test('Step 3: Open registration', async () => {
    // Switch to Overview tab
    await page.getByText('Overview', { exact: true }).click();

    // Wait for the status card to load
    await expect(page.getByText('Tournament Status', { exact: false })).toBeVisible({ timeout: 10_000 });

    // Click "Open Registration" button
    await page.getByText('Open Registration', { exact: true }).click();

    // Confirm in the dialog
    const confirmDialog = page.locator('.fixed.inset-0.z-50').first();
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText('Change Status')).toBeVisible();
    await confirmDialog.getByText('Confirm', { exact: true }).click();

    // Verify status changes to REGISTRATION_OPEN
    await expect(page.getByText('Registration Open')).toBeVisible({ timeout: 15_000 });
  });

  // ─── Step 4: Register Players ──────────────────────────────────────

  test('Step 4: Register players', async () => {
    // Switch to Players tab
    await page.getByText('Players', { exact: true }).click();
    await expect(page.getByText('Register Player')).toBeVisible({ timeout: 10_000 });

    for (const playerName of INITIAL_PLAYERS) {
      // Click "Register Player" to open modal
      await page.locator('button.pp-action-button--primary').filter({ hasText: 'Register Player' }).click();

      // Wait for modal
      const modal = page.locator('.fixed.inset-0.z-50').first();
      await expect(modal).toBeVisible();

      // Search for the player
      const searchInput = modal.locator('input[type="text"]');
      await searchInput.fill(playerName);

      // Wait for search results (debounced 300ms + network)
      await expect(modal.getByText('player(s) found', { exact: false })).toBeVisible({ timeout: 10_000 });

      // Click "Register" on the first result
      await modal.locator('button.pp-action-button--primary').filter({ hasText: 'Register' }).first().click();

      // Wait for registration to complete (button changes to "Registering...")
      // Then the player disappears from search results or modal closes
      // Wait a moment for the operation to finish
      await page.waitForTimeout(1_000);

      // Close the modal (click backdrop or close button)
      const closeButton = modal.locator('button').filter({ has: page.locator('ion-icon') }).first();
      await closeButton.click();
      await expect(modal).toBeHidden({ timeout: 5_000 });

      // Brief pause between registrations
      await page.waitForTimeout(500);
    }

    // Verify all 6 players show in the list with "Registered" status
    for (const playerName of INITIAL_PLAYERS) {
      await expect(page.getByText(playerName, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // ─── Step 5: Check In Players (Pre-tournament) ─────────────────────

  test('Step 5: Check in 4 players (auto-seats)', async () => {
    // We're already on the Players tab
    for (const playerName of PRE_START_CHECKIN) {
      // Find the player row and its Check In button
      const playerRow = page.locator('.divide-y > div').filter({ hasText: playerName });
      const checkInBtn = playerRow.locator('button').filter({ hasText: 'Check In' });
      await checkInBtn.click();

      // Wait for the check-in to complete (status changes from "Registered" to "Seated")
      await expect(playerRow.getByText('Seated')).toBeVisible({ timeout: 10_000 });

      // Brief pause between check-ins
      await page.waitForTimeout(500);
    }

    // Verify the remaining 2 players are still "Registered"
    for (const playerName of REMAINING_REGISTERED) {
      const playerRow = page.locator('.divide-y > div').filter({ hasText: playerName });
      await expect(playerRow.getByText('Registered')).toBeVisible();
    }
  });

  // ─── Step 6: Verify Seating Chart ──────────────────────────────────

  test('Step 6: Verify seating chart shows 4 seated players', async () => {
    // Switch to Seating tab
    await page.getByText('Seating', { exact: true }).click();

    // Wait for seating content
    await expect(page.getByText('Table Management')).toBeVisible({ timeout: 10_000 });

    // Verify at least some players are shown in the seating chart
    // Each checked-in player should appear on a table card
    for (const playerName of PRE_START_CHECKIN) {
      await expect(page.getByText(playerName, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // ─── Step 7: Start Late Registration ───────────────────────────────

  test('Step 7: Start late registration', async () => {
    // Switch to Overview tab
    await page.getByText('Overview', { exact: true }).click();
    await expect(page.getByText('Tournament Status')).toBeVisible({ timeout: 10_000 });

    // Click "Late Registration" button
    await page.getByText('Late Registration', { exact: true }).click();

    // Confirm in dialog
    const confirmDialog = page.locator('.fixed.inset-0.z-50').first();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByText('Confirm', { exact: true }).click();

    // Verify status changes to LATE_REGISTRATION
    await expect(page.getByText('Late Registration').first()).toBeVisible({ timeout: 15_000 });
  });

  // ─── Step 8: Start the Clock ───────────────────────────────────────

  test('Step 8: Start the clock', async () => {
    // Switch to Clock tab
    await page.getByText('Clock', { exact: true }).click();
    await expect(page.getByText('Tournament Clock')).toBeVisible({ timeout: 10_000 });

    // Click the main "START" button (large button)
    const startButton = page.locator('button.w-full').filter({ hasText: 'Start' });
    await startButton.click();

    // Verify clock is now running — button text changes to "PAUSE" and LIVE indicator appears
    await expect(page.getByText('PAUSE')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('LIVE')).toBeVisible();
  });

  // ─── Step 9: Handle Late Registration Players ──────────────────────

  test('Step 9: Check in remaining + register & check in late players', async () => {
    // Switch to Players tab
    await page.getByText('Players', { exact: true }).click();
    await expect(page.getByText('Register Player')).toBeVisible({ timeout: 10_000 });

    // Check in the 2 remaining REGISTERED players
    for (const playerName of REMAINING_REGISTERED) {
      const playerRow = page.locator('.divide-y > div').filter({ hasText: playerName });
      const checkInBtn = playerRow.locator('button').filter({ hasText: 'Check In' });
      await checkInBtn.click();
      await expect(playerRow.getByText('Seated')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // Register and check in 2 more late registration players
    for (const playerName of LATE_REG_PLAYERS) {
      // Register
      await page.locator('button.pp-action-button--primary').filter({ hasText: 'Register Player' }).click();
      const modal = page.locator('.fixed.inset-0.z-50').first();
      await expect(modal).toBeVisible();

      const searchInput = modal.locator('input[type="text"]');
      await searchInput.fill(playerName);
      await expect(modal.getByText('player(s) found', { exact: false })).toBeVisible({ timeout: 10_000 });
      await modal.locator('button.pp-action-button--primary').filter({ hasText: 'Register' }).first().click();
      await page.waitForTimeout(1_000);

      // Close modal
      const closeButton = modal.locator('button').filter({ has: page.locator('ion-icon') }).first();
      await closeButton.click();
      await expect(modal).toBeHidden({ timeout: 5_000 });
      await page.waitForTimeout(500);

      // Check in
      const playerRow = page.locator('.divide-y > div').filter({ hasText: playerName });
      const checkInBtn = playerRow.locator('button').filter({ hasText: 'Check In' });
      await checkInBtn.click();
      await expect(playerRow.getByText('Seated')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }
  });

  // ─── Step 10: Verify Final Seating ─────────────────────────────────

  test('Step 10: Verify all 8 players are seated', async () => {
    // Switch to Seating tab
    await page.getByText('Seating', { exact: true }).click();
    await expect(page.getByText('Table Management')).toBeVisible({ timeout: 10_000 });

    // All 8 players should be visible in the seating chart
    const allPlayers = [...INITIAL_PLAYERS, ...LATE_REG_PLAYERS];
    for (const playerName of allPlayers) {
      await expect(page.getByText(playerName, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // ─── Step 11: Move to In Progress ──────────────────────────────────

  test('Step 11: Close late registration and move to IN_PROGRESS', async () => {
    // Switch to Overview tab
    await page.getByText('Overview', { exact: true }).click();
    await expect(page.getByText('Tournament Status')).toBeVisible({ timeout: 10_000 });

    // Click "Close Reg & Start" button
    await page.getByText('Close Reg & Start', { exact: true }).click();

    // Confirm in dialog
    const confirmDialog = page.locator('.fixed.inset-0.z-50').first();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByText('Confirm', { exact: true }).click();

    // Verify status changes to IN_PROGRESS
    await expect(page.getByText('In Progress')).toBeVisible({ timeout: 15_000 });

    // Switch to Clock tab and verify clock is still running
    await page.getByText('Clock', { exact: true }).click();
    await expect(page.getByText('PAUSE')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('LIVE')).toBeVisible();
  });
});
