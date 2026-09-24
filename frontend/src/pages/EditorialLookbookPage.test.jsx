import React from 'react';
import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
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

const mockAddToCart = vi.fn();

vi.mock('../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({ t: (key) => key })
}));

vi.mock('../context/CartContext.jsx', () => ({
  useCart: () => ({ addToCart: mockAddToCart })
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

  test('opens ProductModal when item requires size selection (sizes.length > 1)', () => {
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
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Iridescent Lilac', image: '/images/jacket.png', inStock: true, sizes: ['S', 'M', 'L'] }
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

    const addButton = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(addButton);

    // ProductModal should be opened with role="dialog"
    const modal = screen.getByRole('dialog');
    expect(modal).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Holographic Jacket' })).toBeDefined();
  });

  test('directly calls addToCart with valid product details when item has only one size', () => {
    mockAddToCart.mockClear();
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
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Iridescent Lilac', image: '/images/jacket.png', inStock: true, sizes: ['OS'] }
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

    const addButton = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'LOOK-01-JACKET',
        name: 'Holographic Jacket',
        price: 125,
        color: 'Iridescent Lilac',
        quantity: 1
      })
    );
  });
});

describe('Add the whole look queue flow', () => {
  afterEach(() => {
    mockAddToCart.mockClear();
  });

  test('processes multiple multi-size products sequentially and atomically adds them all to cart only after final selection', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Iridescent Lilac', image: '/images/jacket.png', inStock: true, sizes: ['S', 'M', 'L'] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, color: 'Silver', image: '/images/crop.png', inStock: true, sizes: ['S', 'M'] },
          { id: 'LOOK-01-CARGO', name: 'Strapped Pants', price: 88, color: 'Black', image: '/images/cargo.png', inStock: true, sizes: ['M', 'L', 'XL'] }
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

    const addWholeLookBtn = screen.getByRole('button', { name: /Add the whole look/i });
    fireEvent.click(addWholeLookBtn);

    // Modal 1 opens for Jacket
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Holographic Jacket' })).toBeDefined();

    // Select size 'M'
    fireEvent.click(within(dialog).getByRole('button', { name: /^M$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Still nothing added to cart!
    expect(mockAddToCart).not.toHaveBeenCalled();

    // Modal 2 opens for Crop
    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Metallic Silver Top' })).toBeDefined();

    // Select size 'S'
    fireEvent.click(within(dialog).getByRole('button', { name: /^S$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Still nothing added to cart!
    expect(mockAddToCart).not.toHaveBeenCalled();

    // Modal 3 opens for Cargo
    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Strapped Pants' })).toBeDefined();

    // Select size 'L'
    fireEvent.click(within(dialog).getByRole('button', { name: /^L$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Queue complete! Modal closed
    expect(screen.queryByRole('dialog')).toBeNull();

    // Now all 3 items added to cart atomically
    expect(mockAddToCart).toHaveBeenCalledTimes(3);
    expect(mockAddToCart).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'LOOK-01-JACKET', size: 'M' })
    );
    expect(mockAddToCart).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'LOOK-01-CROP', size: 'S' })
    );
    expect(mockAddToCart).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ id: 'LOOK-01-CARGO', size: 'L' })
    );
  });

  test('handles mix of multi-size and single-size products, pre-collecting single-size and queuing multi-size', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-BAG', name: 'Leather Bag', price: 95, color: 'Tan', image: '/images/bag.png', inStock: true, sizes: ['OS'] },
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, color: 'Lilac', image: '/images/jacket.png', inStock: true, sizes: ['S', 'M', 'L'] },
          { id: 'LOOK-01-CAP', name: 'Logo Cap', price: 30, color: 'Black', image: '/images/cap.png', inStock: true, sizes: ['ONE SIZE'] }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    // Only 1 modal opens (for Jacket)
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Holographic Jacket' })).toBeDefined();

    expect(mockAddToCart).not.toHaveBeenCalled();

    // Select size 'S'
    fireEvent.click(within(dialog).getByRole('button', { name: /^S$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Modal closes
    expect(screen.queryByRole('dialog')).toBeNull();

    // All 3 items added atomically (2 single-size pre-collected + 1 multi-size)
    expect(mockAddToCart).toHaveBeenCalledTimes(3);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-BAG', size: 'OS' })
    );
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-CAP', size: 'ONE SIZE' })
    );
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-JACKET', size: 'S' })
    );
  });

  test('adds all products immediately without opening modal when all items are single-size', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-BAG', name: 'Leather Bag', price: 95, color: 'Tan', image: '/images/bag.png', inStock: true, sizes: ['OS'] },
          { id: 'LOOK-01-CAP', name: 'Logo Cap', price: 30, color: 'Black', image: '/images/cap.png', inStock: true, sizes: ['ONE SIZE'] }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    // No modal should open
    expect(screen.queryByRole('dialog')).toBeNull();

    // Added immediately
    expect(mockAddToCart).toHaveBeenCalledTimes(2);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-BAG', size: 'OS' })
    );
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-CAP', size: 'ONE SIZE' })
    );
  });

  test('cancels whole look queue and adds nothing when user closes first modal', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, inStock: true, sizes: ['S', 'M'] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, inStock: true, sizes: ['S', 'M'] }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    // Click close button
    const closeBtn = within(dialog).getByRole('button', { name: 'product.close' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  test('cancels entire queue atomically when user closes subsequent modal, discarding prior selections', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, inStock: true, sizes: ['S', 'M'] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, inStock: true, sizes: ['S', 'M'] }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    // Select size for Jacket
    let dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^M$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Modal 2 opens for Crop
    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Metallic Silver Top' })).toBeDefined();

    // Cancel modal 2
    fireEvent.click(within(dialog).getByRole('button', { name: 'product.close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    // Nothing was added to cart!
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  test('filters out out-of-stock items and processes only in-stock items in the whole look', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, inStock: true, sizes: ['S', 'M'] },
          { id: 'LOOK-01-CROP', name: 'Metallic Silver Top', price: 44, inStock: false, sizes: ['S', 'M'] },
          { id: 'LOOK-01-BAG', name: 'Leather Bag', price: 95, inStock: true, sizes: ['OS'] }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    // Modal only opens for Jacket (Crop is OOS, Bag is single-size)
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Holographic Jacket' })).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: /^S$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    expect(screen.queryByRole('dialog')).toBeNull();

    // Only Jacket and Bag added, Crop is NOT added
    expect(mockAddToCart).toHaveBeenCalledTimes(2);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-JACKET', size: 'S' })
    );
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-BAG', size: 'OS' })
    );
    expect(mockAddToCart).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-CROP' })
    );
  });

  test('preserves independent single-product quick-add behavior without whole-look queue side effects', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, inStock: true, sizes: ['S', 'M'] }
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

    // Click single item Add
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    // Select size 'M'
    fireEvent.click(within(dialog).getByRole('button', { name: /^M$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Directly adds 1 item to cart via CartContext
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LOOK-01-JACKET', size: 'M' })
    );
  });

  test('preserves selected variant color, colorHex, and image in whole-look queue', async () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          {
            id: 'LOOK-01-JACKET',
            name: 'Holographic Jacket',
            price: 125,
            color: 'Iridescent Lilac',
            colorHex: '#C8A2C8',
            image: '/images/jacket-lilac.png',
            inStock: true,
            sizes: ['S', 'M'],
            variants: [
              { color: 'Iridescent Lilac', colorHex: '#C8A2C8', image: '/images/jacket-lilac.png' },
              { color: 'Obsidian Black', colorHex: '#1A1A1A', image: '/images/jacket-black.png' }
            ]
          }
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

    fireEvent.click(screen.getByRole('button', { name: /Add the whole look/i }));

    const dialog = screen.getByRole('dialog');
    // Select the second variant
    const blackVariantBtns = within(dialog).getAllByRole('button', { name: 'Obsidian Black' });
    fireEvent.click(blackVariantBtns[0]);
    await new Promise((r) => setTimeout(r, 200));

    // Select size 'S'
    fireEvent.click(within(dialog).getByRole('button', { name: /^S$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'LOOK-01-JACKET',
        color: 'Obsidian Black',
        colorHex: '#1A1A1A',
        image: '/images/jacket-black.png',
        size: 'S'
      })
    );
  });

  test('prevents duplicate modal queues and duplicate items on repeated clicks of Add the whole look', () => {
    mockLooksData = [
      {
        id: 'look-1',
        title: 'Spring Bloom',
        season: 'Spring',
        coverImage: '/images/spring.jpg',
        palette: ['#ffffff'],
        hotspots: [],
        shoppableItems: [
          { id: 'LOOK-01-JACKET', name: 'Holographic Jacket', price: 125, inStock: true, sizes: ['S', 'M'] }
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

    const btn = screen.getByRole('button', { name: /Add the whole look/i });
    // Click twice rapidly
    fireEvent.click(btn);
    fireEvent.click(btn);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^M$/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /product\.addToBag/ }));

    // Should only add once
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

