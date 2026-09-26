import fs from 'node:fs';
import { test, expect } from '@playwright/test';

const spreads = JSON.parse(fs.readFileSync(new URL('../frontend/src/data/editorialSpreads.json', import.meta.url), 'utf8'));

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`lookbook pins and products follow all photographs at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/lookbooks', route => route.fulfill({ json: { success: true, data: spreads } }));
    await page.goto('/lookbook');
    await page.locator('figure').first().click();

    const dialog = page.getByRole('dialog', { name: /full spread/ });
    for (let spreadIndex = 0; spreadIndex < spreads.length; spreadIndex += 1) {
      const spread = spreads[spreadIndex];
      const photos = [{ image: spread.heroImage, hotspots: spread.hotspots }, ...spread.detailHotspots];
      for (let photoIndex = 0; photoIndex < photos.length; photoIndex += 1) {
        const photo = photos[photoIndex];
        if (photoIndex) await dialog.getByRole('button', { name: `Show image ${photoIndex + 1} of ${photos.length}` }).click();
        const image = dialog.locator('img[data-original-src]').first();
        await expect(image).toHaveAttribute('data-original-src', photo.image);
        const pins = dialog.locator('button[aria-pressed]');
        await expect(pins).toHaveCount(photo.hotspots.length);
        const rows = dialog.locator('ul').first().locator('li');
        await expect(rows).toHaveCount(photo.hotspots.length);
        for (const hotspot of photo.hotspots) {
          await expect(dialog.getByRole('button', { name: `Highlight ${hotspot.title} on the photograph` })).toHaveCount(1);
          await expect(rows.filter({ hasText: hotspot.title })).toHaveCount(1);
        }
        const aligned = await image.evaluate(img => {
          const rect = img.getBoundingClientRect();
          return [...img.parentElement.querySelectorAll('button[aria-pressed]')].every(pin => {
            const box = pin.getBoundingClientRect();
            const x = box.left + box.width / 2;
            const y = box.top + box.height / 2;
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
          });
        });
        expect(aligned, `${spread.id} photo ${photoIndex + 1}`).toBe(true);
      }
      if (spreadIndex < spreads.length - 1) await dialog.getByRole('button', { name: 'Next spread' }).click();
    }
  });
}
