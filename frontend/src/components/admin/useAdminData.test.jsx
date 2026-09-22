/* The admin console's three tables load at once, and used to cancel each other.
 *
 * `refresh()` fires inventory, orders and members in parallel. They shared a
 * single generation counter, so each call bumped the one counter: by the time
 * the first response arrived the counter had moved twice and that response —
 * and the second — were discarded as stale. On a cold open of the console,
 * Inventory and Orders stayed empty until the administrator happened to click
 * a tab.
 *
 * "all three resources arrive on a cold open" below is the regression test:
 * against the shared-counter version it sees two empty tables.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import useAdminData from './useAdminData';

vi.mock('../../services/api', () => ({
  api: {
    getAdminProducts: vi.fn(),
    getAdminOrders: vi.fn(),
    getUsers: vi.fn(),
    getAdminStats: vi.fn()
  },
  apiErrorText: (error) => error?.message || 'failed'
}));

/* One stable object, as the real provider hands out: it memoises on `lang`.
   Returning a fresh `t` on every render would be a lie about the provider,
   and would drive any hook that depends on `t` into a render loop. */
const language = { t: (key) => key };
vi.mock('../../context/LanguageContext.jsx', () => ({
  useLanguage: () => language
}));

const { api } = await import('../../services/api');

/* A response shaped like the admin endpoints'. `tag` rides along on each row
   so a test can say which request a rendered table came from. */
const page = (tag, count = 1, pagination = {}) => ({
  success: true,
  data: Array.from({ length: count }, (_, i) => ({
    _id: `${tag}-${i}`,
    id: `${tag}-${i}`,
    name: tag,
    stock: 5,
    customer: { firstName: tag, lastName: 'X', email: `${tag}@t.test` },
    items: [],
    total: 10,
    status: 'pending',
    paymentStatus: 'paid',
    tier: 'Regular Member',
    createdAt: '2026-09-01T00:00:00.000Z'
  })),
  pagination: { total: count, page: 1, limit: 25, pageSize: 25, totalPages: 1, ...pagination }
});

/* A request that only settles when the test says so, and that honours the
   abort signal the hook hands it — which is how "did inventory cancel
   orders?" becomes an observable fact rather than a guess. */
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function abortable(pending) {
  return (_params, { signal } = {}) => {
    if (signal) {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        pending.reject(error);
      });
    }
    return pending.promise;
  };
}

beforeEach(() => {
  api.getAdminStats.mockResolvedValue({ success: true, data: { totalProducts: 75 } });
  api.getAdminProducts.mockResolvedValue(page('prod'));
  api.getAdminOrders.mockResolvedValue(page('order'));
  api.getUsers.mockResolvedValue(page('member'));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('concurrent refresh', () => {
  test('all three resources arrive on a cold open', async () => {
    const { result } = renderHook(() => useAdminData('u_admin'));

    await waitFor(() => {
      expect(result.current.status).toEqual({ inventory: 'ready', orders: 'ready', members: 'ready', stats: 'ready' });
    });

    // The shared counter left two of these three empty.
    expect(result.current.inventory).toHaveLength(1);
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.members).toHaveLength(1);
    expect(result.current.errors).toEqual({ inventory: null, orders: null, members: null, stats: null });
  });

  test('each resource keeps its own pagination metadata', async () => {
    api.getAdminProducts.mockResolvedValue(page('prod', 2, { total: 75, totalPages: 3 }));
    api.getAdminOrders.mockResolvedValue(page('order', 1, { total: 13, totalPages: 1 }));

    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(result.current.status.inventory).toBe('ready'));

    expect(result.current.pagination.inventory.total).toBe(75);
    expect(result.current.pagination.orders.total).toBe(13);
  });

  test('a slow resource does not hold up the others, and does not blank them when it fails', async () => {
    const slowMembers = deferred();
    api.getUsers.mockImplementation(abortable(slowMembers));

    const { result } = renderHook(() => useAdminData('u_admin'));

    await waitFor(() => {
      expect(result.current.status.inventory).toBe('ready');
      expect(result.current.status.orders).toBe('ready');
    });
    // Loading and error state are per resource, so members can still be in
    // flight while the other two are on screen.
    expect(result.current.status.members).toBe('loading');

    await act(async () => {
      slowMembers.reject(new Error('members exploded'));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.status.members).toBe('error'));
    expect(result.current.errors.members).toBe('members exploded');
    expect(result.current.errors.inventory).toBeNull();
    expect(result.current.inventory).toHaveLength(1);
    expect(result.current.orders).toHaveLength(1);
  });
});

describe('cancellation is scoped to one resource', () => {
  test('a new inventory request cancels only the old inventory request', async () => {
    const firstInventory = deferred();
    const pendingOrders = deferred();
    const pendingMembers = deferred();

    api.getAdminProducts.mockImplementationOnce(abortable(firstInventory));
    api.getAdminOrders.mockImplementation(abortable(pendingOrders));
    api.getUsers.mockImplementation(abortable(pendingMembers));

    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(1));

    const ordersSignal = api.getAdminOrders.mock.calls[0][1].signal;
    const membersSignal = api.getUsers.mock.calls[0][1].signal;
    const firstInventorySignal = api.getAdminProducts.mock.calls[0][1].signal;

    api.getAdminProducts.mockResolvedValue(page('prod-second'));
    await act(async () => {
      await result.current.fetchResource('inventory', { search: 'coat' });
    });

    expect(firstInventorySignal.aborted).toBe(true);
    expect(ordersSignal.aborted).toBe(false);
    expect(membersSignal.aborted).toBe(false);

    // Orders and members are still loading, not errored — nothing cancelled them.
    expect(result.current.status.orders).toBe('loading');
    expect(result.current.status.members).toBe('loading');

    await act(async () => {
      pendingOrders.resolve(page('order'));
      pendingMembers.resolve(page('member'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.orders).toHaveLength(1);
      expect(result.current.members).toHaveLength(1);
    });
  });

  test('a cancelled request is not reported to the administrator as a failure', async () => {
    const firstInventory = deferred();
    api.getAdminProducts.mockImplementationOnce(abortable(firstInventory));

    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(1));

    api.getAdminProducts.mockResolvedValue(page('prod-second'));
    await act(async () => {
      await result.current.fetchResource('inventory', { search: 'coat' });
    });
    // The abort rejection lands after its replacement has already settled.
    await act(async () => { await Promise.resolve(); });

    expect(result.current.status.inventory).toBe('ready');
    expect(result.current.errors.inventory).toBeNull();
    expect(result.current.inventory[0].name).toBe('prod-second');
  });
});

describe('stale responses', () => {
  test('a slow first response cannot overwrite a fast second one', async () => {
    /* The out-of-order case: the administrator types, the first search is
       slow, the second is quick, and the first arrives last. Without the
       generation check the screen would settle on the older answer. Here the
       first request is not aborted — it is allowed to resolve normally — so
       only the generation can save it. */
    const slowFirst = deferred();
    api.getAdminProducts.mockImplementationOnce(() => slowFirst.promise);

    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(1));

    api.getAdminProducts.mockResolvedValue(page('newest'));
    await act(async () => {
      await result.current.fetchResource('inventory', { search: 'second' });
    });
    expect(result.current.inventory[0].name).toBe('newest');

    await act(async () => {
      slowFirst.resolve(page('stale'));
      await Promise.resolve();
    });

    expect(result.current.inventory[0].name).toBe('newest');
    expect(result.current.status.inventory).toBe('ready');
  });

  test('rapid filter and page changes settle on the last one asked for', async () => {
    const calls = [];
    api.getAdminProducts.mockImplementation(async (params) => {
      calls.push(params);
      // Earlier requests deliberately take longer, so they land out of order.
      const delay = params.search === 'c' ? 0 : 20;
      await new Promise(resolve => setTimeout(resolve, delay));
      return page(params.search || 'none');
    });

    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(result.current.status.inventory).toBe('ready'));

    await act(async () => {
      result.current.fetchResource('inventory', { search: 'a', page: 1 });
      result.current.fetchResource('inventory', { search: 'b', page: 2 });
      await result.current.fetchResource('inventory', { search: 'c', page: 3 });
      await new Promise(resolve => setTimeout(resolve, 40));
    });

    expect(result.current.inventory[0].name).toBe('c');
    expect(result.current.queryState.inventory.search).toBe('c');
    expect(result.current.queryState.inventory.page).toBe(3);
    expect(calls.map(c => c.search).filter(Boolean)).toEqual(['a', 'b', 'c']);
  });

  test('changePage reaches the server with the new page and keeps the filters', async () => {
    const { result } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(result.current.status.inventory).toBe('ready'));

    await act(async () => { await result.current.fetchResource('inventory', { category: 'Tops' }); });
    await act(async () => { await result.current.changePage('inventory', 3); });

    const last = api.getAdminProducts.mock.calls.at(-1)[0];
    expect(last.page).toBe(3);
    expect(last.category).toBe('Tops');
  });
});

describe('teardown', () => {
  test('nothing is written to state after unmount', async () => {
    const pendingInventory = deferred();
    api.getAdminProducts.mockImplementation(abortable(pendingInventory));

    const errors = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => { errors.push(args.join(' ')); });

    const { result, unmount } = renderHook(() => useAdminData('u_admin'));
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(1));
    const signal = api.getAdminProducts.mock.calls[0][1].signal;

    const before = result.current.status.inventory;
    unmount();

    // The in-flight request is stopped on the wire, not merely ignored.
    expect(signal.aborted).toBe(true);

    await act(async () => {
      pendingInventory.resolve(page('too-late'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.status.inventory).toBe(before);
    expect(result.current.inventory).toHaveLength(0);
    // React shouts about a setState on an unmounted component; nothing did.
    expect(errors.filter(line => /unmounted|not wrapped in act/i.test(line))).toEqual([]);
    consoleError.mockRestore();
  });

  test('switching administrator abandons the previous one’s requests', async () => {
    const first = deferred();
    api.getAdminProducts.mockImplementationOnce(abortable(first));

    const { rerender } = renderHook(({ id }) => useAdminData(id), { initialProps: { id: 'u_one' } });
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(1));
    const firstSignal = api.getAdminProducts.mock.calls[0][1].signal;

    api.getAdminProducts.mockResolvedValue(page('second-admin'));
    await act(async () => { rerender({ id: 'u_two' }); });

    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(api.getAdminProducts).toHaveBeenCalledTimes(2));
  });
});
