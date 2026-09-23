/* An address that said the same place three times.
 *
 * Checkout collects one location — the box is labelled "City or district" — but
 * the address book stores subdistrict, district and province, and its API
 * requires all three. rememberAddress therefore writes the one value into all
 * three, and reading it back literally produced "Bangkok, Bangkok, Bangkok" in
 * the account's address book and in the saved-address card at checkout.
 * Measured on production after placing an order with City = Bangkok.
 *
 * Repeating a name does not make it three places.
 */

import { describe, test, expect } from 'vitest';
import { formatAddressArea } from './addressBook';

describe('formatAddressArea', () => {
  test('one place named three times is written once', () => {
    expect(formatAddressArea(['Bangkok', 'Bangkok', 'Bangkok'])).toBe('Bangkok');
  });

  test('real detail is kept, in the order it was given', () => {
    expect(formatAddressArea(['Khlong Toei Nuea', 'Watthana', 'Bangkok']))
      .toBe('Khlong Toei Nuea, Watthana, Bangkok');
  });

  test('a repeat is dropped wherever it falls, not just when adjacent', () => {
    expect(formatAddressArea(['Bangkok', 'Watthana', 'Bangkok']))
      .toBe('Bangkok, Watthana');
  });

  test('the same name in another case is still the same name', () => {
    expect(formatAddressArea(['Bangkok', 'bangkok', 'BANGKOK'])).toBe('Bangkok');
  });

  test('blanks, spaces and missing values leave no stray commas', () => {
    expect(formatAddressArea(['Watthana', '', null, undefined, '  ', 'Bangkok']))
      .toBe('Watthana, Bangkok');
    expect(formatAddressArea([])).toBe('');
  });

  test('surrounding whitespace does not hide a duplicate', () => {
    expect(formatAddressArea([' Bangkok ', 'Bangkok'])).toBe('Bangkok');
  });
});
