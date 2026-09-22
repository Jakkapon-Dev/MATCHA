import { test, expect } from '@playwright/test';
import { createTestMember, generateTestEmail, TEST_PASSWORD } from './fixtures/test-helpers.js';

test.describe('Authentication Flows', () => {

  test('Email & Password login with valid credentials', async ({ page }) => {
    // 1. Create isolated test user
    const member = await createTestMember();

    // 2. Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/MatchA/);

    // 3. Fill in credentials
    await page.locator('#access-email').fill(member.email);
    await page.locator('#access-password').fill(member.password);

    // 4. Submit form
    await page.locator('button[type="submit"]').click();

    // 5. Verify redirection and token stored
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('matcha_token'));
    expect(token).toBeTruthy();
  });

  test('Email & Password login with invalid password displays error message', async ({ page }) => {
    const member = await createTestMember();

    await page.goto('/login');
    await page.locator('#access-email').fill(member.email);
    await page.locator('#access-password').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Verify error alert appears
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    const text = await alert.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test('Google OAuth Sign-in flow (mocked identity boundary)', async ({ page }) => {
    const mockEmail = generateTestEmail();

    // Set mock Google ID token in window environment
    await page.addInitScript(() => {
      window.__PLAYWRIGHT_MOCK_GOOGLE_TOKEN__ = 'mock-google-id-token-xyz';
    });

    // Mock the backend Firebase exchange boundary
    await page.route('**/api/auth/firebase', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-google-jwt-token-12345',
          data: {
            _id: 'u_google_e2e_test',
            id: 'u_google_e2e_test',
            name: 'Google E2E Member',
            email: mockEmail,
            role: 'Member',
            tier: 'Regular Member',
            avatarUrl: ''
          }
        })
      });
    });

    // Mock /users/me for the mock token session
    await page.route('**/api/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'u_google_e2e_test',
            id: 'u_google_e2e_test',
            name: 'Google E2E Member',
            email: mockEmail,
            role: 'Member',
            tier: 'Regular Member'
          }
        })
      });
    });

    await page.goto('/login');

    // Click Continue with Google
    const googleBtn = page.getByRole('button', { name: /Google/i });
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();

    // Verify redirection after successful Google login
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
    const storedToken = await page.evaluate(() => localStorage.getItem('matcha_token'));
    expect(storedToken).toBe('mock-google-jwt-token-12345');
  });

  test('Logout clears member authentication state', async ({ page }) => {
    const member = await createTestMember();

    // Login
    await page.goto('/login');
    await page.locator('#access-email').fill(member.email);
    await page.locator('#access-password').fill(member.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });

    // Navigate to Account page
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible({ timeout: 8000 });

    // Click Log Out menu item
    const logoutBtn = page.getByRole('button', { name: /LOG OUT/i }).first();
    await logoutBtn.click();

    // If confirmation modal or immediate logout
    const confirmLogoutBtn = page.getByRole('button', { name: /Confirm Log Out|Sign Out|Yes/i });
    if (await confirmLogoutBtn.isVisible().catch(() => false)) {
      await confirmLogoutBtn.click();
    }

    // Wait for session to clear
    await page.waitForFunction(() => !localStorage.getItem('matcha_token'));
    const token = await page.evaluate(() => localStorage.getItem('matcha_token'));
    expect(token).toBeNull();
  });

});
