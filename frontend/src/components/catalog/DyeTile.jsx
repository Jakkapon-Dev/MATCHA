import React, { useRef, useState } from 'react';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { flyToCart } from '../../utils/flyToCart';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';
import { wash, needsEdge } from '../../utils/dye';

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
  const [quantity, setQuantity] = useState(1);
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
    if (needsSizeChoice) return onQuickView?.({
      ...product,
      initialVariant: active,
      activeImage: active?.image,
      initialQuantity: quantity,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);

    const line = {
      ...product,
      image: active.image,
      color: active.color,
      colorHex: active.colorHex,
      size: sizeList[0],
      quantity,
    };

    flyToCart(tileRef.current);
    if (onAddToCart) onAddToCart(line);
    else contextAddToCart?.(line);
  };

  return (
    <article
      ref={tileRef}
      className="group relative flex h-full flex-col overflow-hidden bg-[#f8f7f2] select-none transition-transform duration-300 hover:-translate-y-1"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
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

        <button
          type="button"
          onClick={openQuickView}
          className="absolute inset-0 cursor-zoom-in outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A0A0A]"
          aria-label={`View ${product?.name}`}
        />

        {!inStock && (
          <div className="absolute inset-0 bg-matcha-bg/70 flex items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#0A0A0A]">
              Sold out
            </span>
          </div>
        )}

      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
      {/* The tile opens on click for a pointer, but a click handler on a
          container is not reachable by keyboard. The name carries the same
          action as a real button, which gives the tile a tab stop and, being
          inside the group, reveals the add control when it takes focus. */}
      <div className="flex items-start justify-between gap-4">
      <h3 className="min-w-0">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openQuickView();
          }}
          className="text-left text-lg font-bold leading-tight text-[#0A0A0A] line-clamp-2 cursor-pointer outline-hidden underline-offset-4 decoration-2 decoration-matcha-accent group-hover:underline focus-visible:underline"
        >
          {product?.name}
        </button>
      </h3>
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-[#0A0A0A]">
          ${typeof product?.price === 'number' ? product.price.toFixed(2) : product?.price}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-matcha-muted">
        <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-matcha-muted">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: hex,
              boxShadow: needsEdge(hex) ? 'inset 0 0 0 1px #A8A8A8' : undefined,
            }}
          />
          <span className="truncate">{active?.color}</span>
        </span>
        <span aria-hidden="true">/</span>
        <span>{[product?.tag, product?.season, product?.category].filter(Boolean).slice(0, 2).join(' · ')}</span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-[#555851]">
        {product?.descriptionEn || product?.description || `${product?.fit || 'Signature'} ${product?.category || 'piece'} selected for the ${product?.season || 'MatchA'} palette.`}
      </p>

      <div className="sr-only" aria-label="Product tags">
        {[product?.tag, product?.season, product?.category].filter(Boolean).slice(0, 3).map((tag) => (
          <span key={tag} className="border border-matcha-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-matcha-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-stretch gap-2 pt-5">
          <div className="flex shrink-0 items-center border border-[#0A0A0A] bg-transparent" aria-label="Quantity selector">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity === 1}
              className="p-2.5 text-[#0A0A0A] disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="min-w-7 text-center font-mono text-xs font-bold tabular-nums" aria-label={`Quantity ${quantity}`}>{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(10, value + 1))}
              disabled={quantity === 10}
              className="p-2.5 text-[#0A0A0A] disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 bg-matcha-accent px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#a81717] disabled:cursor-not-allowed disabled:bg-matcha-border disabled:text-matcha-muted"
        >
          {justAdded ? <Check size={13} /> : <ShoppingBag size={13} />}
          <span>{justAdded ? 'Added to cart' : inStock ? 'Add to cart' : 'Sold out'}</span>
        </button>
      </div>
      {needsSizeChoice && inStock && (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-matcha-muted">
          Size selected in quick view
        </p>
      )}
      </div>
    </article>
  );
}
