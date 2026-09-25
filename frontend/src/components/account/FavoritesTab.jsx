import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Heart, ShoppingBag } from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../services/api';

/* What the heart in ProductModal writes: { id, name, price, image } and nothing
   else. That record is too thin to buy from — it carries no `sizes`, so the cart
   falls back to a guessed size and the order API looks for a stock bucket the
   garment never had. So the ids are kept and the garments themselves are read
   back from the catalogue, which is also what drops anything that has since left
   the archive. */
export const WISHLIST_STORAGE_KEY = 'matcha_wishlist';

export function readWishlistIds(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(WISHLIST_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.map((entry) => entry?.id).filter((id) => id !== undefined && id !== null);
  } catch {
    // Private mode, blocked storage, or a corrupted value: an empty archive is
    // the honest answer, not a crash.
    return [];
  }
}

/* Only garments the catalogue still returns. A saved id with no match is
   dropped rather than shown, because showing it would put something in the bag
   that the order API cannot accept. */
export function matchSavedProducts(ids, products) {
  const wanted = ids.map(String);
  const byId = new Map();
  (products || []).forEach((product) => {
    if (product?.id !== undefined && product?.id !== null) byId.set(String(product.id), product);
    if (product?._id) byId.set(String(product._id), product);
  });
  const seen = new Set();
  return wanted
    .map((id) => byId.get(id))
    .filter((product) => {
      if (!product) return false;
      const key = String(product._id || product.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/* The size is the shopper's to choose. Add to bag used to hand the garment over
   with no size, and the cart quietly took the first one listed (S). As in
   ProductModal, only a garment sold in a single size is preselected; otherwise
   the button asks for a size instead of guessing one. */
export function sizesFor(item) {
  const list = Array.isArray(item?.sizes) ? item.sizes.filter(Boolean) : [];
  if (!Array.isArray(item?.sizeStock) || item.sizeStock.length === 0) return list;
  const inStock = new Set(item.sizeStock.filter((b) => Number(b?.stock) > 0).map((b) => b.size));
  return list.filter((size) => inStock.has(size));
}

function SavedGarment({ item, addToCart, t }) {
  const sizes = sizesFor(item);
  // A garment that declares no sizes is sold as one piece; the order API files
  // it under its single bucket, so there is nothing to choose.
  const oneSize = !(Array.isArray(item?.sizes) && item.sizes.some(Boolean));
  const soldOut = oneSize ? item?.inStock === false : sizes.length === 0;
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [needsSize, setNeedsSize] = useState(false);

  const add = () => {
    if (soldOut) return;
    if (oneSize) {
      addToCart(item, 1);
      return;
    }
    if (!size || !sizes.includes(size)) {
      setNeedsSize(true);
      return;
    }
    setNeedsSize(false);
    // One per press: the catalogue record's `quantity` is its stock.
    addToCart({ ...item, size }, 1);
  };

  return (
    <div className="p-4 border border-matcha-border bg-matcha-bg/40 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-16 h-20 bg-white border border-matcha-border overflow-hidden shrink-0">
          <img
            src={webpSrc(item.image)} data-original-src={item.image}
            loading="lazy"
            decoding="async"
            alt={item.name}
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#0A0A0A] font-mono truncate">{item.name}</h4>
          <div className="text-[11px] font-mono text-matcha-muted mt-0.5">${item.price} • {item.color}</div>
          {!oneSize && <select
            aria-label={t('account.favoritesSizeLabel')}
            aria-invalid={needsSize || undefined}
            value={size}
            onChange={(e) => { setSize(e.target.value); setNeedsSize(false); }}
            disabled={soldOut}
            className={`mt-2 text-[11px] font-mono border bg-white px-2 py-1 ${needsSize ? 'border-red-500' : 'border-matcha-border'}`}
          >
            <option value="">{soldOut ? t('account.favoritesSoldOut') : t('account.favoritesSizeLabel')}</option>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>}
          {needsSize && (
            <p role="alert" className="text-[11px] font-mono text-red-600 mt-1">{t('account.favoritesChooseSize')}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        {/* CartContext owns cart persistence and duplicate-item behavior. */}
        <button
          onClick={add}
          disabled={soldOut}
          className="p-2.5 bg-matcha-primary hover:bg-matcha-primary-dark text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('account.addToCart')}
        >
          <ShoppingBag size={14} />
        </button>
      </div>
    </div>
  );
}

export default function FavoritesTab({ favorites = null }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  // `favorites` stays supported so a server-backed source can supply the list
  // later without touching this component.
  const [saved, setSaved] = useState(() => (Array.isArray(favorites) ? favorites : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Array.isArray(favorites)) {
      setSaved(favorites);
      return undefined;
    }

    const ids = readWishlistIds();
    if (!ids.length) {
      setSaved([]);
      return undefined;
    }

    let live = true;
    api.getProducts({ limit: 500 })
      .then((res) => {
        if (!live) return;
        setSaved(matchSavedProducts(ids, res?.data));
      })
      .catch(() => {
        // Without the catalogue there is no way to tell a saved garment from one
        // that has gone; say so rather than show a list nothing can be bought from.
        if (live) setFailed(true);
      });

    return () => { live = false; };
  }, [favorites]);

  const items = saved || [];
  const loading = saved === null && !failed;

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-matcha-accent fill-matcha-accent" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            {t('accountUi.favoritesTitle', { count: items.length })}
          </h2>
        </div>
      </div>

      {loading && (
        <p role="status" className="text-xs font-mono text-matcha-muted">
          {t('account.favoritesLoading')}
        </p>
      )}

      {failed && (
        <p role="status" className="text-xs font-mono text-matcha-muted">
          {t('account.favoritesUnavailable')}
        </p>
      )}

      {!loading && !failed && items.length === 0 && (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm font-bold text-[#0A0A0A]">{t('account.favoritesEmptyTitle')}</p>
          <p className="text-xs font-mono text-matcha-muted">{t('account.favoritesEmptyHint')}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <SavedGarment key={item._id || item.id} item={item} addToCart={addToCart} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
