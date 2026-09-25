/* The catalogue page never asked for the reader's language: Thai readers saw
   the English description, English tags and English buttons on every tile. */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

let lang = 'th';
vi.mock('../../context/CartContext.jsx', () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock('../../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return {
    useLanguage: () => ({
      lang,
      t: (key, vars) => {
        const v = resolve(translations[lang], key) ?? resolve(translations.en, key) ?? key;
        return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
      }
    })
  };
});

const DyeTile = (await import('./DyeTile.jsx')).default;

const JEANS = {
  id: 'AUT-BOT-004', name: 'MatchA Autumn Jeans', price: 70.99, color: 'Brown', category: 'Bottoms', season: 'Autumn',
  tag: 'Best Seller', sizes: ['S', 'M'], inStock: true, image: '/x.jpg',
  description: 'ยีนส์เดนิมฟอกสีพิเศษ', descriptionEn: 'Straight-leg denim in a deep stonewash.',
  variants: [{ color: 'Brown', colorHex: '#5C4033', image: '/x.jpg' }]
};

afterEach(cleanup);

describe('DyeTile language', () => {
  test('Thai readers get the Thai description, tags and buttons', () => {
    lang = 'th';
    render(<DyeTile product={JEANS} onAddToCart={vi.fn()} onQuickView={vi.fn()} />);
    expect(screen.getByText('ยีนส์เดนิมฟอกสีพิเศษ')).toBeTruthy();
    expect(screen.queryByText(/Straight-leg denim/)).toBeNull();
    expect(screen.getByText('ขายดี · ฤดูใบไม้ร่วง')).toBeTruthy();
    expect(screen.getByText('เพิ่มลงตะกร้า')).toBeTruthy();
  });

  test('English readers keep the English copy', () => {
    lang = 'en';
    render(<DyeTile product={JEANS} onAddToCart={vi.fn()} onQuickView={vi.fn()} />);
    expect(screen.getByText('Straight-leg denim in a deep stonewash.')).toBeTruthy();
    expect(screen.getByText('Best Seller · Autumn')).toBeTruthy();
    expect(screen.getByText('Add to cart')).toBeTruthy();
  });
});
