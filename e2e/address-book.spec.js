import { test, expect } from '@playwright/test';
import { createTestMember, injectAuthSession } from './fixtures/test-helpers.js';

test.describe('Address Book Management (CRUD)', () => {

  test('Member can add, edit, and delete shipping addresses', async ({ page }) => {
    // 1. Create fresh test member
    const member = await createTestMember();
    await injectAuthSession(page, member);

    // 2. Navigate to Account page and open Address Book tab
    await page.goto('/account');
    await expect(page).toHaveURL(/.*\/account/);

    const addressTabBtn = page.getByRole('button', { name: /ADDRESS BOOK|สมุดที่อยู่/i });
    await expect(addressTabBtn).toBeVisible({ timeout: 8000 });
    await addressTabBtn.click();

    // 3. Click "Add Address"
    const addAddressBtn = page.getByRole('button', { name: /Add Address|เพิ่มที่อยู่/i }).first();
    await expect(addAddressBtn).toBeVisible();
    await addAddressBtn.click();

    // 4. Fill Address Creation Form
    await page.locator('input[placeholder="Somchai Jaidee"]').fill('E2E Tester Somchai');
    await page.locator('input[type="tel"]').fill('0812345678');
    await page.locator('input[placeholder*="Sukhumvit"]').fill('789 Sukhumvit 55');
    await page.locator('input[placeholder*="Khlong"]').fill('Thonglor');
    await page.locator('input[placeholder="Watthana"]').fill('Watthana');
    await page.locator('input[placeholder="Bangkok"]').fill('Bangkok');
    await page.locator('input[placeholder="10110"]').fill('10110');

    // Submit address
    const saveBtn = page.locator('form').getByRole('button', { name: /Save Address|บันทึกที่อยู่|Save/i });
    await saveBtn.click();

    // 5. Verify newly created address card is present
    await expect(page.getByText('E2E Tester Somchai')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('0812345678')).toBeVisible();
    await expect(page.getByText('789 Sukhumvit 55')).toBeVisible();

    // 6. Edit the address
    const editBtn = page.getByRole('button', { name: /Edit|แก้ไข/i }).first();
    await editBtn.click();

    // Change phone number
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.clear();
    await phoneInput.fill('0899998877');

    const updateSaveBtn = page.locator('form').getByRole('button', { name: /Save Changes|Save Address|บันทึก|Save/i });
    await updateSaveBtn.click();

    // Verify updated phone appears
    await expect(page.getByText('0899998877')).toBeVisible({ timeout: 6000 });

    // 7. Delete the address
    const deleteBtn = page.getByRole('button', { name: /Delete|ลบ/i }).first();
    await deleteBtn.click();

    // Confirm deletion in modal
    const confirmDeleteBtn = page.locator('.fixed').getByRole('button', { name: /Delete Address|Delete|Confirm|ยืนยัน/i });
    await confirmDeleteBtn.click();

    // Verify address is removed and delivery addresses count is 0
    await expect(page.getByRole('heading', { name: /Delivery addresses \(0\)/i })).toBeVisible({ timeout: 6000 });
  });

});
