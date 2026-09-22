import { test, expect } from '@playwright/test';
import { injectAuthSession } from './fixtures/test-helpers.js';

test.describe('Responsive Viewports & Accessibility (WCAG 2.1 AA)', () => {

  const viewports = [
    { name: 'Mobile (390px)', width: 390, height: 844 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ];

  const testPages = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Cart', path: '/cart' },
    { name: 'Access / Login', path: '/login' },
  ];

  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const p of testPages) {
        test(`Page "${p.name}" has no horizontal overflow clipping`, async ({ page }) => {
          await page.goto(p.path);
          await page.waitForLoadState('domcontentloaded');

          const hasNoHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth <= window.innerWidth + 1;
          });
          expect(hasNoHorizontalOverflow).toBe(true);
        });
      }
    });
  }

  test('Single <main> landmark exists across pages with no nested <main>', async ({ page }) => {
    for (const p of testPages) {
      await page.goto(p.path);
      await page.waitForLoadState('domcontentloaded');

      const mainCount = await page.locator('main').count();
      expect(mainCount).toBe(1);

      const nestedMainCount = await page.locator('main main').count();
      expect(nestedMainCount).toBe(0);
    }
  });

  test('Skip to main content link works via keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // First tab keystroke should focus the skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    // Activating skip link jumps focus to main content
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('Preferences tab exposes accessible role="switch" and toggles aria-checked', async ({ page }) => {
    const mockUser = {
      _id: 'mock_a11y_user',
      id: 'mock_a11y_user',
      email: 'a11y@matcha.test',
      name: 'A11y Reviewer',
      role: 'Member',
      tier: 'Bronze',
    };
    await injectAuthSession(page, { token: 'mock-a11y-jwt-token', user: mockUser });

    await page.route('**/api/consent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { optedIn: false, version: '1.1' } }),
      });
    });
    await page.route('**/api/consent/deletion-request**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      });
    });

    await page.goto('/account');
    await page.waitForLoadState('domcontentloaded');

    const prefTabBtn = page.getByRole('button', { name: /PREFERENCES|การตั้งค่า/i });
    if (await prefTabBtn.isVisible()) {
      await prefTabBtn.click();

      const switches = page.locator('button[role="switch"]');
      const count = await switches.count();
      expect(count).toBeGreaterThan(0);

      const firstSwitch = switches.first();
      const initialChecked = await firstSwitch.getAttribute('aria-checked');
      expect(['true', 'false']).toContain(initialChecked);

      await firstSwitch.click();
      const updatedChecked = await firstSwitch.getAttribute('aria-checked');
      expect(updatedChecked).not.toBe(initialChecked);
    }
  });

  test('Modal dialogs expose role="dialog" and close on Escape key press', async ({ page }) => {
    const mockUser = {
      _id: 'mock_modal_user',
      id: 'mock_modal_user',
      email: 'modal@matcha.test',
      name: 'Modal Tester',
      role: 'Member',
      tier: 'Bronze',
    };
    await injectAuthSession(page, { token: 'mock-modal-jwt-token', user: mockUser });

    await page.route('**/api/addresses**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/account');
    await page.waitForLoadState('domcontentloaded');

    const addressTabBtn = page.getByRole('button', { name: /ADDRESS BOOK|สมุดที่อยู่/i });
    if (await addressTabBtn.isVisible()) {
      await addressTabBtn.click();

      const addAddressBtn = page.getByRole('button', { name: /Add Address|เพิ่มที่อยู่/i }).first();
      await expect(addAddressBtn).toBeVisible();
      await addAddressBtn.click();

      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      expect(await dialog.getAttribute('aria-modal')).toBe('true');

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

});
