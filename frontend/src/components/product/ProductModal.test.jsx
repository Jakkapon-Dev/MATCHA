/* Three on the catalogue card became one in the bag.

   A garment with a choice of sizes opens this modal from the card's Add button,
   and the card sends the quantity chosen on its stepper as `initialQuantity`.
   The modal started at 1 regardless. */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('../../context/CartContext.jsx', () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock('../../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k, lang: 'en' }) }));

const ProductModal = (await import('./ProductModal.jsx')).default;

const JEANS = {
  id: 'AUT-BOT-004', name: 'MatchA Autumn Jeans', price: 70.99, color: 'Brown', colorHex: '#5C4033',
  image: '/images/jeans.jpeg', category: 'Bottoms', sizes: ['S', 'M', 'L'], inStock: true,
  variants: [{ color: 'Brown', colorHex: '#5C4033', image: '/images/jeans.jpeg' }]
};

afterEach(cleanup);

const quantityShown = () => screen.getByText('product.quantity').parentElement.querySelector('span.min-w-8').textContent;
const addButton = () => screen.getAllByRole('button').find((b) => /product\.addToBag|ADD TO BAG/i.test(b.textContent));

describe('ProductModal starting quantity', () => {
  test('opens on the quantity chosen on the card, and adds that many', () => {
    const onAddToCart = vi.fn();
    render(<ProductModal product={{ ...JEANS, initialQuantity: 3 }} onClose={vi.fn()} onAddToCart={onAddToCart} />);
    expect(quantityShown()).toBe('3');

    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    fireEvent.click(addButton());
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'AUT-BOT-004', size: 'M', quantity: 3 }));
  });

  test('opened from anywhere else it starts at one', () => {
    render(<ProductModal product={JEANS} onClose={vi.fn()} onAddToCart={vi.fn()} />);
    expect(quantityShown()).toBe('1');
  });

  test('a nonsense starting quantity is treated as one', () => {
    render(<ProductModal product={{ ...JEANS, initialQuantity: 'lots' }} onClose={vi.fn()} onAddToCart={vi.fn()} />);
    expect(quantityShown()).toBe('1');
  });
});

/* The modal is aria-modal, but opening it left focus on the button behind it,
   Tab walked through the page underneath, and closing it dropped focus on
   <body>. */
describe('ProductModal keyboard focus', () => {
  test('moves in on open, stays in on Tab, and goes back on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const view = render(<ProductModal product={JEANS} onClose={vi.fn()} onAddToCart={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    const focusables = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    focusables.at(-1).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(focusables[0]);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(focusables.at(-1));

    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
