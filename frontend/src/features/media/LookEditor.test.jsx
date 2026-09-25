/* The admin hotspot editor: click to place, pick a product, drag to move,
 * remove, and save — with the payload carrying percentages only. */
import React from 'react';
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const saveLook = vi.fn(async () => ({ success: true }));
let manager;
vi.mock('./useMediaManager', () => ({ default: () => manager }));
vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: k => k }) }));

const { default: MediaManager } = await import('./MediaManager');

const products = [
  { _id: 'a1', id: 'JACKET-1', name: 'Test Jacket', color: 'Black', category: 'Outerwear', price: 80, image: '/j.jpg', variants: [] },
  { _id: 'a2', id: 'TROUSER-1', name: 'Test Trouser', color: 'Grey', category: 'Bottoms', price: 60, image: '/t.jpg', variants: [] }
];
const look = { id: 'SPREAD-01', title: 'Ginza', heroImage: '/images/look.jpg', published: true, revision: 2, items: [{ productId: 'JACKET-1', color: 'Black', x: 40, y: 30 }] };

// jsdom has no PointerEvent, so pointer coordinates would be dropped.
if (!window.PointerEvent) {
  window.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; }
  };
}

beforeEach(() => {
  saveLook.mockClear();
  manager = {
    assets: [{ _id: 'm1', url: '/api/media/files/abc.webp', alt: 'Studio shot' }], looks: [look], products,
    loading: false, busy: false, error: '', notice: '', page: 1, setPage: vi.fn(), archived: false, setArchived: vi.fn(),
    total: 1, search: '', setSearch: vi.fn(), productPage: 1, setProductPage: vi.fn(), productTotal: 2,
    reload: vi.fn(), saveLook
  };
});
afterEach(cleanup);

// jsdom has no layout: give the board a 200x400 box at the origin.
const board = () => {
  const el = screen.getByTestId('pin-board');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 400, right: 200, bottom: 400 });
  return el;
};
const openLook = () => {
  render(<MediaManager initialTab="looks" />);
  fireEvent.change(screen.getByLabelText('เลือกลุค'), { target: { value: 'SPREAD-01' } });
};
const pins = () => within(screen.getByTestId('pin-board')).getAllByRole('button');

describe('lookbook hotspot editor', () => {
  test('clicking the photograph places a new pin there and focuses its product picker', () => {
    openLook();
    fireEvent.click(board(), { clientX: 100, clientY: 100 });
    expect(pins()).toHaveLength(2);
    expect(pins()[1].style.left).toBe('50%');
    expect(pins()[1].style.top).toBe('25%');
    const picker = screen.getAllByLabelText('สินค้า')[1];
    expect(document.activeElement).toBe(picker);
  });

  test('picking a product previews it and enables Save; the payload is percentages and ids', async () => {
    openLook();
    fireEvent.click(board(), { clientX: 100, clientY: 300 });
    const save = screen.getByRole('button', { name: 'บันทึก Lookbook' });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getAllByLabelText('สินค้า')[1], { target: { value: 'TROUSER-1' } });
    expect(screen.getByText('Test Trouser', { selector: 'strong' })).toBeTruthy();
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await Promise.resolve();
    expect(saveLook).toHaveBeenCalledTimes(1);
    expect(saveLook.mock.calls[0][0].items).toEqual([
      { productId: 'JACKET-1', color: 'Black', x: 40, y: 30 },
      { productId: 'TROUSER-1', color: 'Grey', x: 50, y: 75 }
    ]);
  });

  test('dragging a pin moves it without dropping a second pin', () => {
    openLook();
    const b = board();
    const pin = pins()[0];
    fireEvent.pointerDown(pin, { clientX: 80, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(pin, { clientX: 20, clientY: 40, pointerId: 1 });
    fireEvent.pointerUp(pin, { pointerId: 1 });
    // Without pointer capture the click that ends a drag lands on the board.
    fireEvent.click(b, { clientX: 20, clientY: 40 });
    expect(pins()).toHaveLength(1);
    expect(pins()[0].style.left).toBe('10%');
    expect(pins()[0].style.top).toBe('10%');
  });

  test('arrow keys nudge the selected pin', () => {
    openLook();
    fireEvent.keyDown(pins()[0], { key: 'ArrowRight' });
    fireEvent.keyDown(pins()[0], { key: 'ArrowDown', shiftKey: true });
    expect(pins()[0].style.left).toBe('40.5%');
    expect(pins()[0].style.top).toBe('35%');
  });

  test('removing a pin drops it from the look', () => {
    openLook();
    fireEvent.click(screen.getByRole('button', { name: 'นำจุดนี้ออก' }));
    expect(within(screen.getByTestId('pin-board')).queryAllByRole('button')).toHaveLength(0);
  });

  test('the same product twice is flagged and cannot be saved', () => {
    openLook();
    fireEvent.click(board(), { clientX: 100, clientY: 100 });
    fireEvent.change(screen.getAllByLabelText('สินค้า')[1], { target: { value: 'JACKET-1' } });
    expect(screen.getAllByRole('alert').some(a => /อยู่ในลุคแล้ว/.test(a.textContent))).toBe(true);
    expect(screen.getByRole('button', { name: 'บันทึก Lookbook' }).disabled).toBe(true);
  });

  test('a new look needs a photograph before pins can be placed', () => {
    render(<MediaManager initialTab="looks" />);
    fireEvent.click(screen.getByRole('button', { name: /สร้างลุคใหม่/ }));
    expect(screen.queryByTestId('pin-board')).toBeNull();
    fireEvent.change(screen.getByLabelText('ภาพนายแบบ / นางแบบ'), { target: { value: '/api/media/files/abc.webp' } });
    expect(screen.getByTestId('pin-board')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('ชื่อลุค'), { target: { value: 'New look' } });
    fireEvent.click(board(), { clientX: 50, clientY: 50 });
    fireEvent.change(screen.getAllByLabelText('สินค้า')[0], { target: { value: 'JACKET-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึก Lookbook' }));
    const saved = saveLook.mock.calls[0][0];
    expect(saved.id).toMatch(/^LOOK-/);
    expect(saved.revision).toBe(0);
    expect(saved.published).toBe(false);
  });
});
