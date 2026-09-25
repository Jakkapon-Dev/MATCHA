/* "not-an-email" reached the payment step. The Continue button is
   type="button", so the browser's own type="email" check never ran, and the
   step only asked that the box was not empty. */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../../context/AuthContext.jsx', () => ({ useAuth: () => ({ currentUser: null }) }));
vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k }) }));
vi.mock('../../features/account/addressBook', () => ({
  fetchAddressBook: vi.fn(() => Promise.resolve([])),
  readAddressBook: () => [],
  rememberAddress: vi.fn(),
  formatAddressArea: (parts) => parts.filter(Boolean).join(', ')
}));

const ShippingStep = (await import('./ShippingStep.jsx')).default;

const VALID = {
  firstName: 'Somchai', lastName: 'Jaidee', email: 'somchai@example.com', phone: '0812345678',
  address: '1 Test Road', city: 'Bangkok', zipCode: '10110'
};

const renderWith = (formData) => render(
  <ShippingStep
    formData={formData}
    onFormChange={vi.fn()}
    shippingOptions={[{ id: 'standard', name: 'Standard', price: 0, days: '3-5' }]}
    selectedShipping="standard"
    onSelectShipping={vi.fn()}
    onNext={vi.fn()}
    onBackToCart={vi.fn()}
  />
);

const continueButton = () => screen.getByText('checkout.continueToPayment').closest('button');

afterEach(cleanup);

describe('ShippingStep email', () => {
  test.each(['not-an-email', 'a@b', 'name@domain', 'two words@example.com'])('%s cannot continue, and says why', (email) => {
    renderWith({ ...VALID, email });
    expect(continueButton().disabled).toBe(true);
    const input = document.getElementById('shipping-email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('checkout.emailInvalid')).toBeTruthy();
  });

  test('a real address continues', () => {
    renderWith(VALID);
    expect(continueButton().disabled).toBe(false);
    expect(screen.queryByText('checkout.emailInvalid')).toBeNull();
  });

  test('surrounding spaces are not held against it', () => {
    renderWith({ ...VALID, email: '  somchai@example.com  ' });
    expect(continueButton().disabled).toBe(false);
  });
});

describe('ShippingStep delivery prices', () => {
  test('an option the bag ships free by shows Free, not its list rate', () => {
    render(
      <ShippingStep
        formData={VALID}
        onFormChange={vi.fn()}
        shippingOptions={[
          { id: 'standard', name: 'Standard', price: 0, listPrice: 0, days: '3-5' },
          { id: 'premium', name: 'VIP Same-Day', price: 0, listPrice: 25, days: '24h' }
        ]}
        selectedShipping="premium"
        onSelectShipping={vi.fn()}
        onNext={vi.fn()}
        onBackToCart={vi.fn()}
      />
    );
    const premium = screen.getByText('VIP Same-Day').closest('[role="radio"]');
    expect(premium.textContent).toContain('Free');
    expect(premium.textContent).toContain('$25.00'); // struck through, for reference
  });
});

describe('ShippingStep phone', () => {
  test.each(['081234', '08123456789', '1812345678', '081abcdefg', '+66812345678'])('%s is rejected as malformed', (phone) => {
    renderWith({ ...VALID, phone });
    expect(continueButton().disabled).toBe(true);
    const input = document.getElementById('shipping-phone');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('checkout.phoneInvalid')).toBeTruthy();
  });

  test.each(['0812345678', '021234567', '081-234-5678', '081 234 5678', '(02) 123-4567'])('%s is accepted', (phone) => {
    renderWith({ ...VALID, phone });
    expect(continueButton().disabled).toBe(false);
    expect(screen.queryByText('checkout.phoneInvalid')).toBeNull();
  });

  test('empty phone disables continue without showing format error', () => {
    renderWith({ ...VALID, phone: '' });
    expect(continueButton().disabled).toBe(true);
    expect(screen.queryByText('checkout.phoneInvalid')).toBeNull();
  });
});

describe('ShippingStep postal code', () => {
  test.each(['1011', '101100', '1011A', '10 110'])('%s is rejected as malformed', (zipCode) => {
    renderWith({ ...VALID, zipCode });
    expect(continueButton().disabled).toBe(true);
    const input = document.getElementById('shipping-zipCode');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('checkout.postalInvalid')).toBeTruthy();
  });

  test.each(['10110', ' 10110 '])('%s is accepted', (zipCode) => {
    renderWith({ ...VALID, zipCode });
    expect(continueButton().disabled).toBe(false);
    expect(screen.queryByText('checkout.postalInvalid')).toBeNull();
  });

  test('empty postal code disables continue without showing format error', () => {
    renderWith({ ...VALID, zipCode: '' });
    expect(continueButton().disabled).toBe(true);
    expect(screen.queryByText('checkout.postalInvalid')).toBeNull();
  });
});

