import { describe, test, expect } from 'vitest';
import {
  normalizePhone,
  isValidThaiPhone,
  normalizePostalCode,
  isValidPostalCode,
  THAI_PHONE_RE,
  POSTAL_CODE_RE
} from './contactValidation.js';

describe('normalizePhone', () => {
  test('strips spaces, dashes, and parentheses', () => {
    expect(normalizePhone('081-234-5678')).toBe('0812345678');
    expect(normalizePhone('081 234 5678')).toBe('0812345678');
    expect(normalizePhone('(02) 123-4567')).toBe('021234567');
  });

  test('handles empty and nullish values', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
    expect(normalizePhone('   ')).toBe('');
  });
});

describe('isValidThaiPhone', () => {
  test('accepts valid 10-digit mobile and 9-digit landline numbers', () => {
    expect(isValidThaiPhone('0812345678')).toBe(true);
    expect(isValidThaiPhone('021234567')).toBe(true);
    expect(isValidThaiPhone('081-234-5678')).toBe(true);
    expect(isValidThaiPhone('081 234 5678')).toBe(true);
    expect(isValidThaiPhone('(02) 123-4567')).toBe(true);
  });

  test('rejects numbers of wrong length or without leading 0', () => {
    expect(isValidThaiPhone('081234')).toBe(false);
    expect(isValidThaiPhone('08123456789')).toBe(false);
    expect(isValidThaiPhone('1812345678')).toBe(false);
    expect(isValidThaiPhone('+66812345678')).toBe(false);
    expect(isValidThaiPhone('081abcdefg')).toBe(false);
    expect(isValidThaiPhone('')).toBe(false);
    expect(isValidThaiPhone(null)).toBe(false);
  });
});

describe('normalizePostalCode', () => {
  test('trims surrounding whitespace', () => {
    expect(normalizePostalCode(' 10110 ')).toBe('10110');
    expect(normalizePostalCode('10110')).toBe('10110');
    expect(normalizePostalCode(null)).toBe('');
  });
});

describe('isValidPostalCode', () => {
  test('accepts 5 digit postal codes', () => {
    expect(isValidPostalCode('10110')).toBe(true);
    expect(isValidPostalCode(' 10110 ')).toBe(true);
  });

  test('rejects invalid length or non-numeric postal codes', () => {
    expect(isValidPostalCode('1011')).toBe(false);
    expect(isValidPostalCode('101100')).toBe(false);
    expect(isValidPostalCode('1011A')).toBe(false);
    expect(isValidPostalCode('10 110')).toBe(false);
    expect(isValidPostalCode('')).toBe(false);
    expect(isValidPostalCode(null)).toBe(false);
  });
});
