import React, { useRef, useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { flyToCart } from '../../utils/flyToCart';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';
import { wash, inkOn, needsEdge } from '../../utils/dye';

/* One garment, standing on its own dye.

   The card chrome is gone — no radius, no border, no drop shadow — because in
   an archive organised by colour the dye is the container. Every product photo
   in this catalogue is shot on white, so the image is composited with
   `multiply`: white multiplied by the ground is the ground, and the studio
   background dissolves into the dye while the garment's own shading survives.

   The ground is a wash rather than the dye at full strength, since full
   strength behind a photograph fights it and would crush anything on Charcoal.
   The solid bar under the image carries the real colour, so nothing here
   misreports what you would receive. */

export default function DyeTile({ product, variant, onAddToCart, onQuickView }) {
  const tileRef = useRef(null);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart: contextAddToCart } = useCart();

  const active = variant || { color: product?.color, colorHex: product?.colorHex, image: product?.image };
  const hex = active?.colorHex || '#DCDCDC';

  // Zero or several sizes need an explicit choice, so those open quick view;
  // a single known size is safe to drop straight into the bag.
  const sizeList = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  const needsSizeChoice = sizeList.length !== 1;
  const inStock = product?.inStock !== false;

  const openQuickView = () =>
    onQuickView?.({ ...product, initialVariant: active, activeImage: active?.image });

  const handleAdd = (event) => {
    event.stopPropagation();
    if (!inStock) return;
    if (needsSizeChoice) return openQuickView();

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);

    const line = {
      ...product,
      image: active.image,
      color: active.color,
      colorHex: active.colorHex,
      size: sizeList[0],
      quantity: 1,
    };

    flyToCart(tileRef.current);
    if (onAddToCart) onAddToCart(line);
    else contextAddToCart?.(line);
  };

  return (
    <article
      ref={tileRef}
      onClick={openQuickView}
      className="group relative flex flex-col cursor-pointer select-none"
    >
      <div
        className="relative aspect-4/5 overflow-hidden"
        style={{ backgroundColor: wash(hex) }}
      >
        <img
          src={webpSrc(active?.image)}
          data-original-src={active?.image}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          alt={`${product?.name} in ${active?.color}`}
          className="absolute inset-0 w-full h-full object-contain object-center mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {!inStock && (
          <div className="absolute inset-0 bg-[#F1F1F1]/70 flex items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#0A0A0A]">
              Sold out
            </span>
          </div>
        )}

        {/* Actions answer the pointer instead of sitting on all 76 tiles at
            once. Keyboard users reach them through focus-within. */}
        {inStock && (
          <div className="absolute inset-x-0 bottom-0 flex opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2.5 bg-[#0A0A0A] text-[#F1F1F1] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#C91D1D] transition-colors"
            >
              {justAdded ? <Check size={13} /> : needsSizeChoice ? <Eye size={13} /> : <ShoppingBag size={13} />}
              <span>{justAdded ? 'Added' : needsSizeChoice ? 'Choose size' : 'Add to bag'}</span>
            </button>
          </div>
        )}
      </div>

      {/* The dye at full strength, named on itself. This is the one place the
          true colour is shown without a wash over it. */}
      <div
        className="flex items-center justify-between gap-2 px-2.5 py-1"
        style={{
          backgroundColor: hex,
          color: inkOn(hex),
          boxShadow: needsEdge(hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
        }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider truncate">
          {active?.color}
        </span>
        <span className="font-mono text-[10px] tabular-nums shrink-0">
          ${typeof product?.price === 'number' ? product.price.toFixed(2) : product?.price}
        </span>
      </div>

      <h3 className="mt-2 text-[13px] leading-snug text-[#0A0A0A] line-clamp-2 group-hover:underline underline-offset-4 decoration-[#C91D1D]">
        {product?.name}
      </h3>
    </article>
  );
}
