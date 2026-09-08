import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { handleImageError } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext';

export default function FavoritesTab({ favorites = [], onRemoveFavorite }) {
  const { addToCart } = useCart();

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
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-[#BC5A36] fill-[#BC5A36]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Saved Wishlist & Look Archive ({defaultFavorites.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {defaultFavorites.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl border border-[#D9D3C7] bg-[#FAF8F5]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-xl bg-white border border-[#D9D3C7] overflow-hidden shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#2D231E] font-mono truncate">{item.name}</h4>
                <div className="text-[11px] font-mono text-[#6B5E55] mt-0.5">${item.price} • {item.color}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => addToCart(item)}
                className="p-2.5 rounded-xl bg-[#2D5A27] hover:bg-[#23471E] text-white transition-colors cursor-pointer shadow-xs"
                title="Add to Cart"
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
