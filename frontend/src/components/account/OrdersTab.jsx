import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Package, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleImageError, webpSrc } from '../../utils/imageFallback';

export default function OrdersTab({ orders = [], isLoaded = true }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Convert backend fulfillment values into a complete badge class. Unknown or
  // missing values intentionally use the pending style as the safest fallback.
  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return 'bg-[#518F5C] text-[#042509] border border-[#3E7047]';
    }
    if (s === 'shipped') {
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    }
    if (s === 'processing') {
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
    if (s === 'cancelled') {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    // pending
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  };

  const getPaymentStatusBadge = (paymentStatus = '') => {
    // Payment state is styled independently from fulfillment state because an order
    // can be shipped, cancelled, or refunded on a separate timeline.
    const ps = paymentStatus.toLowerCase();
    if (ps === 'paid') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    if (ps === 'refunded') {
      return 'bg-zinc-100 text-zinc-700 border border-zinc-300';
    }
    // unpaid
    return 'bg-amber-50 text-amber-800 border border-amber-300';
  };

  return (
    <div className="bg-white border border-[#DCDCDC] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC]">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[#042509]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Order History ({orders.length})
          </h2>
        </div>
      </div>

      {/* Empty State: displayed when the parent has no orders to provide. */}
      {orders.length === 0 && (
        <div className="py-12 px-4 text-center border border-dashed border-[#DCDCDC] bg-[#F1F1F1]/60 space-y-3">
          <div className="w-12 h-12 mx-auto bg-[#F1F1F1] border border-[#DCDCDC] flex items-center justify-center text-[#666666]">
            <Package size={24} />
          </div>
          <div className="text-sm font-bold text-[#0A0A0A]">{t('account.noOrders')}</div>
          <p className="text-xs text-[#666666] max-w-sm mx-auto font-mono">
            คำสั่งซื้อใหม่และสถานะการจัดส่งแบบเรียลไทม์จะปรากฏที่นี่หลังจากทำรายการ
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>{t('account.browseCatalog')}</span>
          </button>
        </div>
      )}

      {/* Orders List: each order can contain multiple independently rendered items. */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 border border-[#DCDCDC] bg-[#F1F1F1]/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCDCDC]/60 text-xs font-mono">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-[#0A0A0A]">#{order.id}</span>
                  <span className="text-[#666666]">• {order.date}</span>
                  {order.paymentMethod && (
                    <span className="text-[10px] text-[#666666] bg-white px-2 py-0.5 rounded border border-[#DCDCDC] uppercase">
                      {order.paymentMethod}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Fulfillment Status */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(order.status)}`}>
                    Order: {order.status}
                  </span>
                  {/* Payment Status */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPaymentStatusBadge(order.paymentStatus)}`}>
                    Payment: {order.paymentStatus || 'unpaid'}
                  </span>
                  <span className="font-bold text-[#0A0A0A] ml-1">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono">
                    <div className="w-12 h-14 bg-white border border-[#DCDCDC] overflow-hidden shrink-0">
                      <img 
                        src={webpSrc(item.image)} data-original-src={item.image} 
                        loading="lazy"
                        decoding="async"
                        alt={item.name} 
                        onError={handleImageError}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#0A0A0A] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#666666]">
                        {item.color} {item.size ? `• ${item.size}` : ''} • Qty {item.qty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
