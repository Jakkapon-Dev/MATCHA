import { describe, expect, it } from 'vitest';
import { normalizeProduct } from './adminData';

describe('normalizeProduct', () => {
  it('uses size buckets instead of stale legacy quantity after a restock', () => {
    const product = normalizeProduct({
      _id: 'AUT-BOT-004',
      quantity: 25,
      stock: 50,
      sizeStock: [
        { size: 'S', stock: 10 },
        { size: 'M', stock: 12 },
        { size: 'L', stock: 8 },
      ],
    });

    expect(product.stock).toBe(30);
    expect(product.status).toBe('In Stock');
    expect(product.needsSizeChoice).toBe(true);
  });

  it('uses the current stock field for an unsized legacy product', () => {
    expect(normalizeProduct({ stock: 7, quantity: 25 }).stock).toBe(7);
  });
});

/* An order stored as "completed" showed as Pending in the admin table: the
   status control had no Completed option and fell back to its first one, while
   the customer saw COMPLETED. Stored rows also disagree on case. */
import { normalizeOrder, orderStatusLabel, isKnownOrderStatus, ORDER_STATUSES } from './adminData';

describe('order status display', () => {
  it.each([
    ['pending', 'Pending'], ['Pending', 'Pending'], ['PENDING', 'Pending'], [' shipped ', 'Shipped'],
    ['Processing', 'Processing'], ['Delivered', 'Delivered'], ['cancelled', 'Cancelled']
  ])('%j reads as %s whatever its case', (stored, shown) => {
    expect(orderStatusLabel(stored)).toBe(shown);
    expect(isKnownOrderStatus(orderStatusLabel(stored))).toBe(true);
  });

  it('a status outside the list is shown as it is, never as Pending', () => {
    const order = normalizeOrder({ orderId: 'ORD-1', status: 'completed', paymentStatus: 'paid', createdAt: '2026-09-07T00:00:00Z' });
    expect(order.status).toBe('Completed');
    expect(order.status).not.toBe('Pending');
    expect(isKnownOrderStatus(order.status)).toBe(false);
  });

  it('a missing status says Unknown', () => {
    expect(orderStatusLabel(undefined)).toBe('Unknown');
  });

  it('offers exactly the statuses the order model accepts', () => {
    expect(ORDER_STATUSES.map((s) => s.toLowerCase())).toEqual(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
  });
});
