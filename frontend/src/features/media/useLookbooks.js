import { useCallback, useEffect, useState } from 'react';
import { curatedEditorialSpreads } from '../../data/curatedEditorialSpreads';
import { mediaRequest } from './mediaApi';

// Keep the editorial available offline, but never infer sellable stock from a photo.
const preview = curatedEditorialSpreads.map(look => ({ ...look,
  hotspots: look.hotspots.map(i => ({ ...i, inStock: false, linked: false, sizes: [] })),
  shoppableItems: look.shoppableItems.map(i => ({ ...i, inStock: false, linked: false, sizes: [] }))
}));
export default function useLookbooks() {
  const [looks, setLooks] = useState(preview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    mediaRequest('/lookbooks')
      .then(result => {
        if (!active) return;
        if (Array.isArray(result?.data) && result.data.length > 0) {
          setLooks(result.data);
        } else {
          setLooks(preview);
          setError('ไม่พบคอลเลกชัน Lookbook บนระบบ ขณะนี้แสดงภาพลุคเดิมและพักการสั่งซื้อไว้');
        }
      })
      .catch(() => {
        if (active) {
          setLooks(preview);
          setError('โหลดข้อมูลสินค้ายังไม่สำเร็จ ขณะนี้แสดงภาพลุคเดิมและพักการสั่งซื้อไว้');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [attempt]);
  return { looks, loading, error, retry };
}
