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

  const generation = useRef(0);

  const fetchResource = useCallback(async (resource, params = {}) => {
    const current = ++generation.current;
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
      if (current !== generation.current) return;

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
      if (current !== generation.current) return;
      setData([]);
      setErrors(previous => ({ ...previous, [resource]: apiErrorText(error, t) }));
      setStatus(previous => ({ ...previous, [resource]: 'error' }));
    }
  }, [t]);

  const changePage = useCallback((resource, newPage, extraParams = {}) => {
    const currentParams = queryStateRef.current[resource] || {};
    return fetchResource(resource, { ...currentParams, ...extraParams, page: newPage });
  }, [fetchResource]);

  const refresh = useCallback(async (filters = {}) => {
    await Promise.all([
      fetchResource('inventory', { ...queryStateRef.current.inventory, ...filters.inventory }),
      fetchResource('orders', { ...queryStateRef.current.orders, ...filters.orders }),
      fetchResource('members', { ...queryStateRef.current.members, ...filters.members })
    ]);
  }, [fetchResource]);

  useEffect(() => {
    setInventory([]); setOrders([]); setMembers([]);
    refresh();
    return () => { generation.current++; };
  }, [refresh, userId]);

  return {
    inventory,
    setInventory,
    orders,
    setOrders,
    members,
    setMembers,
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
