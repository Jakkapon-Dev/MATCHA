import React from 'react';
import { Package, Clock, Truck, CheckCircle2, ChevronRight } from 'lucide-react';
import { handleImageError } from '../../utils/imageFallback';

export default function OrdersTab({ orders = [] }) {
  const defaultOrders = orders.length > 0 ? orders : [
    {
      id: 'MTA-8921',
      date: '24 Aug 2026',
      status: 'Delivered',
      total: 136.00,
      items: [
        { name: 'MatchA Signature Heavyweight Boxy Tee', color: 'Olive Green', size: 'L', qty: 1, price: 48, image: '/images/products/standalone/mustard_sweater.jpg' },
        { name: 'MatchA Pleated Relaxed Trousers', color: 'Charcoal Black', size: '32', qty: 1, price: 88, image: '/images/products/standalone/matcha_green_crew.jpg' }
      ]
    },
    {
      id: 'MTA-8740',
      date: '12 Aug 2026',
      status: 'In Transit',
      total: 110.00,
      items: [
        { name: 'MatchA Loopback Mineral Fleece Hoodie', color: 'Burnt Orange', size: 'XL', qty: 1, price: 110, image: '/images/products/standalone/matcha_hoodie_terracotta.jpg' }
      ]
    }
  ];

  return (
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Order History & Archive Drops ({defaultOrders.length})
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {defaultOrders.map((order) => (
          <div key={order.id} className="p-5 rounded-2xl border border-[#D9D3C7] bg-[#FAF8F5]/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9D3C7]/60 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#2D231E]">#{order.id}</span>
                <span className="text-[#6B5E55]">• {order.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  order.status === 'Delivered' 
                    ? 'bg-[#D0DEC6] text-[#2D5A27]' 
                    : 'bg-[#BC5A36]/15 text-[#BC5A36]'
                }`}>
                  {order.status}
                </span>
                <span className="font-bold text-[#2D231E]">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-mono">
                  <div className="w-12 h-14 rounded-lg bg-white border border-[#D9D3C7] overflow-hidden shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={handleImageError}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2D231E] truncate">{item.name}</div>
                    <div className="text-[10px] text-[#6B5E55]">
                      {item.color} • {item.size} • Qty {item.qty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
