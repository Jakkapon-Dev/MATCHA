import { useEffect, useRef, useState, useCallback } from 'react';
import { api, apiErrorText } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { normalizeProduct, normalizeOrder, normalizeMember } from './adminData';

export const ADMIN_RESOURCES = ['inventory', 'orders', 'members'];

const newSlot = () => ({ generation: 0, controller: null });
const newSlots = () => Object.fromEntries(ADMIN_RESOURCES.map(name => [name, newSlot()]));

/* A request that was superseded or torn down is not a request that failed.

   fetch rejects with an AbortError when its signal fires, and telling the
   administrator "could not load" because they typed a second character into
   the search box would be a lie about the state of their shop. */
const wasAborted = (error, signal) => Boolean(signal?.aborted) || error?.name === 'AbortError';

// Only API-confirmed data is kept in memory. Old localStorage records can contain
// demo customers and failed writes, so they must never populate these tables.
export default function useAdminData(userId) {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  // Whole-collection figures for the dashboard, counted by the database rather
  // than summed from the 25 rows the tables happen to be showing.
  const [stats, setStats] = useState(null);
  /* `stats` sits alongside the three tables in the same status map, so the
     dashboard can gate on it exactly as the tables do. It is a resource like
     any other: while it is loading the dashboard says so, and if it fails the
     dashboard says that instead of quietly showing numbers derived from one
     page of rows. */
  const [status, setStatus] = useState({ inventory: 'loading', orders: 'loading', members: 'loading', stats: 'loading' });
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({
    inventory: { page: 1, limit: 25, pageSize: 25, total: 0, totalPages: 1 },
    orders: { page: 1, limit: 25, pageSize: 25, total: 0, totalPages: 1 },
    members: { page: 1, limit: 25, pageSize: 25, total: 0, totalPages: 1 }
  });
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const [queryState, setQueryState] = useState({
    inventory: { page: 1, limit: 25, search: '', category: 'ALL', status: 'ALL' },
    orders: { page: 1, limit: 25, search: '', status: 'ALL' },
    members: { page: 1, limit: 25, search: '', tier: 'ALL' }
  });
  const queryStateRef = useRef(queryState);
  queryStateRef.current = queryState;

  /* One request slot per resource, never one shared between them.

     refresh() fires inventory, orders and members at the same time. They used
     to share a single generation counter, so each call bumped the one counter
     and by the time the first response arrived it had already moved twice —
     that response, and the second, were both discarded as stale and their
     tables stayed empty until something happened to refetch them. On a cold
     open of the admin console that meant Inventory and Orders were blank
     until the administrator clicked a tab.

     A resource's request may now only be superseded by a later request for
     the *same* resource. The generation decides whose response is allowed to
     reach state; the AbortController stops the superseded request on the wire
     rather than leaving it to arrive and be thrown away. */
  const requests = useRef(newSlots());

  /* Cleared when the hook is torn down for good, so nothing still in flight
     can write to state afterwards. It gets an effect of its own with no
     dependencies: folded into the fetching effect below it would be cleared
     by any re-run of that effect — a change of administrator — and the
     console would never write to state again. */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* The translator is read at the moment an error is formatted rather than
     captured as a dependency. As a dependency it rebuilt fetchResource on
     every language change, which rebuilt refresh, which re-ran the effect
     below: switching to English emptied all three tables and refetched them.
     A provider that did not memoise `t` would make that a render loop. */
  const tRef = useRef(t);
  tRef.current = t;

  /* Abandon whatever `resource` has in flight. Deliberately reaches for one
     resource: an inventory request must never cancel orders or members. */
  const abandon = useCallback((resource) => {
    const slot = requests.current[resource];
    if (!slot) return;
    slot.generation += 1;
    slot.controller?.abort();
    slot.controller = null;
  }, []);

  const fetchResource = useCallback(async (resource, params = {}) => {
    const fetcherMap = {
      inventory: [api.getAdminProducts, normalizeProduct, setInventory],
      orders: [api.getAdminOrders, normalizeOrder, setOrders],
      members: [api.getUsers, normalizeMember, setMembers],
    };
    const target = fetcherMap[resource];
    if (!target) return;
    const [fetchData, normalize, setData] = target;

    if (!requests.current[resource]) requests.current[resource] = newSlot();
    const slot = requests.current[resource];

    // Cancel this resource's previous request, and only this resource's.
    slot.controller?.abort();
    const controller = new AbortController();
    slot.controller = controller;
    const generation = ++slot.generation;

    /* The one question every write to state has to pass: is this still the
       newest request for this resource, and is the hook still alive? */
    const isCurrent = () => mounted.current && generation === slot.generation;

    setStatus(previous => ({ ...previous, [resource]: 'loading' }));
    setErrors(previous => ({ ...previous, [resource]: null }));

    const merged = {
      page: 1,
      limit: paginationRef.current[resource]?.limit || 25,
      ...queryStateRef.current[resource],
      ...params
    };

    /* The newest parameters win outright, even while an older request is
       still settling. Typing quickly in the search box, or clicking through
       pages, therefore ends on what was asked for last rather than on
       whichever response happened to come back last. */
    queryStateRef.current = { ...queryStateRef.current, [resource]: merged };
    if (mounted.current) setQueryState(prev => ({ ...prev, [resource]: merged }));

    // Clean params for backend API request
    const apiParams = {
      page: merged.page,
      limit: merged.limit
    };
    if (merged.search && typeof merged.search === 'string' && merged.search.trim()) {
      apiParams.search = merged.search.trim();
    }
    if (merged.category && merged.category !== 'ALL') {
      apiParams.category = merged.category;
    }
    if (merged.status && merged.status !== 'ALL') {
      apiParams.status = merged.status;
    }
    if (merged.tier && merged.tier !== 'ALL') {
      apiParams.tier = merged.tier;
    }

    try {
      const result = await fetchData(apiParams, { signal: controller.signal });
      if (!result?.success || !Array.isArray(result.data)) throw new Error('Invalid server response');
      if (!isCurrent()) return;

      setData(result.data.map(normalize));
      if (result.pagination) {
        setPagination(previous => ({
          ...previous,
          [resource]: {
            ...previous[resource],
            ...result.pagination,
            pageSize: result.pagination.pageSize || result.pagination.limit
          }
        }));
      } else {
        setPagination(previous => ({
          ...previous,
          [resource]: { ...previous[resource], page: merged.page }
        }));
      }
      setStatus(previous => ({ ...previous, [resource]: 'ready' }));
    } catch (error) {
      // Superseded or torn down: leave the screen to whoever replaced us.
      if (wasAborted(error, controller.signal) || !isCurrent()) return;
      setData([]);
      setErrors(previous => ({ ...previous, [resource]: apiErrorText(error, tRef.current) }));
      setStatus(previous => ({ ...previous, [resource]: 'error' }));
    } finally {
      if (slot.controller === controller) slot.controller = null;
    }
  }, []);

  const changePage = useCallback((resource, newPage, extraParams = {}) => {
    const currentParams = queryStateRef.current[resource] || {};
    return fetchResource(resource, { ...currentParams, ...extraParams, page: newPage });
  }, [fetchResource]);

  // The dashboard aggregate gets a slot of its own, for the same reason.
  const statsRequest = useRef(newSlot());

  const fetchStats = useCallback(async () => {
    const slot = statsRequest.current;
    slot.controller?.abort();
    const controller = new AbortController();
    slot.controller = controller;
    const generation = ++slot.generation;
    const isCurrent = () => mounted.current && generation === slot.generation;

    setStatus(previous => ({ ...previous, stats: 'loading' }));
    setErrors(previous => ({ ...previous, stats: null }));

    try {
      const result = await api.getAdminStats({ signal: controller.signal });
      if (!result?.success || !result.data) throw new Error('Invalid server response');
      if (!isCurrent()) return;
      setStats(result.data);
      setStatus(previous => ({ ...previous, stats: 'ready' }));
    } catch (error) {
      /* A failed aggregate must not take the tables down with it — the
         dashboard alone depends on it — and an aborted one must not clear
         figures its replacement is about to fill in.

         What it must never do is fall back to totalling the rows the tables
         happen to be holding. That is 25 rows out of 75, and a KPI that is
         quietly wrong is worse than one that says it could not be loaded. */
      if (wasAborted(error, controller.signal) || !isCurrent()) return;
      setStats(null);
      setErrors(previous => ({ ...previous, stats: apiErrorText(error, tRef.current) }));
      setStatus(previous => ({ ...previous, stats: 'error' }));
    } finally {
      if (slot.controller === controller) slot.controller = null;
    }
  }, []);

  const refresh = useCallback(async (filters = {}) => {
    await Promise.all([
      fetchStats(),
      fetchResource('inventory', { ...queryStateRef.current.inventory, ...filters.inventory }),
      fetchResource('orders', { ...queryStateRef.current.orders, ...filters.orders }),
      fetchResource('members', { ...queryStateRef.current.members, ...filters.members })
    ]);
  }, [fetchResource, fetchStats]);

  useEffect(() => {
    setInventory([]); setOrders([]); setMembers([]);
    refresh();
    return () => {
      // A change of administrator, or teardown: everything in flight for this
      // hook is abandoned, each resource through its own slot.
      for (const resource of Object.keys(requests.current)) abandon(resource);
      statsRequest.current.generation += 1;
      statsRequest.current.controller?.abort();
      statsRequest.current.controller = null;
    };
  }, [refresh, userId, abandon]);

  return {
    inventory,
    setInventory,
    orders,
    setOrders,
    members,
    setMembers,
    stats,
    fetchStats,
    status,
    errors,
    refresh,
    pagination,
    setPagination,
    changePage,
    fetchResource,
    queryState
  };
}
