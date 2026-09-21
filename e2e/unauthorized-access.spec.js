import { test, expect } from '@playwright/test';
import { createTestMember, injectAuthSession } from './fixtures/test-helpers.js';

test.describe('Unauthorized Access Protection & Role Guards', () => {

  test('Guest accessing /admin is redirected to /login', async ({ page }) => {
    // Clear any residual session
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Attempt direct access to admin control center
    await page.goto('/admin');

    // Verify redirected to login with redirect state
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  test('Guest accessing /account is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Attempt direct access to account lounge
    await page.goto('/account');

    // Verify redirected to login
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  test('Regular member accessing /admin is blocked with access restriction screen', async ({ page }) => {
    // Create member account (role: Member, not Admin)
    const member = await createTestMember();
    await injectAuthSession(page, member);

    // Attempt to access /admin
    await page.goto('/admin');

    // Verify access denied screen is rendered
    await expect(page.getByText('Administrators only')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('This area is limited to store administrators')).toBeVisible();

    // Verify admin management controls are NOT rendered
    await expect(page.getByText('INVENTORY & RESTOCK')).not.toBeVisible();
    await expect(page.getByText('MEMBERS DIRECTORY')).not.toBeVisible();
  });

});
