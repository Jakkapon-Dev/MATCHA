import React from 'react';
import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import EditorialLookbookPage from './EditorialLookbookPage';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

vi.mock('../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({ t: (key) => key })
}));

vi.mock('../context/CartContext.jsx', () => ({
  useCart: () => ({ addToCart: vi.fn() })
}));

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

let mockLooksData = [
  {
    id: 'look-1',
    title: 'Spring Bloom',
    season: 'Spring',
    coverImage: '/images/spring.jpg',
    photographer: 'MatchA Studio',
    location: 'Kyoto',
    palette: ['#ffffff'],
    hotspots: [],
    shoppableItems: []
  }
];

vi.mock('../features/media/useLookbooks', () => ({
  default: () => ({
    looks: mockLooksData,
    loading: false,
    error: '',
    retry: vi.fn()
  })
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

describe('EditorialLookbookPage navigation', () => {
  test('navigates to /mix-match without throwing when Mix & Match studio button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/lookbook']}>
        <Routes>
          <Route path="/lookbook" element={<EditorialLookbookPage />} />
          <Route path="/mix-match" element={<div>Mix & Match Studio Page</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    );

    const mixMatchButton = screen.getByRole('button', { name: /Open Mix & Match Studio/i });
    expect(mixMatchButton).toBeDefined();

    expect(() => {
      fireEvent.click(mixMatchButton);
    }).not.toThrow();

    expect(screen.getByTestId('location-display').textContent).toBe('/mix-match');
    expect(screen.getByText('Mix & Match Studio Page')).toBeDefined();
  });

  test('disables Add the whole look button when all items in the look are unavailable', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Autumn Minimalist',
        season: 'Autumn',
        coverImage: '/images/autumn.jpg',
        photographer: 'Kenzo',
        location: 'Tokyo',
        palette: ['#2D5A27'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Iridescent Lilac', image: '/images/jacket.png', inStock: false, sizes: [] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, color: 'Metallic Silver', image: '/images/crop.png', inStock: false, sizes: [] },
          { id: 'LOOK-01-CARGO', name: 'Strapped Pants', price: 88, color: 'Black', image: '/images/cargo.png', inStock: false, sizes: [] }
        ]
      }
    ];

    render(
      <MemoryRouter initialEntries={['/lookbook']}>
        <Routes>
          <Route path="/lookbook" element={<EditorialLookbookPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addWholeLookButton = screen.getByRole('button', { name: /Add the whole look/i });
    expect(addWholeLookButton).toBeDefined();
    expect(addWholeLookButton.disabled).toBe(true);
  });

  test('enables Add the whole look button when at least one item is in stock', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Autumn Minimalist',
        season: 'Autumn',
        coverImage: '/images/autumn.jpg',
        photographer: 'Kenzo',
        location: 'Tokyo',
        palette: ['#2D5A27'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Iridescent Lilac', image: '/images/jacket.png', inStock: true, sizes: ['M'] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, color: 'Metallic Silver', image: '/images/crop.png', inStock: false, sizes: [] }
        ]
      }
    ];

    render(
      <MemoryRouter initialEntries={['/lookbook']}>
        <Routes>
          <Route path="/lookbook" element={<EditorialLookbookPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addWholeLookButton = screen.getByRole('button', { name: /Add the whole look/i });
    expect(addWholeLookButton).toBeDefined();
    expect(addWholeLookButton.disabled).toBe(false);
  });
});
