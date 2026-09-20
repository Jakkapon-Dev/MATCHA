import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, ArrowRightLeft, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function OrderTrackingModal({ isOpen, onClose, order, onUpdateStatus, saveError }) {
  const { t } = useLanguage();
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'Processing');
  const [isApplying, setIsApplying] = useState(false);
  const { showToast } = useToast();

  // Escape closes this the way it closes the product modal.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Sync internal status with selected order when modal opens or order changes
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || 'Processing');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  /* The stages come from the order's own status, which is real. The dates are
     worked out from the order date, which makes them a projection, not a record
     — so they are labelled as one.

     They used to read as a courier's tracking history: exact times of day, named
     sorting facilities, a tracking number built by splicing digits onto the order
     id. None of that is recorded anywhere; an admin reading "Delivered, Sukhumvit
     Distribution Center, 2:30 PM" was reading something this component made up. */
  const getTimelineSteps = () => {
    const orderDate = order.date || null;
    const baseDate = orderDate ? new Date(orderDate) : null;

    const formatDate = (daysOffset) => {
      if (!baseDate || Number.isNaN(baseDate.getTime())) return null;
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
        location: 'With the customer',
        date: formatDate(4),
        isCompleted: effectiveIdx >= 3,
        isCurrent: order.status === 'Delivered'
      },
      {
        title: 'Out for delivery',
        location: 'With the courier',
        date: formatDate(3),
        isCompleted: effectiveIdx >= 2,
        isCurrent: order.status === 'Shipped'
      },
      {
        title: 'In transit',
        location: 'On its way from the workshop',
        date: formatDate(2),
        isCompleted: effectiveIdx >= 1,
        isCurrent: false
      },
      {
        title: 'Picked up',
        location: 'Packed and collected',
        date: formatDate(1),
        isCompleted: effectiveIdx >= 1,
        isCurrent: order.status === 'Processing'
      },
      {
        title: 'Order received',
        location: 'Paid for and queued',
        date: formatDate(0),
        isCompleted: true,
        isCurrent: order.status === 'Pending'
      }
    ];
  };

  const timelineSteps = getTimelineSteps();

  // No pretend delay. The 250ms timer here only made a fast save look slow.
  const handleApply = async () => {
    setIsApplying(true);
    try {
      if (await onUpdateStatus(order.id, currentStatus)) onClose();
    } finally { setIsApplying(false); }
  };

  /* No invented stand-ins. These read `order.phone || '+66 89 998-7122'` and
     `order.address || '306 North Plaza...'` — the phone and address of Sarah
     Jenkins, the first row of the seed data. Every real order arrived here
     without them mapped, so every real customer was shown her contact details
     as their own, with nothing to say they were not. An admin could have called
     the wrong person or shipped to the wrong address off this screen. */
  const customerPhone = order.phone || null;
  const deliveryAddress = order.address || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.id}`}
        className="relative bg-white border border-matcha-border rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden z-10"
      >
        
        {/* Modal Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-matcha-bg text-matcha-muted hover:text-matcha-text border border-matcha-border shadow-xs transition-colors cursor-pointer"
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
                    src={webpSrc('/images/brand/matcha-logo-primary.png')} data-original-src="/images/brand/matcha-logo-primary.png"
                    onError={handleImageError}
                    alt="MatchA"
                    className="h-8 sm:h-9 w-auto object-contain object-left"
                  />
                  <span className="text-[9px] font-mono tracking-[0.2em] text-matcha-muted uppercase mt-0.5">
                    Artisan Color Archive
                  </span>
                </div>
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-matcha-muted font-medium tracking-wide">
                  Customer Name
                </span>
                <p className="text-sm sm:text-base font-bold text-matcha-text tracking-tight">
                  {order.customer}
                </p>
              </div>

              {/* Customer Contact */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-matcha-muted font-medium tracking-wide">
                  Customer Contact
                </span>
                <p className={`text-xs sm:text-sm font-mono font-semibold ${customerPhone ? 'text-[#222222]' : 'text-[#888888]'}`}>
                  {customerPhone || 'Not on this order'}
                </p>
                {order.email && (
                  <p className="text-xs font-mono text-matcha-muted">
                    {order.email}
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-matcha-muted font-medium tracking-wide">
                  Delivery Address
                </span>
                <p className={`text-xs leading-relaxed font-sans ${deliveryAddress ? 'text-[#333333]' : 'text-[#888888]'}`}>
                  {deliveryAddress || 'Not on this order'}
                </p>
              </div>

              {/* Order Package & Amount Breakdown */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-matcha-muted">
                  <span>Items Ordered</span>
                  <span className="font-bold text-matcha-text">{order.items} {order.items > 1 ? 'items' : 'item'}</span>
                </div>
                <div className="flex items-center justify-between text-matcha-muted">
                  <span>Payment Status</span>
                  {/* An order with no payment status is unknown, not paid. Guessing
                      "Paid" from the order status put a green PAID badge on money
                      nobody had confirmed arriving. */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    !order.paymentStatus
                      ? 'bg-[#EEEEEE] text-matcha-muted'
                      : String(order.paymentStatus).toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.paymentStatus || 'Unknown'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between font-bold text-sm">
                  <span className="text-matcha-text">Total Amount:</span>
                  <span className="text-matcha-primary">${Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Seller Name & Support */}
              <div className="pt-2 space-y-3 border-t border-[#E5E5E5] text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase text-matcha-muted">Seller Name</span>
                  <p className="font-semibold text-matcha-text">MatchA Apparel Private Limited</p>
                </div>
                {/* The support number and mailbox that sat here were invented, and
                    "(See Number)" was styled as a link with nothing behind it.
                    There is no support desk to point at yet, so this says that. */}
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase text-matcha-muted">Seller Support</span>
                  <p className="font-mono text-[11px] text-[#888888]">No support contact configured</p>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: TRACKING NO, STATUS HEADER, TIMELINE                         */}
            {/* ========================================================================= */}
            <div className="md:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Tracking Number & Carrier Header */}
                {/* The tracking number was the order id with "ORD-" swapped for
                    "3419187", and the carrier badge named a courier that does not
                    exist. Nothing here is dispatched through a carrier yet, so the
                    order id — which is real and searchable — stands on its own. */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-matcha-muted tracking-wider block">
                      Order No.
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-matcha-text tracking-tight">
                      {order.id}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-matcha-bg border border-matcha-border text-matcha-muted font-mono text-[10px] tracking-wider uppercase">
                    No carrier assigned
                  </div>
                </div>

                {/* Big Order Status Announcement */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="text-xs text-matcha-muted font-medium font-sans">
                      your order is
                    </span>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight capitalize mt-0.5 ${
                      order.status === 'Delivered'
                        ? 'text-matcha-primary'
                        : order.status === 'Shipped'
                        ? 'text-blue-700'
                        : order.status === 'Processing'
                        ? 'text-matcha-accent'
                        : order.status === 'Cancelled'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}>
                      {order.status}
                    </h2>
                    <p className="text-xs text-matcha-muted font-sans mt-1">
                      as on {new Date(order.date || '2026-08-25').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
                    </p>

                  </div>

                  {/* Return / Exchange Quick Links */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => showToast('Returns are not connected yet', 'info')}
                      className="flex items-center gap-1.5 text-matcha-text hover:text-matcha-primary font-bold underline transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Return Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Exchanges are not connected yet', 'info')}
                      className="flex items-center gap-1.5 text-matcha-text hover:text-matcha-primary font-bold underline transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft size={13} />
                      <span>Exchange Item</span>
                    </button>
                    <div className="text-[10px] text-matcha-muted mt-1 sm:text-right">
                      For delivery queries, contact the customer directly.
                    </div>
                  </div>
                </div>

                {/* Tracking History Timeline */}
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-matcha-text">
                      Expected schedule
                    </h4>
                    <p className="text-[10px] text-[#888888] font-sans mt-0.5">
                      Stages follow the order's status. Dates are worked out from the
                      order date, not reported by a carrier.
                    </p>
                  </div>

                  <div className="space-y-6 pl-2 relative border-l-2 border-[#E5E5E5] ml-2.5">
                    {timelineSteps.map((step, idx) => {
                      const isActive = step.isCurrent || (step.isCompleted && idx === 0 && order.status === 'Delivered');
                      
                      return (
                        <div key={step.title} className="relative pl-6 group">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            step.isCompleted
                              ? 'bg-[#85E369] border-matcha-primary shadow-xs'
                              : 'bg-white border-[#BBBBBB]'
                          }`}>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-matcha-primary absolute inset-0 m-auto animate-ping" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div>
                              <p className={`text-xs font-bold font-sans ${
                                step.isCompleted ? 'text-matcha-text' : 'text-[#888888]'
                              }`}>
                                {step.title}
                              </p>
                              <p className="text-[11px] text-matcha-muted font-sans">
                                {step.location}
                              </p>
                            </div>
                            {step.date && (
                              <span className="text-[10px] font-mono text-[#888888] shrink-0">
                                est. {step.date}
                              </span>
                            )}
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
        <div className="p-4 sm:p-5 bg-matcha-bg border-t border-matcha-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          
          <div className="flex items-center gap-2 text-xs font-mono text-matcha-muted">
            <Clock size={14} className="text-matcha-primary" />
            <span>Order ID: <strong className="text-matcha-text">{order.id}</strong></span>
          </div>

          {saveError && <p role="alert" className="text-red-800">{t('errors.saveFailed')}: {saveError}</p>}
          {/* Bottom Right Fulfillment Status Selector & Apply Button */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-matcha-text shrink-0">
                Change Status:
              </span>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-matcha-border bg-white font-mono text-xs font-bold text-matcha-text outline-none cursor-pointer focus:border-matcha-primary shadow-2xs"
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
              className="px-5 py-2 rounded-xl bg-matcha-primary hover:bg-matcha-primary-dark text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
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
