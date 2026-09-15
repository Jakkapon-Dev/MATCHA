import { useCallback, useEffect, useState } from 'react';
import { mediaRequest, uploadImage } from './mediaApi';

export default function useMediaManager() {
  const [assets, setAssets] = useState([]);
  const [looks, setLooks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([
      mediaRequest(`/admin/media?page=${page}&archived=${archived}`),
      mediaRequest('/admin/lookbooks'),
      mediaRequest(`/admin/media/products?search=${encodeURIComponent(search)}&page=${productPage}`)
    ]).then(([media, look, product]) => {
      if (!active) return;
      setAssets(media.data); setTotal(media.total); setLooks(look.data);
      setProducts(product.data); setProductTotal(product.total);
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, archived, search, productPage, reloadKey]);

  const run = async (operation, success) => {
    if (busy) return false;
    setBusy(true); setError(''); setNotice('');
    try { const result = await operation(); setNotice(success); reload(); return result || true; }
    catch (e) { setError(e.message); return false; }
    finally { setBusy(false); }
  };
  return { assets, looks, products, loading, busy, error, notice, page, setPage, archived,
    setArchived: value => { setPage(1); setArchived(value); }, total, search,
    setSearch: value => { setProductPage(1); setSearch(value); }, productPage, setProductPage, productTotal,
    reload, run, upload: (file, alt) => run(() => uploadImage(file, alt), 'อัปโหลดรูปแล้ว'),
    importOriginals: () => run(() => mediaRequest('/admin/media/import-lookbook', { method: 'POST' }), 'นำเข้าภาพเดิมครบแล้ว สินค้าใหม่มีสต็อก 0 และรอระบุไซซ์'),
    updateAsset: (id, body) => run(() => mediaRequest(`/admin/media/${id}`, { method: 'PATCH', body }), 'บันทึกรูปแล้ว'),
    saveGallery: (product, images) => run(() => mediaRequest(`/admin/media/products/${product._id}/gallery`, { method: 'PUT', body: { images, revision: product.mediaRevision || 0 } }), 'บันทึกรูปสินค้าแล้ว'),
    saveLook: look => run(() => mediaRequest(`/admin/lookbooks/${look.id}`, { method: 'PUT', body: { title: look.title, heroImage: look.heroImage, published: look.published, revision: look.revision || 0, items: look.items.map(({ productId, color, x, y }) => ({ productId, color, x, y })) } }), 'บันทึก Lookbook แล้ว')
  };
}
