/* A database value shown to a customer as if it were a sentence.
 *
 * The order-history badge printed order.paymentStatus raw, and its `uppercase`
 * class turned `pending_payment` into "PENDING_PAYMENT" — sitting beside "PAID"
 * and "UNPAID", which only read as words by accident. Measured on production:
 * the admin account's order history showed PAYMENT: PENDING_PAYMENT.
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import OrdersTab from './OrdersTab';

vi.mock('../../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({
    t: (key) => ({
      'account.payUnpaid': 'Unpaid',
      'account.payPendingPayment': 'Awaiting payment',
      'account.payPaid': 'Paid',
      'account.payFailed': 'Payment failed',
      'account.payExpired': 'Payment window closed',
      'account.payRefunded': 'Refunded'
    }[key] ?? key)
  })
}));

afterEach(cleanup);

// OrdersTab reaches for useNavigate, so it needs a router around it.
const renderTab = (o) => render(<MemoryRouter><OrdersTab orders={[o]} isLoaded /></MemoryRouter>);

const order = (paymentStatus) => ({
  id: 'MTA-2026-000001-111',
  date: '2026-09-22',
  status: 'pending',
  paymentStatus,
  total: 70.99,
  items: [{ name: 'MatchA Autumn Jeans', color: 'Brown', size: 'L', quantity: 1, price: 70.99 }]
});

describe('the payment badge', () => {
  test('never shows a raw enum', () => {
    renderTab(order('pending_payment'));
    expect(screen.queryByText(/pending_payment/i)).toBeNull();
    expect(screen.getByText(/Awaiting payment/)).toBeTruthy();
  });

  test('reads every state the backend can store', () => {
    const states = {
      unpaid: 'Unpaid',
      pending_payment: 'Awaiting payment',
      paid: 'Paid',
      failed: 'Payment failed',
      expired: 'Payment window closed',
      refunded: 'Refunded'
    };
    for (const [value, label] of Object.entries(states)) {
      renderTab(order(value));
      expect(screen.getByText(new RegExp(label)), `${value} should read as "${label}"`).toBeTruthy();
      // No underscore from any state should ever reach the page.
      expect(screen.queryByText(/_/)).toBeNull();
      cleanup();
    }
  });

  test('a state this build has not heard of is still readable', () => {
    renderTab(order('charged_back'));
    expect(screen.getByText(/charged back/)).toBeTruthy();
    expect(screen.queryByText(/charged_back/)).toBeNull();
  });
});
