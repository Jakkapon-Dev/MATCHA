export const THAI_PHONE_RE = /^0[0-9]{8,9}$/;
export const POSTAL_CODE_RE = /^[0-9]{5}$/;

/**
 * Strips whitespace, dashes, and parentheses from a phone input.
 */
export function normalizePhone(value) {
  return String(value ?? '').replace(/[\s()-]/g, '').trim();
}

/**
 * Checks whether a phone number is a valid 9 or 10-digit Thai phone number starting with 0.
 * Strips common punctuation (spaces, dashes, parens) before validation.
 */
export function isValidThaiPhone(value) {
  const normalized = normalizePhone(value);
  return Boolean(normalized) && THAI_PHONE_RE.test(normalized);
}

/**
 * Trims surrounding whitespace from a postal code input.
 */
export function normalizePostalCode(value) {
  return String(value ?? '').trim();
}

/**
 * Checks whether a postal code is exactly 5 digits.
 */
export function isValidPostalCode(value) {
  return POSTAL_CODE_RE.test(normalizePostalCode(value));
}
