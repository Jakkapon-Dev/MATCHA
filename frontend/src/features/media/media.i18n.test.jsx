/* The media manager's copy comes from translations: the Thai it always had
 * (with Lookbook / Look / Hotspot kept English), natural English in EN, and a
 * language switch re-renders the words without touching the editor state. */
import React from 'react';
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

let mockLang = 'th';
let manager;
vi.mock('./useMediaManager', () => ({ default: () => manager }));
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return { useLanguage: () => ({ lang: mockLang, t: (key, vars) => {
    const v = resolve(translations[mockLang], key) ?? resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  } }) };
});

const { default: MediaManager } = await import('./MediaManager');
const { default: { en, th } } = await import('../../i18n/admin/media.js');

const products = [{ _id: 'a1', id: 'JACKET-1', name: 'Test Jacket', color: 'Black', category: 'Outerwear', price: 80, image: '/j.jpg', variants: [] }];
const look = { id: 'SPREAD-01', title: 'Ginza', heroImage: '/images/look.jpg', published: false, revision: 2, items: [{ productId: 'JACKET-1', color: 'Black', x: 40, y: 30 }] };

beforeEach(() => {
  manager = {
    assets: [{ _id: 'm1', url: '/api/media/files/abc.webp', alt: 'Studio shot' }], looks: [look], products,
    loading: false, busy: false, error: '', notice: '', page: 1, setPage: vi.fn(), archived: false, setArchived: vi.fn(),
    total: 1, search: '', setSearch: vi.fn(), productPage: 1, setProductPage: vi.fn(), productTotal: 1,
    reload: vi.fn(), saveLook: vi.fn(async () => ({ success: true }))
  };
});
afterEach(() => { cleanup(); mockLang = 'th'; });

const flatKeys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const text = () => document.body.textContent;

describe('media manager copy', () => {
  test('en and th carry the same keys', () => {
    expect(flatKeys(th).sort()).toEqual(flatKeys(en).sort());
  });

  test('TH shows Thai with Lookbook / Look / Hotspot kept English; EN shows English; switching both ways updates it', () => {
    const { rerender } = render(<MediaManager initialTab="looks" />);
    fireEvent.change(screen.getByLabelText('เลือก Look'), { target: { value: 'SPREAD-01' } });

    // Thai, with the feature names in English.
    expect(screen.getByRole('heading', { name: 'รูปสินค้าและ Lookbook' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'แก้ไข Look' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lookbook' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'คลังรูป' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'เพิ่ม Hotspot' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ลบ Hotspot' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บันทึก Lookbook' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /สร้าง Look ใหม่/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'ก่อนหน้า' }).length).toBeGreaterThan(0);
    expect(within(screen.getByTestId('pin-board')).getByRole('button', { name: 'Hotspot 1: Test Jacket' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Ginza (ซ่อนอยู่) · 1 จุด' })).toBeTruthy();
    expect(text()).toContain('หน้า 1 / 1');
    expect(text()).not.toMatch(/ลุค|จุดร้อน|สมุดลุค/);

    mockLang = 'en';
    rerender(<MediaManager initialTab="looks" />);
    // The open look survives the switch; only the words change.
    expect(screen.getByRole('heading', { name: 'Product images & Lookbook' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Edit Look' })).toBeTruthy();
    for (const name of ['Library', 'Product images', 'Lookbook', 'Add Hotspot', 'Remove Hotspot', 'Save Lookbook', 'Previous', 'Next', 'Reload', 'Search']) {
      expect(screen.getAllByRole('button', { name }).length).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText('Select Look')).toBeTruthy();
    expect(screen.getByLabelText('Look title')).toBeTruthy();
    expect(screen.getByLabelText('Horizontal (%)')).toBeTruthy();
    expect(within(screen.getByTestId('pin-board')).getByRole('button', { name: 'Hotspot 1: Test Jacket' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Ginza (hidden) · Hotspots: 1' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /View Lookbook page/ })).toBeTruthy();
    expect(text()).toContain('Page 1 / 1');
    expect(text()).not.toMatch(/[฀-๿]/);

    mockLang = 'th';
    rerender(<MediaManager initialTab="looks" />);
    expect(screen.getByRole('heading', { name: 'แก้ไข Look' })).toBeTruthy();
    expect(screen.getByLabelText('ชื่อ Look')).toBeTruthy();
    expect(screen.queryByText('Edit Look')).toBeNull();
  });

  test('a pin without a product and a duplicate product read in the current language', () => {
    mockLang = 'en';
    render(<MediaManager initialTab="looks" />);
    fireEvent.change(screen.getByLabelText('Select Look'), { target: { value: 'SPREAD-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Hotspot' }));
    expect(within(screen.getByTestId('pin-board')).getByRole('button', { name: 'Hotspot 2: No product selected' })).toBeTruthy();
    fireEvent.change(screen.getAllByLabelText('Product')[1], { target: { value: 'JACKET-1' } });
    expect(screen.getAllByRole('alert').some((a) => /already in the Look/.test(a.textContent))).toBe(true);
    expect(screen.getByRole('button', { name: 'Save Lookbook' }).disabled).toBe(true);
  });

  test('the library tab reads in both languages', () => {
    const { rerender } = render(<MediaManager initialTab="library" />);
    expect(screen.getByRole('button', { name: 'อัปโหลดรูป' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บันทึกคำอธิบาย' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'ภาพ Lookbook เดิม 16 รูป' })).toBeTruthy();
    mockLang = 'en';
    rerender(<MediaManager initialTab="library" />);
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save description' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The 16 original Lookbook photos' })).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Iridescent purple jacket, front view')).toBeTruthy();
    expect(text()).not.toMatch(/[฀-๿]/);
  });
});
