import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import spreads from './editorialSpreads.json';

const assetExists = src => fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')));

describe('editorial lookbook assets and pins', () => {
  test('every gallery photograph has its own valid product pins and local artwork', () => {
    expect(spreads).toHaveLength(6);
    for (const spread of spreads) {
      const photos = [{ image: spread.heroImage, hotspots: spread.hotspots }, ...spread.detailHotspots];
      expect(photos).toHaveLength(3);
      for (const photo of photos) {
        expect(assetExists(photo.image), photo.image).toBe(true);
        expect(photo.hotspots.length, photo.image).toBeGreaterThan(0);
        const ids = photo.hotspots.map(pin => pin.productId);
        expect(new Set(ids).size, photo.image).toBe(ids.length);
        for (const pin of photo.hotspots) {
          expect(assetExists(pin.image), pin.image).toBe(true);
          expect(parseFloat(pin.x), `${photo.image}: ${pin.title}`).toBeGreaterThanOrEqual(0);
          expect(parseFloat(pin.x), `${photo.image}: ${pin.title}`).toBeLessThanOrEqual(100);
          expect(parseFloat(pin.y), `${photo.image}: ${pin.title}`).toBeGreaterThanOrEqual(0);
          expect(parseFloat(pin.y), `${photo.image}: ${pin.title}`).toBeLessThanOrEqual(100);
          if (pin.imageQuadrant != null) expect(pin.imageQuadrant).toBeGreaterThanOrEqual(0);
          if (pin.imageQuadrant != null) expect(pin.imageQuadrant).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  test('only covers with visible footwear include a shoe pin and unavailable placeholder', () => {
    expect(spreads.map(spread => spread.hotspots.some(pin => pin.category === 'Shoes')))
      .toEqual([true, true, false, true, true, true]);
    for (const spread of spreads) {
      for (const shoe of spread.shoppableItems.filter(item => item.category === 'Shoes')) {
        expect(shoe.price).toBeNull();
        expect(shoe.inStock).toBe(false);
        expect(shoe.linked).toBe(false);
        expect(spread.hotspots.some(pin => pin.productId === shoe.id)).toBe(true);
      }
    }
  });
});
