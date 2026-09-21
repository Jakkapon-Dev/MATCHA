import { test, expect } from '@playwright/test';
import path from 'node:path';
import { createTestMember, injectAuthSession } from './fixtures/test-helpers.js';

test.describe('Profile Avatar Lifecycle (Upload / Replace / Delete)', () => {

  test('Member can upload, change, and remove avatar image', async ({ page }) => {
    const member = await createTestMember();
    await injectAuthSession(page, member);

    // 1. Navigate to Account page (Personal Details tab is open by default)
    await page.goto('/account');
    await expect(page).toHaveURL(/.*\/account/);
    await expect(page.getByRole('heading', { name: /Personal Details/i })).toBeVisible({ timeout: 8000 });

    const avatarFileInput = page.locator('input[type="file"][accept*="image"]');
    const fixturePath1 = path.resolve(process.cwd(), 'e2e/fixtures/test-avatar.png');
    const fixturePath2 = path.resolve(process.cwd(), 'e2e/fixtures/test-avatar-alt.png');

    // 2. Upload initial avatar
    await avatarFileInput.setInputFiles(fixturePath1);

    // Verify avatar image is rendered in preview
    const avatarImg = page.locator('img[alt="Your profile"]');
    await expect(avatarImg).toBeVisible({ timeout: 10000 });
    const initialSrc = await avatarImg.getAttribute('src');
    expect(initialSrc).toBeTruthy();

    // Verify "Change photo" and "Remove" buttons are now displayed
    await expect(page.getByRole('button', { name: /Change photo/i })).toBeVisible();
    const removeBtn = page.getByRole('button', { name: /Remove/i });
    await expect(removeBtn).toBeVisible();

    // 3. Change photo with new image fixture
    await avatarFileInput.setInputFiles(fixturePath2);
    await page.waitForTimeout(1000); // Allow upload response processing
    await expect(avatarImg).toBeVisible({ timeout: 10000 });

    // 4. Remove avatar
    await removeBtn.click();

    // Verify avatar image is removed and initials/default state is restored
    await expect(avatarImg).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Upload photo/i })).toBeVisible();
  });

});
