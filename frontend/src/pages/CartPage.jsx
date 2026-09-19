import React from 'react';
import useChangeMotion from '../hooks/useChangeMotion';
import { Trash2, Lock, RefreshCw, ShoppingBag } from 'lucide-react';
import { webpSrc } from '../utils/imageFallback';
import { wash, inkOn, needsEdge } from '../utils/dye';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '../config/shipping';
import { useLanguage } from '../context/LanguageContext.jsx';
/* These used to be declared again here, and the copy had drifted: it keyed on
   item.id alone, while the cart keys on item.id || item.productId. An item
   carrying only a productId got a key of "undefined-M-Red" from this page and
   a real one from the cart, so updateQty found nothing to change and the row's
   + and - did nothing at all, silently. One definition, imported. */
import { getCartKey, parsePrice } from '../context/CartContext.jsx';

export default function CartPage({ cartItems = [], onUpdateQty, onRemove, onBackToStore, onCheckout }) {
  const { t } = useLanguage();
  const cartMotionRef = useChangeMotion(
    cartItems.map(item => `${getCartKey(item)}:${item.quantity}`).join('|'),
    'outfit',
  );

  const subtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);

  const bundleItems = cartItems.filter(item => item.isBundleItem);
  const bundleSavings = bundleItems.length >= 2
    ? bundleItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1) * (item.bundleDiscountRate || 0.12), 0)
    : 0;
  const netSubtotal = Math.max(0, subtotal - bundleSavings);
  const shipping = cartItems.length === 0 ? 0 : shippingCostFor(netSubtotal);
  const total = netSubtotal + shipping;
  const awayFromFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - netSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((netSubtotal / FREE_SHIPPING_THRESHOLD) * 100));

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-[75vh] bg-matcha-bg flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full space-y-5">
          <ShoppingBag size={28} strokeWidth={1.5} className="text-[#0A0A0A]" aria-hidden="true" />
          <h1 className="text-3xl font-extrabold text-[#0A0A0A] tracking-tight uppercase">
            {t('cart.emptyTitle')}
          </h1>
          <p className="text-sm text-[#0A0A0A]/75 max-w-[46ch]">
            {t('cart.emptyBody')}
          </p>
          <button
            onClick={onBackToStore}
            className="inline-block px-6 py-3 bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
          >
            {t('cart.emptyAction')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-matcha-bg text-[#0A0A0A] min-h-screen">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-14">

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 mb-6 border-b border-[#0A0A0A]">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight uppercase">
              {t('cart.title')}
            </h1>
            <span className="text-sm font-mono text-matcha-muted tabular-nums">
              {t(cartItems.length === 1 ? 'cart.count' : 'cart.countPlural', { n: cartItems.length })}
            </span>
          </div>
          <button
            onClick={onBackToStore}
            className="text-xs font-mono text-[#0A0A0A] underline underline-offset-4 decoration-matcha-accent decoration-2 self-start sm:self-auto cursor-pointer"
          >
            {t('cart.continue')}
          </button>
        </div>

        {/* One meter, and it is the only thing on this page that moves. */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs font-mono mb-2">
            <span className="text-[#0A0A0A]">
              {awayFromFreeShipping <= 0
                ? t('cart.freeUnlocked')
                : t('cart.freeRemaining', { amount: awayFromFreeShipping.toFixed(2) })}
            </span>
            <span className="text-matcha-muted tabular-nums">
              {t('cart.progress', { percent: freeShippingProgress })}
            </span>
          </div>
          <div className="w-full h-1.5 bg-matcha-border overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out bg-[#0A0A0A]"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          <div ref={cartMotionRef} className="lg:col-span-7 border-t border-matcha-border -mx-3 sm:-mx-4">
            {cartItems.map((item) => {
              const key = getCartKey(item);
              const qty = item.quantity || 1;
              const unitPrice = parsePrice(item.price);
              const lineTotal = (unitPrice * qty).toFixed(2);
              const hex = item.colorHex || null;

              return (
                <div
                  key={key}
                  data-motion-slot={key}
                  data-motion-item={`${key}:${item.quantity}`}
                  className="flex gap-4 sm:gap-5 px-3 sm:px-4 py-5 border-b border-matcha-border"
                >
                  {/* The garment on its own dye, as everywhere else. */}
                  <div
                    className="w-24 sm:w-28 shrink-0 self-start"
                    style={{ backgroundColor: hex ? wash(hex) : '#E4E4E4' }}
                  >
                    {item.image ? (
                      <img
                        src={webpSrc(item.image)}
                        data-original-src={item.image}
                        loading="lazy"
                        decoding="async"
                        alt=""
                        className="w-full aspect-3/4 object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full aspect-3/4 flex items-center justify-center">
                        <span className="text-[9px] font-mono tracking-widest text-matcha-muted uppercase">
                          {item.id}
                        </span>
                      </div>
                    )}

                    {/* The dye named on itself. This used to be a dot painted
                        #042509 for every line, so a Peach scarf and a Charcoal
                        coat showed the same dark green. */}
                    {hex && (
                      <div
                        className="px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider truncate"
                        style={{
                          backgroundColor: hex,
                          color: inkOn(hex),
                          boxShadow: needsEdge(hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
                        }}
                      >
                        {item.color}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-extrabold text-base sm:text-lg text-[#0A0A0A] leading-snug uppercase tracking-tight">
                          {item.name}
                        </h2>

                        <button
                          onClick={() => onRemove(key)}
                          aria-label={t('cart.remove', { name: item.name })}
                          className="p-1.5 text-matcha-muted hover:text-matcha-accent transition-colors cursor-pointer shrink-0 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center gap-3 text-xs font-mono text-matcha-muted">
                        <span>{t('cart.size', { size: item.size || 'M' })}</span>
                        <span className="tabular-nums">${unitPrice.toFixed(2)}</span>
                        {item.isBundleItem && (
                          <span className="px-1.5 py-0.5 bg-[#0A0A0A] text-matcha-bg text-[9px] font-bold uppercase">
                            {t('cart.bundle')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="inline-flex items-center border border-matcha-border">
                        <button
                          onClick={() => onUpdateQty(key, -1)}
                          aria-label={t('cart.decrease')}
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#0A0A0A] hover:bg-matcha-border cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          −
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-[#0A0A0A] tabular-nums">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(key, 1)}
                          aria-label={t('cart.increase')}
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#0A0A0A] hover:bg-matcha-border cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-mono font-bold text-base text-[#0A0A0A] tabular-nums">
                        ${lineTotal}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 p-6 bg-matcha-bg border border-[#0A0A0A] space-y-5">
              <h2 className="text-lg font-extrabold text-[#0A0A0A] tracking-tight uppercase pb-3 border-b border-matcha-border">
                {t('cart.summary')}
              </h2>

              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between text-matcha-muted">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-bold text-[#0A0A0A] tabular-nums">${subtotal.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between text-matcha-accent font-bold">
                    <span>{t('cart.bundleSavings')}</span>
                    <span className="tabular-nums">−${bundleSavings.toFixed(2)}</span>
                  </div>
                )}

                {/* The bill used to carry a $12.00 express line that no control
                    on this page could select and that the total did not
                    include, so it read as a charge that had gone missing. The
                    choice lives at the next step, and now says so. */}
                <div className="flex justify-between text-matcha-muted">
                  <span>{t('cart.delivery')}</span>
                  <span className="font-bold text-[#0A0A0A] tabular-nums">
                    {shipping === 0 ? t('cart.deliveryFree') : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-[11px] text-matcha-muted leading-relaxed">
                  {t('cart.deliveryNote')}
                </p>
              </div>

              <div className="pt-4 border-t border-matcha-border flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-mono text-matcha-muted block">{t('cart.total')}</span>
                  <span className="text-[10px] font-mono text-matcha-muted">{t('cart.taxes')}</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#0A0A0A] tabular-nums">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3.5 px-6 bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
              >
                {t('cart.checkout')}
              </button>

              <div className="flex items-center gap-4 text-[11px] font-mono text-matcha-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={12} aria-hidden="true" />
                  <span>{t('cart.secure')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw size={12} aria-hidden="true" />
                  <span>{t('cart.returns')}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
