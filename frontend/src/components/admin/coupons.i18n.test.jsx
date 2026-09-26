/* The coupon screen in Thai and English: every visible string follows the
 * admin's language, "Coupon" stays English inside Thai copy, and the values
 * sent to the API are never translated. */
import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';

const api = {
  getAdminCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  setCouponActive: vi.fn(),
  getAdminProducts: vi.fn(async () => ({ success: true, data: [] }))
};
vi.mock('../../services/api', () => ({ api, apiErrorText: (e) => e?.message || 'failed' }));

let mockLang = 'th';
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  // One stable t per language, like the real context (CouponsTab reloads when t changes).
  const cache = {};
  const tFor = (lang) => (cache[lang] ||= (key, vars) => {
    const v = resolve(translations[lang], key) ?? resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  });
  return { useLanguage: () => ({ lang: mockLang, t: tFor(mockLang) }) };
});

const { default: CouponsTab } = await import('./CouponsTab');

const ROWS = [
  { id: 'c1', code: 'AUTUMN10', description: 'Autumn launch', type: 'percentage', value: 10, maxDiscountAmount: 25, minOrderAmount: 50, usedCount: 3, usageLimit: 100, perUserLimit: 1, active: true, status: 'active', label: '10% OFF', applicableCategories: ['Tops'], applicableProducts: ['P1', 'P2'], startsAt: null, expiresAt: '2099-01-01T00:00:00.000Z' },
  { id: 'c2', code: 'OLD5', type: 'fixed_amount', value: 5, usedCount: 0, usageLimit: null, active: false, status: 'disabled', label: '$5.00 OFF', applicableCategories: [], applicableProducts: [] },
  { id: 'c3', code: 'SHIPFREE', type: 'free_shipping', value: 0, usedCount: 7, usageLimit: 7, active: true, status: 'exhausted', label: 'Free Shipping', applicableCategories: [], applicableProducts: [] },
  { id: null, code: 'MATCHA15', builtIn: true, type: 'percentage', value: 15, usedCount: 0, usageLimit: null, active: true, status: 'active', label: '15% OFF', applicableCategories: [], applicableProducts: [] }
];

beforeEach(() => {
  mockLang = 'th';
  Object.values(api).forEach(fn => fn.mockClear?.());
  api.getAdminCoupons.mockResolvedValue({ success: true, data: ROWS });
});
afterEach(cleanup);

const row = (code) => screen.getByText(code, { selector: 'div' }).closest('tr');
const headers = () => screen.getAllByRole('columnheader').map(th => th.textContent);

describe('admin coupons in Thai', () => {
  test('toolbar, headers, badges and row text are Thai; Coupon stays English', async () => {
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');

    const add = screen.getByRole('button', { name: /เพิ่ม Coupon/ });
    expect(add.textContent.trim()).toBe('เพิ่ม Coupon');
    expect(headers()).toEqual(['รหัส', 'สถานะ', 'ส่วนลด', 'การใช้งาน', 'เริ่มใช้', 'หมดอายุ', 'จัดการ']);

    const chips = within(screen.getByRole('group', { name: 'กรองตามสถานะ' })).getAllByRole('button').map(b => b.textContent);
    expect(chips).toEqual(['ทั้งหมด', 'เปิดใช้งาน', 'รอเริ่มใช้', 'หมดอายุ', 'ใช้ครบแล้ว', 'ปิดใช้งาน']);

    const autumn = row('AUTUMN10');
    expect(within(autumn).getByText('เปิดใช้งาน', { selector: 'span' })).toBeTruthy();
    expect(within(autumn).getByText('ลด 10%')).toBeTruthy();
    expect(within(autumn).getByText('สูงสุด $25.00 · ขั้นต่ำ $50.00 · เสื้อ, 2 สินค้า')).toBeTruthy();
    expect(within(autumn).getByText('1 ครั้งต่อผู้ใช้')).toBeTruthy();
    expect(within(autumn).getByRole('button', { name: 'แก้ไข AUTUMN10' }).textContent.trim()).toBe('แก้ไข');
    expect(within(autumn).getByRole('button', { name: 'ปิดใช้งาน AUTUMN10' })).toBeTruthy();
    expect(within(autumn).getByText(/2642/)).toBeTruthy(); // th-TH date: Buddhist year for 2099

    const old = row('OLD5');
    expect(within(old).getByText('ปิดใช้งาน', { selector: 'span' })).toBeTruthy();
    expect(within(old).getByText('ลด $5.00')).toBeTruthy();
    expect(within(old).getByRole('button', { name: 'เปิดใช้งาน OLD5' })).toBeTruthy();

    const ship = row('SHIPFREE');
    expect(within(ship).getByText('ใช้ครบแล้ว')).toBeTruthy();
    expect(within(ship).getByText('ส่งฟรี')).toBeTruthy();

    const builtIn = row('MATCHA15');
    expect(within(builtIn).getByText('รหัสในตัวระบบ')).toBeTruthy();
    expect(within(builtIn).getByRole('button', { name: 'ปรับแต่ง MATCHA15' })).toBeTruthy();
  });

  test('empty states and notices are Thai', async () => {
    api.getAdminCoupons.mockResolvedValue({ success: true, data: [] });
    render(<CouponsTab />);
    expect(await screen.findByText('ยังไม่มี Coupon เพิ่ม Coupon แรกได้เลย')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'หมดอายุ' }));
    expect(await screen.findByText('ไม่พบ Coupon ที่ตรงกับตัวกรองปัจจุบัน')).toBeTruthy();
    await waitFor(() => expect(api.getAdminCoupons).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'expired' })));
  });

  test('toggle notice is Thai', async () => {
    api.setCouponActive.mockResolvedValue({ success: true, data: { code: 'AUTUMN10', active: false } });
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: 'ปิดใช้งาน AUTUMN10' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('ปิดใช้งาน AUTUMN10 แล้ว'));
  });

  test('switching language re-renders the text both ways', async () => {
    mockLang = 'en';
    const { rerender } = render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    expect(screen.getByRole('button', { name: /add coupon/i })).toBeTruthy();
    expect(headers()).toEqual(['Code', 'Status', 'Discount', 'Usage', 'Starts', 'Expires', 'Actions']);
    expect(within(row('AUTUMN10')).getByText('10% OFF')).toBeTruthy();
    expect(within(row('OLD5')).getByText('$5.00 OFF')).toBeTruthy();
    expect(within(row('SHIPFREE')).getByText('Free Shipping')).toBeTruthy();
    expect(within(row('SHIPFREE')).getByText('Used up')).toBeTruthy();
    expect(within(row('AUTUMN10')).getByText('max $25.00 · min $50.00 · Tops, 2 products')).toBeTruthy();
    expect(within(row('AUTUMN10')).getByText(/2099/)).toBeTruthy();

    mockLang = 'th';
    rerender(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    expect(screen.getByRole('button', { name: /เพิ่ม Coupon/ })).toBeTruthy();
    expect(screen.getByText('ส่วนลด')).toBeTruthy();
    expect(within(row('AUTUMN10')).getByText('ลด 10%')).toBeTruthy();

    mockLang = 'en';
    rerender(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    expect(screen.queryByText('ส่วนลด')).toBeNull();
    expect(screen.getByText('Discount')).toBeTruthy();
    expect(within(row('AUTUMN10')).getByText('10% OFF')).toBeTruthy();
  });

  test('the form reads Thai, validates in Thai and sends the same payload', async () => {
    api.createCoupon.mockResolvedValue({ success: true, data: { code: 'WELCOME100' } });
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: /เพิ่ม Coupon/ }));
    const dialog = screen.getByRole('dialog', { name: 'เพิ่ม Coupon' });

    for (const label of ['รหัส Coupon', 'ประเภทส่วนลด', 'มูลค่าส่วนลด', 'ส่วนลดสูงสุด', 'ยอดสั่งซื้อขั้นต่ำ', 'จำนวนครั้งที่ใช้ได้', 'จำกัดต่อผู้ใช้', 'วันที่เริ่มใช้', 'วันหมดอายุ']) {
      expect(within(dialog).getByText(label)).toBeTruthy();
    }
    const options = within(dialog).getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['ลดเป็นเปอร์เซ็นต์', 'ลดเป็นจำนวนเงิน', 'ส่งฟรี']);
    expect(options.map(o => o.value)).toEqual(['percentage', 'fixed_amount', 'free_shipping']);
    expect(within(dialog).getByRole('button', { name: 'ปิด' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'ยกเลิก' })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'สร้าง Coupon' }));
    expect(within(dialog).getByText('ใช้ตัวอักษร ตัวเลข - หรือ _ จำนวน 3–30 ตัว')).toBeTruthy();
    expect(within(dialog).getByText('กรอกเปอร์เซ็นต์ตั้งแต่ 1 ถึง 100')).toBeTruthy();
    expect(api.createCoupon).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByPlaceholderText('MATCHA10'), { target: { value: 'welcome100' } });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'fixed_amount' } });
    fireEvent.change(within(dialog).getByPlaceholderText('20.00'), { target: { value: '100' } });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '300' } });
    fireEvent.click(within(dialog).getByText('รองเท้า')); // stored as 'Shoes'
    fireEvent.click(within(dialog).getByRole('button', { name: 'สร้าง Coupon' }));

    await waitFor(() => expect(api.createCoupon).toHaveBeenCalledTimes(1));
    expect(api.createCoupon.mock.calls[0][0]).toEqual({
      code: 'WELCOME100', description: '', type: 'fixed_amount', value: 100, minOrderAmount: 300, maxDiscountAmount: null,
      startsAt: null, expiresAt: null, usageLimit: null, perUserLimit: null, active: true,
      applicableProducts: [], applicableCategories: ['Shoes']
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('บันทึก WELCOME100 แล้ว');
  });

  test('edit and customise titles are Thai', async () => {
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: 'แก้ไข AUTUMN10' }));
    const dialog = screen.getByRole('dialog', { name: 'แก้ไข AUTUMN10' });
    expect(within(dialog).getByText('ล็อกแล้ว — มีการใช้ไปแล้ว')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'ยกเลิก' }));

    fireEvent.click(screen.getByRole('button', { name: 'ปรับแต่ง MATCHA15' }));
    const custom = screen.getByRole('dialog', { name: 'ปรับแต่ง MATCHA15' });
    expect(within(custom).getByText(/MATCHA15 เป็นรหัสในตัวระบบ/)).toBeTruthy();
  });
});
