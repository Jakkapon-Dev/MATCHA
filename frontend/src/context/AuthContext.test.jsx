/* User A signs out, User B signs in on the same browser: B must not see A's
   wishlist or saved looks. Both are kept in localStorage under keys no account
   owns, and signing out used to leave them there. */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../services/api', () => ({ api: {}, setToken: vi.fn() }));

const { AuthProvider, useAuth } = await import('./AuthContext.jsx');

const render = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

beforeEach(() => localStorage.clear());

describe('signing out', () => {
  test("clears the wishlist and saved looks, so the next account starts without A's", () => {
    localStorage.setItem('matcha_wishlist', JSON.stringify([{ id: 'AUT-BOT-004' }]));
    localStorage.setItem('matcha_saved_looks', JSON.stringify(['SPREAD-01']));
    const { result } = render();
    act(() => { result.current.login({ id: 'u_a', name: 'A' }, true, 'token-a'); });
    act(() => { result.current.logout(); });

    expect(localStorage.getItem('matcha_wishlist')).toBeNull();
    expect(localStorage.getItem('matcha_saved_looks')).toBeNull();

    act(() => { result.current.login({ id: 'u_b', name: 'B' }, true, 'token-b'); });
    expect(localStorage.getItem('matcha_wishlist')).toBeNull();
    expect(result.current.currentUser.id).toBe('u_b');
  });

  test('signing in keeps what the guest saved before it', () => {
    localStorage.setItem('matcha_wishlist', JSON.stringify([{ id: 'AUT-BOT-004' }]));
    const { result } = render();
    act(() => { result.current.login({ id: 'u_a' }, true, 'token-a'); });
    expect(JSON.parse(localStorage.getItem('matcha_wishlist'))).toEqual([{ id: 'AUT-BOT-004' }]);
  });
});
