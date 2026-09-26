import { describe, expect, test } from 'vitest';
import { coverPointPosition } from './useCoverCoordinates';

const source = { naturalWidth: 896, naturalHeight: 1200 };
const point = { x: '64%', y: '87%' };

describe('coverPointPosition', () => {
  test('keeps a pin on the same image coordinate at portrait sizes', () => {
    for (const frame of [{ ...source, width: 280, height: 375 }, { ...source, width: 560, height: 750 }]) {
      const result = coverPointPosition(point, frame);
      expect(parseFloat(result.left)).toBeCloseTo(64, 1);
      expect(parseFloat(result.top)).toBeCloseTo(87, 1);
    }
  });

  test('compensates for the visible crop at narrow and wide breakpoints', () => {
    for (const frame of [{ ...source, width: 390, height: 500 }, { ...source, width: 900, height: 450 }]) {
      const result = coverPointPosition(point, frame, 0.5, 0.18);
      const scale = Math.max(frame.width / source.naturalWidth, frame.height / source.naturalHeight);
      const imageWidth = source.naturalWidth * scale;
      const imageHeight = source.naturalHeight * scale;
      expect(parseFloat(result.left) / 100 * frame.width).toBeCloseTo(0.64 * imageWidth - (imageWidth - frame.width) * 0.5, 5);
      expect(parseFloat(result.top) / 100 * frame.height).toBeCloseTo(0.87 * imageHeight - (imageHeight - frame.height) * 0.18, 5);
    }
  });
});
