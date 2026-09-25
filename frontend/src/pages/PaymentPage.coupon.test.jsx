/* Checkout shows what the server says a coupon is worth.
 *
 * The page sends the code and the bag's product ids and quantities to
 * POST /api/coupons/quote and displays the discount that comes back. It no
 * longer has a coupon table of its own, so a code the admin just created works
 * and one the admin just disabled does not, without a redeploy. */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let cart;
const quoteCoupon = vi.fn();
vi.mock('../context/CartContext.jsx', () => ({ useCart: () => cart }));
vi.mock('../context/StoreModeContext.jsx', () => ({ useStoreMode: () => ({ isDemo: false, ready: true }) }));
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return { useLanguage: () => ({ lang: 'en', t: (key) => resolve(translations.en, key) ?? key }) };
});
vi.mock('../hooks/useChangeMotion', () => ({ default: () => ({ current: null }) }));
vi.mock('@stripe/react-stripe-js', () => ({ Elements: ({ children }) => children }));
vi.mock('../lib/stripe', () => ({ stripePromise: null }));
vi.mock('../services/api', () => ({
  api: { quoteCoupon: (...args) => quoteCoupon(...args) },
  apiErrorText: (e) => String(e?.message)
}));
vi.mock('../components/payment/ShippingStep', () => ({ default: () => <div>shipping-step</div> }));
vi.mock('../components/payment/PaymentMethodStep', () => ({ default: () => null }));
vi.mock('../components/payment/OrderSuccessModal', () => ({ default: () => null }));
vi.mock('../components/ui/PreviewNote', () => ({ default: () => null }));

const PaymentPage = (await import('./PaymentPage.jsx')).default;

const ITEM = { id: 'AUT-BOT-004', name: 'Jeans', price: 70.99, size: 'M', color: 'Brown', quantity: 1 };
const renderPage = () => render(<MemoryRouter initialEntries={['/payment']}><PaymentPage /></MemoryRouter>);
const apply = (code) => {
  fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: code } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
};

beforeEach(() => {
  cart = { cartReady: true, cartItems: [ITEM], clearCart: vi.fn() };
  quoteCoupon.mockReset();
  localStorage.clear();
});
afterEach(cleanup);

describe('checkout coupons', () => {
  test('the discount shown is the server quote, and only ids and quantities are sent', async () => {
    quoteCoupon.mockResolvedValue({ success: true, data: { code: 'SPRING20', type: 'fixed_amount', label: '$20.00 OFF', discountAmount: 20, freeShipping: false } });
    renderPage();
    apply(' spring20 ');
    await screen.findByText('SPRING20');
    expect(quoteCoupon).toHaveBeenCalledWith('SPRING20', [ITEM]);
    expect(screen.getByText('($20.00 OFF)')).toBeTruthy();
    // 70.99 − 20.00 on the server's figure, not on anything computed here.
    expect(screen.getAllByText(/50\.99/).length).toBeGreaterThan(0);
  });

  test('a refused code shows the reason in the shopper\'s language and applies nothing', async () => {
    quoteCoupon.mockRejectedValue(Object.assign(new Error('รหัสส่วนลดนี้หมดอายุแล้ว'), { code: 'COUPON_EXPIRED', status: 400 }));
    renderPage();
    apply('OLDCODE');
    expect((await screen.findByRole('alert')).textContent).toBe('This promo code has expired.');
    expect(screen.queryByText('Remove')).toBeNull();
  });

  test('a code held from the home page is priced once the bag is known', async () => {
    localStorage.setItem('matcha_applied_coupon', 'MATCHA15');
    quoteCoupon.mockResolvedValue({ success: true, data: { code: 'MATCHA15', type: 'percentage', label: '15% OFF', discountAmount: 10.65, freeShipping: false } });
    renderPage();
    await screen.findByText('MATCHA15');
    expect(quoteCoupon).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('matcha_applied_coupon')).toBeNull();
  });

  test('an empty box is not sent to the server', async () => {
    renderPage();
    apply('   ');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That promo code is not valid.'));
    expect(quoteCoupon).not.toHaveBeenCalled();
  });
});
