/* "+ Add Garment" used to take the admin console down to the error boundary
 * ("Something Interrupted"). The button opens AddProductModal, and the modal
 * rendered <TagIcon> and <ImageIcon> without ever importing them — a
 * ReferenceError on the first render, which the router's boundary caught and
 * turned into a dead page. Nothing on the server was involved.
 *
 * These tests render the real page and the real modal, so an identifier that
 * is used but not imported fails here rather than in front of an admin. */

import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  api: {
    getAdminNotifications: vi.fn().mockResolvedValue({ success: true, data: [], unreadCount: 0 }),
    createProduct: vi.fn()
  },
  apiErrorText: (error) => error?.message || 'failed'
}));

// A real resolver over the English copy, so the English assertions below read
// the words an admin sees rather than translation keys.
vi.mock('../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return { useLanguage: () => ({ lang: 'en', t: (key, vars) => {
    const v = resolve(translations.en, key) ?? key;
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : v;
  } }) };
});
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'admin-1', name: 'Admin', role: 'Admin' }, logout: vi.fn() })
}));
vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../features/media/MediaManager', () => ({ default: () => null }));
vi.mock('../hooks/useChangeMotion', () => ({ default: () => ({ current: null }) }));

const ready = { inventory: 'ready', orders: 'ready', members: 'ready', stats: 'ready' };
vi.mock('../components/admin/useAdminData', () => ({
  default: () => ({
    inventory: [], setInventory: vi.fn(),
    orders: [], setOrders: vi.fn(),
    members: [], setMembers: vi.fn(),
    stats: { totalProducts: 0, totalOrders: 0, paidOrders: 0, paidRevenue: 0, totalStockUnits: 0, lowStockCount: 0, vipMembers: 0, categories: {}, monthly: [] },
    status: ready, errors: {}, refresh: vi.fn(), pagination: {}, changePage: vi.fn(), fetchResource: vi.fn()
  })
}));

const { default: AdminPage } = await import('./AdminPage');
const { default: AddProductModal } = await import('../components/admin/AddProductModal');

afterEach(cleanup);

describe('Add Garment', () => {
  test('the dashboard button opens the garment form instead of crashing the page', () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /add garment/i }));

    const dialog = screen.getByRole('dialog', { name: /add new garment release/i });
    expect(within(dialog).getByPlaceholderText(/heavyweight boxy tee/i)).toBeTruthy();
    expect(within(dialog).getByText(/price \(usd\)/i)).toBeTruthy();
    expect(within(dialog).getByText(/quantity \(stock\)/i)).toBeTruthy();
    expect(within(dialog).getByText(/product tag/i)).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /publish to inventory/i })).toBeTruthy();
    expect(screen.queryByText(/something interrupted/i)).toBeNull();
  });

  test('the modal renders on its own, including the tag and image icons', () => {
    render(<AddProductModal isOpen onClose={() => {}} onAddProduct={async () => true} saving={false} saveError={null} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    // A broken preview falls back to the image placeholder icon, which was one
    // of the two missing identifiers.
    fireEvent.error(screen.getByAltText('Preview'));
    expect(screen.queryByAltText('Preview')).toBeNull();
  });
});
