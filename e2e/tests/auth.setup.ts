import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/manager.json';

setup('authenticate as manager', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Ionic IonInput wraps native <input> in shadow DOM — Playwright pierces it by default
  // Fill email field
  const emailInput = page.locator('ion-input[type="email"] input');
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill('contact@brunomoyse.be');

  // Fill password field
  const passwordInput = page.locator('ion-input[type="password"] input, ion-input[type="text"] input').last();
  await passwordInput.fill('admin');

  // Click the login button
  await page.locator('ion-button.pp-login-button').click();

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 15_000 });
  await expect(page.locator('h1')).toContainText('PocketPair');

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});
