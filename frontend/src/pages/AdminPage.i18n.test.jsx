/* The admin console follows the site's language.
 *
 * It used to be English whatever the shopper had chosen. It now reads its
 * copy through the same translator as the storefront, keeps the names the
 * team uses for its features (Dashboard, Admin Console, Lookbook, Coupons)
 * in English inside Thai text, and switches without a reload. */
import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockLang = 'th';
vi.mock('../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return {
    useLanguage: () => ({
      lang: mockLang,
      t: (key, vars) => {
        const v = resolve(translations[mockLang], key) ?? resolve(translations.en, key) ?? key;
        return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
      }
    })
  };
});
vi.mock('../services/api', () => ({
  api: { getAdminNotifications: vi.fn().mockResolvedValue({ success: true, data: [], unreadCount: 0 }) },
  apiErrorText: (error) => error?.message || 'failed'
}));
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'admin-1', name: 'Admin', role: 'Admin' }, logout: vi.fn() })
}));
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../features/media/MediaManager', () => ({ default: () => null }));
vi.mock('../hooks/useChangeMotion', () => ({ default: () => ({ current: null }) }));
vi.mock('../components/admin/useAdminData', () => ({
  default: () => ({
    inventory: [], setInventory: vi.fn(), orders: [], setOrders: vi.fn(), members: [], setMembers: vi.fn(),
    stats: {
      totalProducts: 76, totalOrders: 26, paidOrders: 15, paidRevenue: 2368.12, totalStockUnits: 3787, lowStockCount: 0,
      vipMembers: 2, categories: { Tops: 30, Bottoms: 46 }, monthly: [],
      orderStatus: { paid: { count: 15, amount: 2368.12 }, awaiting: { count: 8, amount: 1592.24 }, cancelled: { count: 3, amount: 358.96 }, other: { count: 0, amount: 0 } }
    },
    status: { inventory: 'ready', orders: 'ready', members: 'ready', stats: 'ready' },
    errors: {}, refresh: vi.fn(), pagination: {}, changePage: vi.fn(), fetchResource: vi.fn()
  })
}));

const { default: AdminPage } = await import('./AdminPage');

afterEach(() => { cleanup(); mockLang = 'th'; });

const page = () => (<MemoryRouter><AdminPage /></MemoryRouter>);
const sidebar = () => screen.getByRole('navigation', { name: /Admin/ });

describe('admin console language', () => {
  test('Thai: shell, navigation and dashboard read in Thai, feature names stay English', () => {
    mockLang = 'th';
    render(page());
    const nav = sidebar();
    expect(within(nav).getByText('ภาพรวม')).toBeTruthy();
    expect(within(nav).getByText('คำสั่งซื้อ')).toBeTruthy();
    expect(within(nav).getByText('Lookbook Hotspots')).toBeTruthy();
    expect(within(nav).getByText('Coupons')).toBeTruthy();
    expect(screen.getAllByText('Admin Console').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /เพิ่มสินค้า/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /รีเฟรชข้อมูล/ })).toBeTruthy();
    expect(screen.getByPlaceholderText(/SKU/).getAttribute('placeholder')).toMatch(/ค้นหา/);
    expect(screen.getByText('รายได้ที่ชำระแล้ว')).toBeTruthy();
    expect(screen.getByText('ไม่นับที่ยกเลิก 3 รายการ')).toBeTruthy();
    expect(screen.getByText('สินค้าใน Catalog ทั้งหมด')).toBeTruthy();
    expect(screen.getByText('เสื้อและนิตแวร์')).toBeTruthy();
    expect(screen.queryByText(/admin\.\w+\.\w+/)).toBeNull();
  });

  test('English: the console reads as it always has', () => {
    mockLang = 'en';
    render(page());
    const nav = sidebar();
    expect(within(nav).getByText('Overview')).toBeTruthy();
    expect(within(nav).getByText('Orders Pipeline')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add Garment/ })).toBeTruthy();
    expect(screen.getByText('Paid Revenue')).toBeTruthy();
    expect(screen.getByText('Tops & Knitwear')).toBeTruthy();
    expect(screen.getByText('3 cancelled not counted')).toBeTruthy();
  });

  test('switching language re-renders every label without a reload, both ways', () => {
    mockLang = 'th';
    const view = render(page());
    expect(screen.getByText('รายได้ที่ชำระแล้ว')).toBeTruthy();
    mockLang = 'en';
    view.rerender(page());
    expect(screen.getByText('Paid Revenue')).toBeTruthy();
    expect(screen.queryByText('รายได้ที่ชำระแล้ว')).toBeNull();
    mockLang = 'th';
    view.rerender(page());
    expect(screen.getByText('รายได้ที่ชำระแล้ว')).toBeTruthy();
    expect(screen.getByRole('button', { name: /เพิ่มสินค้า/ })).toBeTruthy();
  });

  test('the dashboard charts are labelled in the chosen language', () => {
    mockLang = 'th';
    render(page());
    expect(screen.getAllByRole('button', { name: /วงกลม/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /แท่ง/ }).length).toBeGreaterThan(0);
    const chart = screen.getAllByRole('img').find(el => /สถานะคำสั่งซื้อ/.test(el.getAttribute('aria-label') || ''));
    expect(chart.getAttribute('aria-label')).toMatch(/ยกเลิก 3/);
  });
});
