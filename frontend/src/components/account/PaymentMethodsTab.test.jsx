/* Sample cards presented as the shopper's own.
 *
 * Saving a card is not built, but the PAYMENT METHODS tab listed two cards
 * under "Saved Payment Cards", each signed "ALEX C.", for whoever was logged
 * in. Measured on production with admin@matcha.com. The team's rule for
 * mockups is to keep them and say they are mockups — this one said neither.
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import PaymentMethodsTab from './PaymentMethodsTab';

vi.mock('../../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({ t: (key) => key })
}));

afterEach(cleanup);

describe('PaymentMethodsTab', () => {
  test('no stranger’s name is printed on the cards', () => {
    render(<PaymentMethodsTab />);
    expect(screen.queryByText(/ALEX/i)).toBeNull();
  });

  test('the cards are marked as samples', () => {
    render(<PaymentMethodsTab />);
    expect(screen.getByText('account.paymentSampleBadge')).toBeTruthy();
    expect(screen.getByRole('note').textContent).toBe('account.paymentSampleNote');
    expect(screen.getAllByText('account.paymentSampleCard').length).toBeGreaterThan(0);
  });
});
