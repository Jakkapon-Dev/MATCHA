import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return { useLanguage: () => ({ lang: 'th', t: (key, vars) => {
    const v = resolve(translations.th, key) ?? resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  } }) };
});

const OrdersTab = (await import('./OrdersTab')).default;
import { normalizeOrder } from './adminData';

afterEach(cleanup);

describe('OrdersTab status control', () => {
  test('shows a completed order as Completed, not Pending', () => {
    const orders = [
      normalizeOrder({ orderId: 'ORD-DONE', status: 'completed', paymentStatus: 'paid', total: 87.98, createdAt: '2026-09-07T00:00:00Z' }),
      normalizeOrder({ orderId: 'ORD-LOW', status: 'pending', paymentStatus: 'unpaid', total: 10, createdAt: '2026-09-07T00:00:00Z' })
    ];
    const { container } = render(
      <OrdersTab status={{ orders: 'ready' }} errors={{}} filteredOrders={orders}
        orderStatusFilter="All" setOrderStatusFilter={vi.fn()} setSelectedOrderForModal={vi.fn()}
        handleUpdateOrderStatus={vi.fn()} saving={false} isDemo={false}
        pagination={{ page: 1, totalPages: 1, total: 2 }} onPageChange={vi.fn()} />
    );
    const selects = [...container.querySelectorAll('select')];
    expect(selects.map((s) => s.value)).toEqual(['Completed', 'Pending']);
  });
});
