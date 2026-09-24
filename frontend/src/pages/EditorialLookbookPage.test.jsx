import React from 'react';
import { describe, test, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import EditorialLookbookPage from './EditorialLookbookPage';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
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

vi.mock('../features/media/useLookbooks', () => ({
  default: () => ({
    looks: [
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
    ],
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
});
