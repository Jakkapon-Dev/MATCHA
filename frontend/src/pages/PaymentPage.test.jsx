/* Opening or refreshing /payment with a full bag bounced the shopper to /cart.

   The page sends an empty bag back to the cart. On a fresh load the cart
   provider starts on the demo fallback's bag — empty — and only reads the real
   one when the store mode arrives, so the guard saw "empty" and redirected
   before the bag had been read. It now waits for `cartReady`. */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

let cart;
vi.mock('../context/CartContext.jsx', () => ({ useCart: () => cart }));
vi.mock('../context/StoreModeContext.jsx', () => ({ useStoreMode: () => ({ isDemo: false, ready: cart.cartReady }) }));
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k, lang: 'en' }) }));
vi.mock('../hooks/useChangeMotion', () => ({ default: () => ({ current: null }) }));
vi.mock('@stripe/react-stripe-js', () => ({ Elements: ({ children }) => children }));
vi.mock('../lib/stripe', () => ({ stripePromise: null }));
vi.mock('../services/api', () => ({ api: {}, apiErrorText: (e) => String(e?.message) }));
let lastShippingOptions = [];
vi.mock('../components/payment/ShippingStep', () => ({ default: ({ shippingOptions }) => { lastShippingOptions = shippingOptions; return <div>shipping-step</div>; } }));
vi.mock('../components/payment/PaymentMethodStep', () => ({ default: () => <div>payment-step</div> }));
vi.mock('../components/payment/OrderSummarySidebar', () => ({ default: () => null }));
vi.mock('../components/payment/OrderSuccessModal', () => ({ default: () => null }));
vi.mock('../components/ui/PreviewNote', () => ({ default: () => null }));

const PaymentPage = (await import('./PaymentPage.jsx')).default;

let where;
function Where() {
  where = useLocation().pathname;
  return null;
}

const ITEM = { id: 'AUT-BOT-004', name: 'Jeans', price: 70.99, size: 'M', color: 'Brown', quantity: 1 };

const renderAt = () => render(
  <MemoryRouter initialEntries={['/payment']}>
    <Routes>
      <Route path="/payment" element={<><PaymentPage /><Where /></>} />
      <Route path="/cart" element={<Where />} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => { where = undefined; });
afterEach(cleanup);

describe('PaymentPage empty-bag guard', () => {
  test('a refresh with a full bag stays on checkout while the bag is still being read', () => {
    cart = { cartReady: false, cartItems: [], clearCart: vi.fn() };
    const view = renderAt();
    expect(where).toBe('/payment');

    // The store mode arrives and the stored bag is read.
    cart = { cartReady: true, cartItems: [ITEM], clearCart: vi.fn() };
    act(() => { view.rerender(
      <MemoryRouter initialEntries={['/payment']}>
        <Routes>
          <Route path="/payment" element={<><PaymentPage /><Where /></>} />
          <Route path="/cart" element={<Where />} />
        </Routes>
      </MemoryRouter>
    ); });
    expect(where).toBe('/payment');
  });

  test('opening /payment directly with a bag shows checkout', () => {
    cart = { cartReady: true, cartItems: [ITEM], clearCart: vi.fn() };
    const view = renderAt();
    expect(where).toBe('/payment');
    expect(view.getByText('shipping-step')).toBeTruthy();
  });

  test('a bag that really is empty still goes back to the cart', () => {
    cart = { cartReady: true, cartItems: [], clearCart: vi.fn() };
    renderAt();
    expect(where).toBe('/cart');
  });
});

describe('PaymentPage delivery options', () => {
  test('are priced for the bag: every method is free over the threshold', () => {
    cart = { cartReady: true, cartItems: [{ ...ITEM, price: 150 }], clearCart: vi.fn() };
    renderAt();
    expect(lastShippingOptions.map((o) => [o.id, o.price])).toEqual([['standard', 0], ['express', 0], ['premium', 0]]);
    expect(lastShippingOptions.find((o) => o.id === 'premium').listPrice).toBe(25);
  });

  test('and at the list rate under it', () => {
    cart = { cartReady: true, cartItems: [{ ...ITEM, price: 40 }], clearCart: vi.fn() };
    renderAt();
    expect(lastShippingOptions.map((o) => [o.id, o.price])).toEqual([['standard', 0], ['express', 12], ['premium', 25]]);
  });
});
