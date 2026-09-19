import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Heart, ShoppingBag } from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';

export default function FavoritesTab({ favorites = [], onRemoveFavorite }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  // Prefer favorites supplied by the account data source. Sample products keep the
  // archive populated for UI/QA testing when the parent passes no saved items.
  const defaultFavorites = favorites.length > 0 ? favorites : [
    {
      id: 101,
      name: 'MatchA Signature Heavyweight Boxy Tee',
      price: 48,
      color: 'Olive Green',
      colorHex: '#556B2F',
      size: 'L',
      image: '/images/products/standalone/mustard_sweater.jpg',
      inStock: true
    },
    {
      id: 102,
      name: 'MatchA Pleated Relaxed Trousers',
      price: 88,
      color: 'Charcoal Black',
      colorHex: '#2C3539',
      size: '32',
      image: '/images/products/standalone/matcha_green_crew.jpg',
      inStock: true
    }
  ];

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-matcha-accent fill-matcha-accent" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Saved Wishlist & Look Archive ({defaultFavorites.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {defaultFavorites.map((item) => (
          <div key={item.id} className="p-4 border border-matcha-border bg-matcha-bg/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {/* CartContext owns cart persistence and duplicate-item behavior. */}
              <button
                onClick={() => addToCart(item)}
                className="p-2.5 bg-matcha-primary hover:bg-matcha-primary-dark text-white transition-colors cursor-pointer"
                title={t('account.addToCart')}
              >
                <ShoppingBag size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
