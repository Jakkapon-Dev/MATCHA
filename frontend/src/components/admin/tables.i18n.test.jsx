/* The admin tables read their copy from translations: Thai in TH, the English
 * the console always showed in EN, and switching language re-renders the
 * words while the values the code compares and sends stay English. */
import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
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

const { default: InventoryTab } = await import('./InventoryTab');
const { default: OrdersTab } = await import('./OrdersTab');
const { default: MembersTab } = await import('./MembersTab');
const { default: AdminPagination } = await import('./AdminPagination');
const { default: { en, th } } = await import('../../i18n/admin/tables.js');
const { normalizeOrder } = await import('./adminData');

afterEach(() => { cleanup(); mockLang = 'th'; });

const pagination = { page: 2, totalPages: 5, total: 42 };
const inventory = [{
  id: 'SKU-1', name: 'Wool Coat', color: 'Camel', fit: 'Regular', category: 'Outerwear', price: 120, stock: 3,
  status: 'Low Stock', image: '/c.jpg', needsSizeChoice: true, sizeStock: [{ size: 'M', stock: 3 }],
}];
const inventoryTab = () => <InventoryTab status={{ inventory: 'ready' }} errors={{}}
  inventoryCategoryFilter="ALL" setInventoryCategoryFilter={vi.fn()} inventoryStatusFilter="ALL" setInventoryStatusFilter={vi.fn()}
  filteredInventory={inventory} restockAmounts={{}} restockSizes={{}} handleRestockSizeChange={vi.fn()}
  handleRestockInputChange={vi.fn()} handleRestockSubmit={vi.fn()} saving={false} isDemo={false}
  handleDeleteProduct={vi.fn()} pagination={pagination} onPageChange={vi.fn()} />;

const orders = [normalizeOrder({ orderId: 'ORD-1', status: 'processing', paymentStatus: 'paid', total: 50, createdAt: '2026-09-07T00:00:00Z' })];
const handleUpdateOrderStatus = vi.fn();
const ordersTab = () => <OrdersTab status={{ orders: 'ready' }} errors={{}} filteredOrders={orders}
  orderStatusFilter="ALL" setOrderStatusFilter={vi.fn()} setSelectedOrderForModal={vi.fn()}
  handleUpdateOrderStatus={handleUpdateOrderStatus} saving={false} isDemo={false}
  pagination={pagination} onPageChange={vi.fn()} />;

const members = [
  { id: 'M-1', name: 'Aom', email: 'a@x.test', totalSpent: 900, tier: 'VIP Connoisseur' },
  { id: 'M-2', name: 'Beam', email: 'b@x.test', totalSpent: 10, tier: 'Regular Member' },
  { id: 'M-3', name: 'Cee', email: 'c@x.test', totalSpent: 0, tier: 'Founding Circle' },
];
const membersTab = () => <MembersTab status={{ members: 'ready' }} errors={{}} memberTierFilter="ALL"
  setMemberTierFilter={vi.fn()} filteredMembers={members} handleToggleVIPTier={vi.fn()} saving={false} isDemo={false}
  pagination={pagination} onPageChange={vi.fn()} />;

const text = () => document.body.textContent;
const flatKeys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe('admin tables copy', () => {
  test('en and th carry the same keys', () => {
    expect(flatKeys(th).sort()).toEqual(flatKeys(en).sort());
  });

  test('InventoryTab: Thai in TH, the original English in EN, SKU stays English', () => {
    const { rerender } = render(inventoryTab());
    expect(screen.getByRole('button', { name: 'ทุกหมวดหมู่' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'สินค้า / SKU' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'เติมสต็อกด่วนและการจัดการ' })).toBeTruthy();
    expect(screen.getByLabelText('ไซซ์ที่จะเติมสต็อกของ Wool Coat')).toBeTruthy();
    expect(screen.getByTitle('ลบสินค้า')).toBeTruthy();
    expect(screen.getByText('ใกล้หมด', { selector: 'span' })).toBeTruthy();
    // Filter values stay English; only the labels are Thai.
    const statusFilter = screen.getByDisplayValue('ทุกสถานะ');
    expect([...statusFilter.options].map((o) => o.value)).toEqual(['ALL', 'In Stock', 'Low Stock', 'Out of Stock']);
    expect([...statusFilter.options].map((o) => o.textContent)).toEqual(['ทุกสถานะ', 'มีสินค้า', 'ใกล้หมด', 'สินค้าหมด']);

    mockLang = 'en';
    rerender(inventoryTab());
    expect(screen.getByRole('button', { name: 'All Categories' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Outerwear' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Garment / SKU' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Quick Restock & Actions' })).toBeTruthy();
    expect(screen.getByLabelText('Size to restock for Wool Coat')).toBeTruthy();
    expect(screen.getByLabelText('Stock adjustment for Wool Coat')).toBeTruthy();
    expect(screen.getByTitle('Delete Product')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
    expect(text()).toContain('Stock:');
    expect(text()).not.toMatch(/[฀-๿]/);

    mockLang = 'th';
    rerender(inventoryTab());
    expect(screen.getByRole('button', { name: 'ทุกหมวดหมู่' })).toBeTruthy();
    expect(screen.queryByText('All Categories')).toBeNull();
  });

  test('OrdersTab: status labels are Thai, option values stay English and are sent as English', () => {
    const { rerender } = render(ordersTab());
    expect(screen.getByRole('button', { name: 'คำสั่งซื้อทั้งหมด' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'กำลังเตรียมสินค้า' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'สถานะการจัดส่ง' })).toBeTruthy();
    expect(screen.getByText('ชำระแล้ว')).toBeTruthy();
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('Processing');
    expect([...select.options].map((o) => o.value)).toEqual(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
    expect([...select.options].map((o) => o.textContent)).toEqual(['รอดำเนินการ', 'กำลังเตรียมสินค้า', 'จัดส่งแล้ว', 'ส่งถึงแล้ว', 'ยกเลิกแล้ว']);
    fireEvent.change(select, { target: { value: 'Shipped' } });
    expect(handleUpdateOrderStatus).toHaveBeenCalledWith('ORD-1', 'Shipped');

    mockLang = 'en';
    rerender(ordersTab());
    expect(screen.getByRole('button', { name: 'All Orders' })).toBeTruthy();
    for (const h of ['Order Ref', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Fulfillment Status']) {
      expect(screen.getByRole('columnheader', { name: h })).toBeTruthy();
    }
    expect([...screen.getByRole('combobox').options].map((o) => o.textContent)).toEqual(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(text()).not.toMatch(/[฀-๿]/);

    mockLang = 'th';
    rerender(ordersTab());
    expect(screen.getByRole('button', { name: 'คำสั่งซื้อทั้งหมด' })).toBeTruthy();
  });

  test('MembersTab: tiers are translated for display, unknown tiers shown as stored, VIP stays English', () => {
    const { rerender } = render(membersTab());
    expect(screen.getByRole('button', { name: 'ลูกค้าทั้งหมด' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ระดับ VIP' })).toBeTruthy();
    expect(screen.getByText('สมาชิก VIP')).toBeTruthy();
    expect(screen.getByText('สมาชิกทั่วไป')).toBeTruthy();
    expect(screen.getByText('Founding Circle')).toBeTruthy();
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByRole('button', { name: 'ลดเป็นสมาชิกทั่วไป' })).toBeTruthy();
    expect(within(rows[2]).getByRole('button', { name: 'เลื่อนเป็น VIP 👑' })).toBeTruthy();

    mockLang = 'en';
    rerender(membersTab());
    for (const name of ['All Customers', 'VIP Tier', 'Regular Tier']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByText('VIP Connoisseur')).toBeTruthy();
    expect(screen.getByText('Regular Member')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Demote to Regular' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Promote to VIP 👑' })).toHaveLength(2);
    expect(text()).not.toMatch(/[฀-๿]/);

    mockLang = 'th';
    rerender(membersTab());
    expect(screen.getByText('สมาชิก VIP')).toBeTruthy();
  });

  test('AdminPagination: numbers stay bold in both word orders', () => {
    const pager = () => <AdminPagination page={2} totalPages={5} total={42} onPageChange={vi.fn()} loading />;
    const { container, rerender } = render(pager());
    expect(text()).toContain('แสดงหน้า 2 จาก 5');
    expect(text()).toContain('ทั้งหมด 42 รายการ');
    expect(text()).toContain('กำลังโหลด…');
    expect(screen.getByRole('button', { name: 'ก่อนหน้า' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ถัดไป' })).toBeTruthy();

    mockLang = 'en';
    rerender(pager());
    expect(text()).toContain('Showing page 2 of 5');
    expect(text()).toContain('Total 42 items');
    expect(text()).toContain('Loading…');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect([...container.querySelectorAll('span.font-bold.text-matcha-text')].map((s) => s.textContent)).toEqual(['2', '5', '42']);

    mockLang = 'th';
    rerender(pager());
    expect(text()).toContain('แสดงหน้า 2 จาก 5');
  });
});
