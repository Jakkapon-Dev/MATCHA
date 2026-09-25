/* The garment form and the order tracking modal read their copy through the
 * translator, so switching the admin's language changes every visible word
 * while the values the code compares or sends (category, status) stay English. */

import React from 'react';
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

let mockLang = 'th';
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return { useLanguage: () => ({ lang: mockLang, t: (key, vars) => {
    const v = resolve(translations[mockLang], key) ?? resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  } }) };
});
const showToast = vi.fn();
vi.mock('../../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast }) }));

const { default: AddProductModal } = await import('./AddProductModal');
const { default: OrderTrackingModal } = await import('./OrderTrackingModal');
const { default: productCopy } = await import('../../i18n/admin/product.js');
const { default: ordersCopy } = await import('../../i18n/admin/orders.js');

const order = {
  id: 'ORD-1042',
  customer: 'Somchai Jaidee',
  email: 'somchai@example.com',
  phone: '+66 81 234 5678',
  address: '99 Sukhumvit Rd, Bangkok 10110',
  items: 2,
  total: 96,
  status: 'Processing',
  paymentStatus: 'Paid',
  date: '2026-08-20',
  coupon: null,
};

const productModal = () => (
  <AddProductModal isOpen onClose={() => {}} onAddProduct={async () => true} saving={false} saveError={null} />
);
const orderModal = () => (
  <OrderTrackingModal isOpen onClose={() => {}} order={order} onUpdateStatus={async () => true} saveError={null} />
);

const keysOf = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();

beforeEach(() => { mockLang = 'th'; });
afterEach(cleanup);

describe('admin copy files', () => {
  test('Thai and English carry exactly the same keys', () => {
    expect(keysOf(productCopy.th)).toEqual(keysOf(productCopy.en));
    expect(keysOf(ordersCopy.th)).toEqual(keysOf(ordersCopy.en));
  });
});

describe('AddProductModal', () => {
  test('renders Thai in TH, keeping SKU and the category values English', () => {
    render(productModal());
    const dialog = screen.getByRole('dialog', { name: 'เพิ่มสินค้าใหม่' });
    expect(within(dialog).getByText('ชื่อสินค้า')).toBeTruthy();
    expect(within(dialog).getByText('รหัส SKU')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /เผยแพร่เข้าสต็อก/ })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'ยกเลิก' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'ปิด' })).toBeTruthy();
    expect(screen.queryByText('Add New Garment Release')).toBeNull();

    const tops = within(dialog).getByRole('option', { name: 'เสื้อและนิตแวร์' });
    expect(tops.value).toBe('Tops');
  });

  test('renders the current English in EN', () => {
    mockLang = 'en';
    render(productModal());
    expect(screen.getByRole('dialog', { name: 'Add New Garment Release' })).toBeTruthy();
    expect(screen.getByText('SKU Identifier')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. MatchA Heavyweight Boxy Tee')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Tops & Knitwear' }).value).toBe('Tops');
    expect(screen.getByRole('button', { name: /publish to inventory/i })).toBeTruthy();
  });

  test('switching language re-renders the copy both ways', () => {
    const { rerender } = render(productModal());
    expect(screen.getByText('หมวดหมู่')).toBeTruthy();
    mockLang = 'en';
    rerender(productModal());
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.queryByText('หมวดหมู่')).toBeNull();
    mockLang = 'th';
    rerender(productModal());
    expect(screen.getByText('หมวดหมู่')).toBeTruthy();
    expect(screen.queryByText('Category')).toBeNull();
  });

  test('validation errors are Thai in TH and English in EN', () => {
    const { container, unmount } = render(productModal());
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByText('กรุณากรอกชื่อสินค้า')).toBeTruthy();
    expect(screen.getByText('กรุณากรอกรายละเอียดสินค้า')).toBeTruthy();
    expect(screen.queryByText('Garment name is required')).toBeNull();
    unmount();

    mockLang = 'en';
    const en = render(productModal());
    fireEvent.submit(en.container.querySelector('form'));
    expect(screen.getByText('Garment name is required')).toBeTruthy();
  });
});

describe('OrderTrackingModal', () => {
  test('renders Thai in TH, with the status option values still English', () => {
    render(orderModal());
    const dialog = screen.getByRole('dialog', { name: 'คำสั่งซื้อ ORD-1042' });
    expect(within(dialog).getByText('ชื่อลูกค้า')).toBeTruthy();
    expect(within(dialog).getByText('กำหนดการโดยประมาณ')).toBeTruthy();
    expect(within(dialog).getByText('ชำระแล้ว')).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'กำลังเตรียมสินค้า' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /ยืนยันสถานะ/ })).toBeTruthy();

    const select = within(dialog).getByRole('combobox');
    const values = within(select).getAllByRole('option').map((o) => o.value);
    expect(values).toEqual(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
    expect(select.value).toBe('Processing');
    expect(within(select).getByRole('option', { name: 'จัดส่งแล้ว' }).value).toBe('Shipped');
  });

  test('renders the current English in EN', () => {
    mockLang = 'en';
    render(orderModal());
    const dialog = screen.getByRole('dialog', { name: 'Order ORD-1042' });
    expect(within(dialog).getByText('Customer Name')).toBeTruthy();
    expect(within(dialog).getByText('Expected schedule')).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'Processing' })).toBeTruthy();
    expect(within(dialog).getByText('Paid')).toBeTruthy();
    expect(within(dialog).getByRole('option', { name: 'Shipped' }).value).toBe('Shipped');
  });

  test('switching language re-renders the copy both ways', () => {
    mockLang = 'en';
    const { rerender } = render(orderModal());
    expect(screen.getByText('Delivery Address')).toBeTruthy();
    mockLang = 'th';
    rerender(orderModal());
    expect(screen.getByText('ที่อยู่จัดส่ง')).toBeTruthy();
    expect(screen.queryByText('Delivery Address')).toBeNull();
    mockLang = 'en';
    rerender(orderModal());
    expect(screen.getByText('Delivery Address')).toBeTruthy();
    expect(screen.queryByText('ที่อยู่จัดส่ง')).toBeNull();
  });

  test('keeps Coupon as an English term and toasts in Thai', () => {
    render(<OrderTrackingModal isOpen onClose={() => {}} onUpdateStatus={async () => true} saveError={null}
      order={{ ...order, coupon: { code: 'MATCHA10', type: 'free_shipping', discountAmount: 0 } }} />);
    expect(screen.getByText('Coupon:')).toBeTruthy();
    expect(screen.getByText(/ส่งฟรี/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /คืนสินค้า/ }));
    expect(showToast).toHaveBeenCalledWith('ระบบคืนสินค้ายังไม่เปิดใช้งาน', 'info');
  });
});
