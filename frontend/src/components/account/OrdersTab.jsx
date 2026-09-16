import React from 'react';
import { Package, Clock, Truck, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleImageError, webpSrc } from '../../utils/imageFallback';

export default function OrdersTab({ orders = [], isLoaded = true }) {
  const navigate = useNavigate();

  // Convert backend fulfillment values into a complete badge class. Unknown or
  // missing values intentionally use the pending style as the safest fallback.
  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return 'bg-[#D0DEC6] text-[#2D5A27] border border-[#B8CBAE]';
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
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Order History ({orders.length})
          </h2>
        </div>
      </div>

      {/* Empty State: displayed when the parent has no orders to provide. */}
      {orders.length === 0 && (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[#D9D3C7] bg-[#FAF8F5]/60 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] flex items-center justify-center text-[#6B5E55]">
            <Package size={24} />
          </div>
          <div className="text-sm font-bold text-[#2D231E]">ยังไม่มีประวัติคำสั่งซื้อ</div>
          <p className="text-xs text-[#6B5E55] max-w-sm mx-auto font-mono">
            คำสั่งซื้อใหม่และสถานะการจัดส่งแบบเรียลไทม์จะปรากฏที่นี่หลังจากทำรายการ
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <ShoppingBag size={14} />
            <span>เลือกดูสินค้าใน Catalog</span>
          </button>
        </div>
      )}

      {/* Orders List: each order can contain multiple independently rendered items. */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 rounded-2xl border border-[#D9D3C7] bg-[#FAF8F5]/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D3C7]/60 text-xs font-mono">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-[#2D231E]">#{order.id}</span>
                  <span className="text-[#6B5E55]">• {order.date}</span>
                  {order.paymentMethod && (
                    <span className="text-[10px] text-[#6B5E55] bg-white px-2 py-0.5 rounded border border-[#D9D3C7] uppercase">
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
                  <span className="font-bold text-[#2D231E] ml-1">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono">
                    <div className="w-12 h-14 rounded-lg bg-white border border-[#D9D3C7] overflow-hidden shrink-0">
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
                      <div className="font-bold text-[#2D231E] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#6B5E55]">
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
