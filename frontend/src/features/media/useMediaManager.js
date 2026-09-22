import { useCallback, useEffect, useState } from 'react';
import { mediaRequest, uploadImage } from './mediaApi';
import { apiErrorText } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function useMediaManager() {
  const { t } = useLanguage();
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
    }).catch(e => { if (active) setError(apiErrorText(e, t)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, archived, search, productPage, reloadKey]);

  const run = async (operation, success) => {
    if (busy) return false;
    setBusy(true); setError(''); setNotice('');
    try { const result = await operation(); setNotice(success); reload(); return result || true; }
    catch (e) { setError(apiErrorText(e, t)); return false; }
    finally { setBusy(false); }
  };
  return { assets, looks, products, loading, busy, error, notice, page, setPage, archived,
    setArchived: value => { setPage(1); setArchived(value); }, total, search,
    setSearch: value => { setProductPage(1); setSearch(value); }, productPage, setProductPage, productTotal,
    reload, run, upload: (file, alt) => run(() => uploadImage(file, alt), t('admin.noticeUploaded')),
    importOriginals: () => run(() => mediaRequest('/admin/media/import-lookbook', { method: 'POST' }), t('admin.noticeImported')),
    updateAsset: (id, body) => run(() => mediaRequest(`/admin/media/${id}`, { method: 'PATCH', body }), t('admin.noticeAssetSaved')),
    saveGallery: (product, images) => run(() => mediaRequest(`/admin/media/products/${product._id}/gallery`, { method: 'PUT', body: { images, revision: product.mediaRevision || 0 } }), t('admin.noticeGallerySaved')),
    saveLook: look => run(() => mediaRequest(`/admin/lookbooks/${look.id}`, { method: 'PUT', body: { title: look.title, heroImage: look.heroImage, published: look.published, revision: look.revision || 0, items: look.items.map(({ productId, color, x, y }) => ({ productId, color, x, y })) } }), t('admin.noticeLookSaved'))
  };
}
