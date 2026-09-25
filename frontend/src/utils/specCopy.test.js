/* An English reader met Thai in the size guide, the care list and the product
   record, because the spec records were written in Thai only. Every string the
   catalogue's specs carry must have English. */
import { describe, test, expect } from 'vitest';
import { productsData } from '../data/productsData';
import { localizeSpecs, specText } from './specCopy';

const THAI = /[฀-๿]/;
const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
};

describe('product spec copy', () => {
  test('no spec in the catalogue shows Thai to an English reader', () => {
    const left = new Set();
    for (const product of productsData) {
      strings(localizeSpecs(product.specs, 'en')).filter((s) => THAI.test(s)).forEach((s) => left.add(s));
    }
    expect([...left]).toEqual([]);
  });

  test('"Thai (English)" lines give their English part', () => {
    expect(specText('ซักเครื่องด้วยน้ำเย็น โหมดถนอมผ้า (Cold gentle wash)', 'en')).toBe('Cold gentle wash');
    expect(specText('รอบเอว (Waist)', 'en')).toBe('Waist');
  });

  test('Thai readers get the record unchanged', () => {
    const specs = productsData.find((p) => p.specs).specs;
    expect(localizeSpecs(specs, 'th')).toBe(specs);
  });

  test('the English status label is used when the record has one', () => {
    expect(localizeSpecs({ statusLabel: 'ข้อมูลตัวอย่าง รอยืนยันจากร้าน', statusLabelEn: 'Sample Specification' }, 'en').statusLabel).toBe('Sample Specification');
  });
});
