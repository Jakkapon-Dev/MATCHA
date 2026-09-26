/* The dashboard's numbers describe the shop, not the page you are looking at.
 *
 * They used to be totalled in the browser from whatever the three tables were
 * holding — at most 25 rows out of 75 garments — so every KPI, the category
 * split and the revenue chart understated the shop and moved when an
 * administrator turned a page. They now come from GET /admin/stats.
 *
 * "turning a page leaves every figure untouched" below is the evidence for
 * that: it pages the inventory table and asserts the aggregate never moves.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act, waitFor } from '@testing-library/react';

import DashboardTab from './DashboardTab';
import useAdminData from './useAdminData';

vi.mock('../../services/api', () => ({
  api: {
    getAdminProducts: vi.fn(),
    getAdminOrders: vi.fn(),
    getUsers: vi.fn(),
    getAdminStats: vi.fn()
  },
  apiErrorText: (error) => error?.message || 'failed'
}));

vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const t = (key, vars) => {
    const v = resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  };
  return { useLanguage: () => ({ lang: 'en', t }) };
});

const { api } = await import('../../services/api');

const STATS = {
  totalProducts: 75,
  totalStockUnits: 3200,
  lowStockCount: 7,
  categories: { Tops: 30, Outerwear: 45 },
  totalOrders: 13,
  paidOrders: 9,
  paidRevenue: 2700,
  monthly: [{ month: '2026-08', orders: 4, revenue: 800 }],
  totalMembers: 41,
  vipMembers: 6
};

// One page of the inventory table: 25 rows out of the 75 the shop holds.
const productPage = (pageNumber) => ({
  success: true,
  data: Array.from({ length: 25 }, (_, i) => ({
    _id: `p${pageNumber}-${i}`, id: `p${pageNumber}-${i}`, name: 'Garment',
    category: 'Tops', stock: 1, price: 10
  })),
  pagination: { total: 75, page: pageNumber, limit: 25, pageSize: 25, totalPages: 3 }
});

const emptyList = { success: true, data: [], pagination: { total: 0, page: 1, limit: 25, pageSize: 25, totalPages: 1 } };

const dashboardProps = (overrides = {}) => ({
  status: { stats: 'ready', orders: 'ready' },
  errors: {},
  totalRevenue: STATS.paidRevenue,
  orders: [],
  totalOrdersCount: STATS.totalOrders,
  paidOrdersCount: STATS.paidOrders,
  totalStockUnits: STATS.totalStockUnits,
  totalProductsCount: STATS.totalProducts,
  vipMembersCount: STATS.vipMembers,
  lowStockCount: STATS.lowStockCount,
  monthlyData: STATS.monthly,
  categoryDistribution: [{ label: 'Tops & Knitwear', count: 30, percent: 40, color: '#042509' }],
  setActiveTab: () => {},
  ...overrides
});

beforeEach(() => {
  api.getAdminStats.mockResolvedValue({ success: true, data: STATS });
  api.getAdminProducts.mockResolvedValue(productPage(1));
  api.getAdminOrders.mockResolvedValue(emptyList);
  api.getUsers.mockResolvedValue(emptyList);
});

afterEach(() => vi.clearAllMocks());

describe('figures do not follow the table', () => {
  test('turning a page leaves every figure untouched', async () => {
    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(result.current.status.stats).toBe('ready'));

    const onPageOne = result.current.stats;
    expect(onPageOne.totalProducts).toBe(75);
    // The table itself only ever holds a page of that.
    expect(result.current.inventory).toHaveLength(25);

    api.getAdminProducts.mockResolvedValue(productPage(2));
    await act(async () => { await result.current.changePage('inventory', 2); });
    api.getAdminProducts.mockResolvedValue(productPage(3));
    await act(async () => { await result.current.changePage('inventory', 3); });

    expect(result.current.pagination.inventory.page).toBe(3);
    // The aggregate is untouched, and was not even refetched: it does not
    // depend on which page of which table is on screen.
    expect(result.current.stats).toEqual(onPageOne);
    expect(api.getAdminStats).toHaveBeenCalledTimes(1);
  });

  test('a search that narrows the table does not narrow the KPIs', async () => {
    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(result.current.status.stats).toBe('ready'));

    api.getAdminProducts.mockResolvedValue({
      success: true,
      data: [{ _id: 'only', id: 'only', name: 'Trenchcoat', category: 'Outerwear', stock: 2, price: 10 }],
      pagination: { total: 1, page: 1, limit: 25, pageSize: 25, totalPages: 1 }
    });
    await act(async () => { await result.current.fetchResource('inventory', { search: 'trench' }); });

    expect(result.current.inventory).toHaveLength(1);
    expect(result.current.stats.totalProducts).toBe(75);
    expect(result.current.stats.totalStockUnits).toBe(3200);
  });
});

describe('loading and error state', () => {
  test('the dashboard says it is loading until the aggregate arrives', () => {
    render(<DashboardTab {...dashboardProps({ status: { stats: 'loading', orders: 'ready' } })} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/3200/)).toBeNull();
  });

  test('a failed aggregate is shown as an error, never as zeroes', () => {
    render(<DashboardTab {...dashboardProps({
      status: { stats: 'error', orders: 'ready' },
      errors: { stats: 'Could not load dashboard statistics' },
      totalRevenue: 0,
      totalOrdersCount: 0,
      totalStockUnits: 0,
      totalProductsCount: 0,
      vipMembersCount: 0,
      lowStockCount: 0,
      monthlyData: [],
      categoryDistribution: []
    })} />);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Could not load dashboard statistics');
    // A shop with stock is not reported as having none.
    expect(screen.queryByText(/units/)).toBeNull();
  });

  test('the whole-collection figures are what reaches the screen', () => {
    render(<DashboardTab {...dashboardProps()} />);
    expect(screen.getByText(/3200/)).toBeTruthy();
    expect(screen.getByText(/Across 75 garment lines/)).toBeTruthy();
    expect(screen.getByText(/7 Low stock alerts/)).toBeTruthy();
  });

  test('the average order value divides paid revenue by paid orders, not all orders', () => {
    // $2700 over 9 paid orders is $300 — not $2700/13 = $207.69, which would
    // fold in the four orders that have not been paid for.
    render(<DashboardTab {...dashboardProps()} />);
    const avgs = screen.getAllByText(/Avg\. Paid Order/);
    expect(avgs.length).toBeGreaterThan(0);
    for (const avg of avgs) {
      expect(avg.textContent).toMatch(/\$300\.00/);
      expect(avg.textContent).not.toMatch(/207\.69/);
    }
  });

  test('a failed aggregate does not take the tables down with it', async () => {
    api.getAdminStats.mockRejectedValue(new Error('stats exploded'));
    const { result } = renderHook(() => useAdminData('u_admin'));

    await waitFor(() => expect(result.current.status.stats).toBe('error'));
    expect(result.current.errors.stats).toBe('stats exploded');
    expect(result.current.stats).toBeNull();

    // Inventory still loaded and is still browsable.
    expect(result.current.status.inventory).toBe('ready');
    expect(result.current.inventory).toHaveLength(25);
  });
});
