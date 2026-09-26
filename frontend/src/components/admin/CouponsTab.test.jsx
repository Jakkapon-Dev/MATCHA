/* The admin coupon screen: list, create, edit, enable/disable.
 * Amounts entered here are only ever validated and priced by the server. */
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
// A real resolver over the English copy, so the assertions read the screen's actual English.
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const t = (key, vars) => {
    const v = resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  };
  return { useLanguage: () => ({ lang: 'en', t }) };
});

const { default: CouponsTab } = await import('./CouponsTab');

const ROWS = [
  { id: 'c1', code: 'AUTUMN10', description: 'Autumn launch', type: 'percentage', value: 10, maxDiscountAmount: 25, minOrderAmount: 50, usedCount: 3, usageLimit: 100, perUserLimit: 1, active: true, status: 'active', label: '10% OFF', applicableCategories: ['Tops'], applicableProducts: [], startsAt: null, expiresAt: '2099-01-01T00:00:00.000Z' },
  { id: 'c2', code: 'OLD5', type: 'fixed_amount', value: 5, usedCount: 0, usageLimit: null, active: false, status: 'disabled', label: '$5.00 OFF', applicableCategories: [], applicableProducts: [] },
  { id: null, code: 'MATCHA15', builtIn: true, type: 'percentage', value: 15, usedCount: 0, usageLimit: null, active: true, status: 'active', label: '15% OFF', applicableCategories: [], applicableProducts: [] }
];

beforeEach(() => {
  Object.values(api).forEach(fn => fn.mockClear?.());
  api.getAdminCoupons.mockResolvedValue({ success: true, data: ROWS });
});
afterEach(cleanup);

const row = (code) => screen.getByText(code, { selector: 'div' }).closest('tr');

describe('admin coupons', () => {
  test('lists status, discount, usage and dates', async () => {
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    const autumn = row('AUTUMN10');
    expect(within(autumn).getByText('Active')).toBeTruthy();
    expect(within(autumn).getByText('10% OFF')).toBeTruthy();
    expect(within(autumn).getByText(/max \$25\.00 · min \$50\.00 · Tops/)).toBeTruthy();
    expect(within(autumn).getByText('3 / 100')).toBeTruthy();
    expect(within(autumn).getByText('1 per shopper')).toBeTruthy();
    expect(within(row('OLD5')).getByText('Disabled')).toBeTruthy();
    expect(within(row('MATCHA15')).getByRole('button', { name: 'Customise MATCHA15' })).toBeTruthy();
    expect(within(row('MATCHA15')).queryByRole('button', { name: /disable/i })).toBeNull();
  });

  test('the status filter and the header search go to the server', async () => {
    const { rerender } = render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: 'Expired' }));
    await waitFor(() => expect(api.getAdminCoupons).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'expired', search: '' })));
    rerender(<CouponsTab search="aut" />);
    await waitFor(() => expect(api.getAdminCoupons).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'expired', search: 'aut' })));
  });

  test('Add Coupon validates, then sends a normalised payload', async () => {
    api.createCoupon.mockResolvedValue({ success: true, data: { code: 'WELCOME100' } });
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: /add coupon/i }));
    const dialog = screen.getByRole('dialog', { name: 'Add Coupon' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create coupon' }));
    expect(within(dialog).getByText('Use 3–30 letters, numbers, - or _')).toBeTruthy();
    expect(within(dialog).getByText('Enter a percentage from 1 to 100')).toBeTruthy();
    expect(api.createCoupon).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByPlaceholderText('MATCHA10'), { target: { value: 'welcome100' } });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'fixed_amount' } });
    fireEvent.change(within(dialog).getByPlaceholderText('20.00'), { target: { value: '100' } });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '300' } });
    fireEvent.click(within(dialog).getByText('Shoes'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create coupon' }));

    await waitFor(() => expect(api.createCoupon).toHaveBeenCalledTimes(1));
    expect(api.createCoupon.mock.calls[0][0]).toEqual({
      code: 'WELCOME100', description: '', type: 'fixed_amount', value: 100, minOrderAmount: 300, maxDiscountAmount: null,
      startsAt: null, expiresAt: null, usageLimit: null, perUserLimit: null, active: true,
      applicableProducts: [], applicableCategories: ['Shoes']
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('WELCOME100 saved');
  });

  test('editing keeps the id and shows a server refusal in the form', async () => {
    api.updateCoupon.mockRejectedValue(new Error('จำนวนสิทธิ์ต้องไม่น้อยกว่าจำนวนที่ถูกใช้ไปแล้ว'));
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: 'Edit AUTUMN10' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit AUTUMN10' });
    expect(within(dialog).getByPlaceholderText('MATCHA10').disabled).toBe(true); // already used
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(api.updateCoupon).toHaveBeenCalledWith('c1', expect.objectContaining({ code: 'AUTUMN10', value: 10, maxDiscountAmount: 25, usageLimit: 100 })));
    expect((await within(dialog).findByRole('alert')).textContent).toMatch(/จำนวนสิทธิ์/);
  });

  test('disable and enable go through the status endpoint', async () => {
    api.setCouponActive.mockResolvedValue({ success: true, data: { code: 'AUTUMN10', active: false } });
    render(<CouponsTab />);
    await screen.findByText('AUTUMN10');
    fireEvent.click(screen.getByRole('button', { name: 'Disable AUTUMN10' }));
    await waitFor(() => expect(api.setCouponActive).toHaveBeenCalledWith('c1', false));
    fireEvent.click(await screen.findByRole('button', { name: 'Enable OLD5' }));
    await waitFor(() => expect(api.setCouponActive).toHaveBeenCalledWith('c2', true));
  });

  test('a failed load says so instead of showing an empty list', async () => {
    api.getAdminCoupons.mockRejectedValue(new Error('Database unavailable'));
    render(<CouponsTab />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/Database unavailable/);
  });

  test('a demo session cannot change coupons', async () => {
    render(<CouponsTab isDemo />);
    await screen.findByText('AUTUMN10');
    expect(screen.getByRole('button', { name: /add coupon/i }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Disable AUTUMN10' }).disabled).toBe(true);
  });
});
