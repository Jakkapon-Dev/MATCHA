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
    inventory: { page: 1, limit: 25, total: 0, totalPages: 1 },
    orders: { page: 1, limit: 25, total: 0, totalPages: 1 },
    members: { page: 1, limit: 25, total: 0, totalPages: 1 }
  });
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const generation = useRef(0);

  const refresh = useCallback(async (filters = {}) => {
    const current = ++generation.current;
    setStatus({ inventory: 'loading', orders: 'loading', members: 'loading' });
    setErrors({});
    await Promise.all([
      ['inventory', api.getAdminProducts, normalizeProduct, setInventory, { page: paginationRef.current.inventory.page, limit: paginationRef.current.inventory.limit, ...filters.inventory }],
      ['orders', api.getAdminOrders, normalizeOrder, setOrders, { page: paginationRef.current.orders.page, limit: paginationRef.current.orders.limit, ...filters.orders }],
      ['members', api.getUsers, normalizeMember, setMembers, { page: paginationRef.current.members.page, limit: paginationRef.current.members.limit, ...filters.members }]
    ].map(async ([key, fetchData, normalize, setData, params]) => {
      try {
        const result = await fetchData(params);
        if (!result?.success || !Array.isArray(result.data)) throw new Error('Invalid server response');
        if (current !== generation.current) return;
        setData(result.data.map(normalize));
        if (result.pagination) {
          setPagination(previous => ({ ...previous, [key]: { ...previous[key], ...result.pagination } }));
        }
        setStatus(previous => ({ ...previous, [key]: 'ready' }));
      } catch (error) {
        if (current !== generation.current) return;
        setData([]);
        setErrors(previous => ({ ...previous, [key]: apiErrorText(error, t) }));
        setStatus(previous => ({ ...previous, [key]: 'error' }));
      }
    }));
  }, [t]);

  const changePage = useCallback(async (resource, newPage, extraParams = {}) => {
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

    try {
      const currentLimit = paginationRef.current[resource]?.limit || 25;
      const result = await fetchData({ page: newPage, limit: currentLimit, ...extraParams });
      if (!result?.success || !Array.isArray(result.data)) throw new Error('Invalid server response');
      if (current !== generation.current) return;
      setData(result.data.map(normalize));
      if (result.pagination) {
        setPagination(previous => ({ ...previous, [resource]: { ...previous[resource], ...result.pagination } }));
      } else {
        setPagination(previous => ({ ...previous, [resource]: { ...previous[resource], page: newPage } }));
      }
      setStatus(previous => ({ ...previous, [resource]: 'ready' }));
    } catch (error) {
      if (current !== generation.current) return;
      setErrors(previous => ({ ...previous, [resource]: apiErrorText(error, t) }));
      setStatus(previous => ({ ...previous, [resource]: 'error' }));
    }
  }, [t]);

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
    changePage
  };
}

