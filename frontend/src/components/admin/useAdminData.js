import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { normalizeProduct, normalizeOrder, normalizeMember } from './adminData';

// Only API-confirmed data is kept in memory. Old localStorage records can contain
// demo customers and failed writes, so they must never populate these tables.
export default function useAdminData(userId) {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState({ inventory: 'loading', orders: 'loading', members: 'loading' });
  const [errors, setErrors] = useState({});
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setStatus({ inventory: 'loading', orders: 'loading', members: 'loading' });
    setErrors({});
    await Promise.all([
      ['inventory', api.getAdminProducts, normalizeProduct, setInventory],
      ['orders', api.getAdminOrders, normalizeOrder, setOrders],
      ['members', api.getUsers, normalizeMember, setMembers]
    ].map(async ([key, fetchData, normalize, setData]) => {
      try {
        const result = await fetchData();
        if (!result?.success || !Array.isArray(result.data)) throw new Error('Invalid server response');
        if (current !== generation.current) return;
        setData(result.data.map(normalize));
        setStatus(previous => ({ ...previous, [key]: 'ready' }));
      } catch (error) {
        if (current !== generation.current) return;
        setData([]);
        setErrors(previous => ({ ...previous, [key]: error.message }));
        setStatus(previous => ({ ...previous, [key]: 'error' }));
      }
    }));
  }, []);
  useEffect(() => {
    setInventory([]); setOrders([]); setMembers([]);
    refresh();
    return () => { generation.current++; };
  }, [refresh, userId]);
  return { inventory, setInventory, orders, setOrders, members, setMembers, status, errors, refresh };
}
