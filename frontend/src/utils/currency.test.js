import { describe, test, expect } from 'vitest';
import { formatCurrency } from './currency.js';

describe('formatCurrency', () => {
  test('formats integers with two decimal places', () => {
    expect(formatCurrency(45)).toBe('$45.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('formats decimals with exactly two decimal places', () => {
    expect(formatCurrency(45.5)).toBe('$45.50');
    expect(formatCurrency(0.1)).toBe('$0.10');
    expect(formatCurrency(1234.56)).toBe('$1234.56');
    expect(formatCurrency(45.556)).toBe('$45.56');
  });

  test('does not introduce comma separators (preserves exact repository format)', () => {
    expect(formatCurrency(1234.56)).toBe('$1234.56');
    expect(formatCurrency(10000)).toBe('$10000.00');
  });

  test('formats numeric strings', () => {
    expect(formatCurrency('45')).toBe('$45.00');
    expect(formatCurrency('45.5')).toBe('$45.50');
    expect(formatCurrency('1234.56')).toBe('$1234.56');
  });

  test('handles null, undefined, and empty string by falling back to $0.00', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
    expect(formatCurrency('')).toBe('$0.00');
  });
});
