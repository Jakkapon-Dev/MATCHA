import { useEffect, useRef, useState, useCallback } from 'react';
import { api, apiErrorText } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { normalizeProduct, normalizeOrder, normalizeMember } from './adminData';

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
  const [status, setStatus] = useState({ inventory: 'loading', orders: 'loading', members: 'loading' });
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

  /* One counter per resource, not one shared by all three.

     refresh() fires inventory, orders and members at the same time. With a
     single counter each call bumped it, so by the time the first response
     came back the counter had already moved twice and that response was
     discarded as stale — the Inventory and Orders tables stayed empty until
     something refetched them on their own. A request may only be superseded
     by a later request for the *same* resource. */
  const generations = useRef({ inventory: 0, orders: 0, members: 0 });

  const fetchResource = useCallback(async (resource, params = {}) => {
    if (generations.current[resource] === undefined) generations.current[resource] = 0;
    const current = ++generations.current[resource];
    setStatus(previous => ({ ...previous, [resource]: 'loading' }));
    setErrors(previous => ({ ...previous, [resource]: null }));

    const fetcherMap = {
      inventory: [api.getAdminProducts, normalizeProduct, setInventory],
      orders: [api.getAdminOrders, normalizeOrder, setOrders],
      members: [api.getUsers, normalizeMember, setMembers],
    };

    const target = fetcherMap[resource];
    if (!target) return;
    const [fetchData, normalize, setData] = target;

    const merged = {
      page: 1,
      limit: paginationRef.current[resource]?.limit || 25,
      ...queryStateRef.current[resource],
      ...params
    };

    // Update query state ref and state
    queryStateRef.current = { ...queryStateRef.current, [resource]: merged };
    setQueryState(prev => ({ ...prev, [resource]: merged }));

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
      const result = await fetchData(apiParams);
      if (!result?.success || !Array.isArray(result.data)) throw new Error('Invalid server response');
      if (current !== generations.current[resource]) return;

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
      if (current !== generations.current[resource]) return;
      setData([]);
      setErrors(previous => ({ ...previous, [resource]: apiErrorText(error, t) }));
      setStatus(previous => ({ ...previous, [resource]: 'error' }));
    }
  }, [t]);

  const changePage = useCallback((resource, newPage, extraParams = {}) => {
    const currentParams = queryStateRef.current[resource] || {};
    return fetchResource(resource, { ...currentParams, ...extraParams, page: newPage });
  }, [fetchResource]);

  const statsGeneration = useRef(0);

  const fetchStats = useCallback(async () => {
    const current = ++statsGeneration.current;
    try {
      const result = await api.getAdminStats();
      if (current !== statsGeneration.current) return;
      if (result?.success && result.data) setStats(result.data);
    } catch {
      // The dashboard falls back to per-page totals; a failed aggregate must
      // not take the tables down with it.
      if (current === statsGeneration.current) setStats(null);
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
      // Unmount or a change of admin: every resource in flight is abandoned.
      for (const key of Object.keys(generations.current)) generations.current[key]++;
      statsGeneration.current++;
    };
  }, [refresh, userId]);

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
