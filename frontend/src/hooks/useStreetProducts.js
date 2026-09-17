import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { productsData } from '../data/productsData';

// The static list controls editorial order only. Prices and selections come from API.
const editorialOrder = productsData.map(p => p.id);
export default function useStreetProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    async function load() {
      const items = [];
      let page = 1, more = true;
      while (more) {
        const result = await api.getProducts({ page, limit: 100 }, { allowFallback: false });
        if (!active) return;
        items.push(...result.data);
        more = Boolean(result.pagination?.hasNextPage);
        page++;
      }
      // รายการคัดสรรมาก่อนตามลำดับที่ตั้งใจไว้ ส่วนสินค้าที่เพิ่มเข้าคลังทีหลัง
      // (ยังไม่มีในลิสต์คัดสรร) ต่อท้ายไป — เดิมกรองทิ้งทั้งหมด ทำให้หน้าแรกค้างอยู่ที่
      // จำนวนเดิมและขัดกับจำนวนที่หน้า catalog แสดง
      const byId = new Map(items.map(p => [p.id, p]));
      const curated = editorialOrder.map(id => byId.get(id)).filter(Boolean);
      const curatedIds = new Set(curated.map(p => p.id));
      setProducts([...curated, ...items.filter(p => !curatedIds.has(p.id))]);
    }
    load().catch(() => { if (active) setError('โหลดสินค้ายังไม่สำเร็จ กรุณาลองใหม่'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return { products, loading, error, retry: () => setAttempt(n => n + 1) };
}
