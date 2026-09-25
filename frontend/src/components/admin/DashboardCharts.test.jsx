/* The dashboard's pie / bar breakdowns and the order count they sit beside. */
import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k }) }));

const { default: DashboardTab } = await import('./DashboardTab');
const { default: BreakdownChart } = await import('./BreakdownChart');

afterEach(cleanup);

const ORDER_STATUS = {
  paid: { count: 15, amount: 2368.12 },
  awaiting: { count: 8, amount: 1592.24 },
  cancelled: { count: 3, amount: 358.96 },
  other: { count: 0, amount: 0 }
};
const props = (overrides = {}) => ({
  status: { stats: 'ready', orders: 'ready' }, errors: {},
  totalRevenue: 2368.12, orders: [], totalOrdersCount: 26, paidOrdersCount: 15, orderStatus: ORDER_STATUS,
  totalStockUnits: 3787, totalProductsCount: 76, vipMembersCount: 2, lowStockCount: 0, monthlyData: [],
  categoryDistribution: [
    { label: 'Tops & Knitwear', count: 30, percent: 39, color: '#042509' },
    { label: 'Bottoms & Denim', count: 46, percent: 61, color: '#C91D1D' }
  ],
  setActiveTab: vi.fn(),
  ...overrides
});
const panel = (title) => screen.getByRole('heading', { name: title }).closest('section');

describe('Customer Orders', () => {
  test('cancelled orders are not counted, and the card says how many were left out', () => {
    render(<DashboardTab {...props()} />);
    const card = panel('Customer Orders');
    expect(within(card).getByText('23')).toBeTruthy();
    expect(within(card).getByText('3 cancelled not counted')).toBeTruthy();
    expect(within(card).getByText(/Avg\. Paid Order: \$157\.87/)).toBeTruthy();
  });

  test('a server without the breakdown still shows its total rather than breaking', () => {
    render(<DashboardTab {...props({ orderStatus: null })} />);
    expect(within(panel('Customer Orders')).getByText('26')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Order Status' })).toBeNull();
  });
});

describe('Order Status chart', () => {
  test('starts as a pie with every group and its share', () => {
    render(<DashboardTab {...props()} />);
    const status = panel('Order Status');
    expect(status.querySelectorAll('svg[viewBox="0 0 200 200"] path').length).toBe(3); // the empty group draws no slice
    const chart = within(status).getByRole('img');
    expect(chart.getAttribute('aria-label')).toBe('Order status: Paid 15 (58%), Awaiting payment 8 (31%), Cancelled 3 (12%), Refunded / expired 0 (0%)');
  });

  test('switches to bars and to order value', () => {
    render(<DashboardTab {...props()} />);
    const status = panel('Order Status');
    fireEvent.click(within(status).getByRole('button', { name: 'Bars' }));
    expect(within(status).getByRole('button', { name: 'Bars' }).getAttribute('aria-pressed')).toBe('true');
    expect(status.querySelector('svg[viewBox="0 0 200 200"] path')).toBeNull();
    fireEvent.click(within(status).getByRole('button', { name: 'Value' }));
    expect(within(status).getByText('$2,368.12 (55%)')).toBeTruthy();
  });

  /* The KPI card leaves cancelled orders out; the chart must not. It is the
     one place an administrator sees how many orders were cancelled. */
  test('cancelled orders are shown in both the pie and the bars, by count and by value', () => {
    render(<DashboardTab {...props()} />);
    const status = panel('Order Status');
    const cancelledSlice = [...status.querySelectorAll('svg[viewBox="0 0 200 200"] path')]
      .find(path => path.getAttribute('fill') === '#C91D1D');
    expect(cancelledSlice).toBeTruthy();
    expect(cancelledSlice.querySelector('title').textContent).toBe('Cancelled: 3 (12%)');
    expect(within(status).getByText('Cancelled')).toBeTruthy();

    fireEvent.click(within(status).getByRole('button', { name: 'Bars' }));
    expect(within(status).getByText('Cancelled')).toBeTruthy();
    expect(within(status).getByText('3 (12%)')).toBeTruthy();

    fireEvent.click(within(status).getByRole('button', { name: 'Value' }));
    expect(within(status).getByText('$358.96 (8%)')).toBeTruthy();
    fireEvent.click(within(status).getByRole('button', { name: 'Pie' }));
    expect(within(status).getByText('$358.96 · 8%')).toBeTruthy();
  });

  test('the category panel toggles independently', () => {
    render(<DashboardTab {...props()} />);
    const category = panel('Category Share');
    expect(within(category).getByText('30 items (39%)')).toBeTruthy();
    fireEvent.click(within(category).getByRole('button', { name: 'Pie' }));
    expect(category.querySelectorAll('svg[viewBox="0 0 200 200"] path').length).toBe(2);
    expect(panel('Order Status').querySelectorAll('svg[viewBox="0 0 200 200"] path').length).toBe(3);
  });
});

describe('BreakdownChart', () => {
  test('a single group draws a full circle, not a zero-length arc', () => {
    const { container } = render(<BreakdownChart mode="pie" items={[{ label: 'Paid', value: 4, color: '#000' }, { label: 'Other', value: 0, color: '#111' }]} />);
    expect(container.querySelectorAll('circle').length).toBe(1);
    expect(container.querySelectorAll('path').length).toBe(0);
  });

  test('nothing to show is said plainly', () => {
    render(<BreakdownChart mode="pie" emptyText="No orders yet." items={[{ label: 'Paid', value: 0, color: '#000' }]} />);
    expect(screen.getByText('No orders yet.')).toBeTruthy();
  });
});
