import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowRightLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function OrderTrackingModal({ isOpen, onClose, order, onUpdateStatus }) {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'Processing');
  const [isApplying, setIsApplying] = useState(false);

  // Sync internal status with selected order when modal opens or order changes
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || 'Processing');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Derive timeline status details based on current order status
  const getTimelineSteps = () => {
    const orderDate = order.date || '2026-08-25';
    const baseDate = new Date(orderDate);
    
    const formatDate = (daysOffset) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + daysOffset);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const statusHierarchy = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = statusHierarchy.indexOf(order.status);
    const effectiveIdx = currentIdx === -1 ? (order.status === 'Cancelled' ? -1 : 1) : currentIdx;

    return [
      {
        title: 'Delivered',
        location: 'Sukhumvit Distribution Center, Bangkok',
        date: `${formatDate(4)} at 2:30 PM`,
        stepIndex: 3,
        isCompleted: effectiveIdx >= 3,
        isCurrent: order.status === 'Delivered'
      },
      {
        title: 'Out For Delivery',
        location: 'Bangkok Central Hub (Courier in Transit)',
        date: `${formatDate(3)} at 11:30 AM`,
        stepIndex: 2,
        isCompleted: effectiveIdx >= 2,
        isCurrent: order.status === 'Shipped'
      },
      {
        title: 'In transit',
        location: 'From Chiang Mai Workshop to Bangkok Sorting Center',
        date: `${formatDate(2)} at 05:30 PM`,
        stepIndex: 1,
        isCompleted: effectiveIdx >= 1,
        isCurrent: false
      },
      {
        title: 'Order Picked up',
        location: 'MatchA Artisan Workshop, Chiang Mai',
        date: `${formatDate(1)} at 07:26 AM`,
        stepIndex: 1,
        isCompleted: effectiveIdx >= 1,
        isCurrent: order.status === 'Processing'
      },
      {
        title: 'Order Received',
        location: 'MatchA E-Commerce Digital Gateway',
        date: `${formatDate(0)} at 12:46 PM`,
        stepIndex: 0,
        isCompleted: true,
        isCurrent: order.status === 'Pending'
      }
    ];
  };

  const timelineSteps = getTimelineSteps();

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      if (onUpdateStatus) {
        onUpdateStatus(order.id, currentStatus);
      }
      setIsApplying(false);
      onClose();
    }, 250);
  };

  // Realistic mock or real address/phone
  const customerPhone = order.phone || '+66 89 998-7122';
  const deliveryAddress = order.address || '306 North Plaza, South Motera, Nr 4D Square Mall, Bangkok - 10110';
  const trackingNumber = `#${order.id.replace('ORD-', '3419187')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white border border-[#DCDCDC] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden z-10">
        
        {/* Modal Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-[#F1F1F1] text-[#666666] hover:text-[#000000] border border-[#DCDCDC] shadow-xs transition-colors cursor-pointer"
          title="Close Dialog"
        >
          <X size={18} />
        </button>

        {/* Scrollable Content Body (Split into 2 Columns like reference photo) */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-full">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: BRAND LOGO, CUSTOMER PROFILE, ORDER SUMMARY, SELLER INFO      */}
            {/* ========================================================================= */}
            <div className="md:col-span-5 p-6 sm:p-8 bg-[#FAFAFA] border-b md:border-b-0 md:border-r border-[#E5E5E5] space-y-6">
              
              {/* Brand Header Banner with MatchA Logo */}
              <div className="pb-4 border-b border-[#E5E5E5]">
                <div className="flex flex-col">
                  <img
                    src="/images/brand/matcha-logo-primary.png"
                    alt="MatchA"
                    className="h-8 sm:h-9 w-auto object-contain object-left"
                  />
                  <span className="text-[9px] font-mono tracking-[0.2em] text-[#666666] uppercase mt-0.5">
                    Artisan Color Archive
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mt-2 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[#042509]" />
                  <span>Verified Artisan Dispatch</span>
                </div>
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#666666] font-medium tracking-wide">
                  Customer Name
                </span>
                <p className="text-sm sm:text-base font-bold text-[#000000] tracking-tight">
                  {order.customer}
                </p>
              </div>

              {/* Customer Contact */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#666666] font-medium tracking-wide">
                  Customer Contact
                </span>
                <p className="text-xs sm:text-sm font-mono text-[#222222] font-semibold">
                  {customerPhone}
                </p>
                {order.email && (
                  <p className="text-xs font-mono text-[#666666]">
                    {order.email}
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#666666] font-medium tracking-wide">
                  Delivery Address
                </span>
                <p className="text-xs text-[#333333] leading-relaxed font-sans">
                  {deliveryAddress}
                </p>
              </div>

              {/* Order Package & Amount Breakdown */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[#666666]">
                  <span>Items Ordered</span>
                  <span className="font-bold text-[#000000]">{order.items} {order.items > 1 ? 'items' : 'item'}</span>
                </div>
                <div className="flex items-center justify-between text-[#666666]">
                  <span>Payment Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    String(order.paymentStatus || (order.status === 'Pending' ? 'Unpaid' : 'Paid')).toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.paymentStatus || (order.status === 'Pending' ? 'Unpaid' : 'Paid')}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between font-bold text-sm">
                  <span className="text-[#000000]">Total Amount:</span>
                  <span className="text-[#042509]">${Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Seller Name & Support */}
              <div className="pt-2 space-y-3 border-t border-[#E5E5E5] text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase text-[#666666]">Seller Name</span>
                  <p className="font-semibold text-[#000000]">MatchA Apparel Private Limited</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase text-[#666666]">Seller Support</span>
                  <p className="font-mono text-[#333333] font-medium">+66 2 899-8800 <span className="text-[10px] text-[#042509] cursor-pointer hover:underline">(See Number)</span></p>
                  <p className="font-mono text-[11px] text-[#666666]">support@matcha-apparel.com</p>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: TRACKING NO, STATUS HEADER, TIMELINE                         */}
            {/* ========================================================================= */}
            <div className="md:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Tracking Number & Carrier Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#666666] tracking-wider block">
                      Tracking No.
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-[#000000] tracking-tight">
                      {trackingNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#042509]/5 border border-[#042509]/20 text-[#042509] font-black font-mono text-xs tracking-wider">
                    <Truck size={14} />
                    <span>MATCHA EXPRESS</span>
                  </div>
                </div>

                {/* Big Order Status Announcement */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#666666] font-medium font-sans">
                      your order is
                    </span>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight capitalize mt-0.5 ${
                      order.status === 'Delivered'
                        ? 'text-[#042509]'
                        : order.status === 'Shipped'
                        ? 'text-blue-700'
                        : order.status === 'Processing'
                        ? 'text-[#C91D1D]'
                        : order.status === 'Cancelled'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}>
                      {order.status}
                    </h2>
                    <p className="text-xs text-[#666666] font-sans mt-1">
                      as on {new Date(order.date || '2026-08-25').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
                    </p>
                    <p className="text-[11px] text-[#888888] font-mono mt-0.5">
                      Last updated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
                    </p>
                  </div>

                  {/* Return / Exchange Quick Links */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => alert('Order return request process is active.')}
                      className="flex items-center gap-1.5 text-[#000000] hover:text-[#042509] font-bold underline transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Return Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Order item exchange process is active.')}
                      className="flex items-center gap-1.5 text-[#000000] hover:text-[#042509] font-bold underline transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft size={13} />
                      <span>Exchange Item</span>
                    </button>
                    <div className="text-[10px] text-[#666666] mt-1 sm:text-right">
                      For Delivery Queries: <span className="text-[#042509] font-bold underline cursor-pointer">Contact us</span>
                    </div>
                  </div>
                </div>

                {/* Tracking History Timeline */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000]">
                    Tracking History
                  </h4>

                  <div className="space-y-6 pl-2 relative border-l-2 border-[#E5E5E5] ml-2.5">
                    {timelineSteps.map((step, idx) => {
                      const isActive = step.isCurrent || (step.isCompleted && idx === 0 && order.status === 'Delivered');
                      
                      return (
                        <div key={step.title} className="relative pl-6 group">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            step.isCompleted
                              ? 'bg-[#85E369] border-[#042509] shadow-xs'
                              : 'bg-white border-[#BBBBBB]'
                          }`}>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#042509] absolute inset-0 m-auto animate-ping" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div>
                              <p className={`text-xs font-bold font-sans ${
                                step.isCompleted ? 'text-[#000000]' : 'text-[#888888]'
                              }`}>
                                {step.title}
                              </p>
                              <p className="text-[11px] text-[#666666] font-sans">
                                at location {step.location}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[#888888] shrink-0">
                              {step.date}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER: STATUS CHANGER & APPLY BUTTON (BOTTOM RIGHT)                */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-[#F1F1F1] border-t border-[#DCDCDC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          
          <div className="flex items-center gap-2 text-xs font-mono text-[#666666]">
            <Clock size={14} className="text-[#042509]" />
            <span>Order ID: <strong className="text-[#000000]">{order.id}</strong></span>
          </div>

          {/* Bottom Right Fulfillment Status Selector & Apply Button */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#000000] shrink-0">
                Change Status:
              </span>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#DCDCDC] bg-white font-mono text-xs font-bold text-[#000000] outline-none cursor-pointer focus:border-[#042509] shadow-2xs"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="px-5 py-2 rounded-xl bg-[#042509] hover:bg-[#021505] text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Check size={14} className={isApplying ? 'animate-spin' : ''} />
              <span>{isApplying ? 'Saving...' : 'Apply Status'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
