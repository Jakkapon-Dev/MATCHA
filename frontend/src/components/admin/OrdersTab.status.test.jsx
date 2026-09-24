import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k }) }));

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
