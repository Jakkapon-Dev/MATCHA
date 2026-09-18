import React from 'react';
import { CheckCircle2, ArrowRight, Printer, Sparkles, Package, MapPin, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({
  isOpen,
  order,
  orderNumber = 'MTA-2026-8942',
  formData,
  totalAmount = 0,
  purchaseDateTime,
  onDone
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const currentDateTime = purchaseDateTime || (order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));

  const activeOrderId = order?.orderId || orderNumber;
  const status = order?.status || 'pending';
  const paymentMethod = order?.paymentMethod || 'visa';

  const handleFinish = () => {
    if (onDone) onDone();
    navigate('/catalog');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div 
        data-lenis-prevent="true"
        className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-6 relative animate-scale-up max-h-[90vh] overflow-y-auto"
      >
        {/* Certificate Header Banner */}
        <div className="relative pt-2">
          {/* Circular Seal / Stamp */}
          <div className="w-20 h-20 mx-auto rounded-full bg-[#E8EFE9] border-2 border-[#518F5C]/40 text-[#042509] flex items-center justify-center shadow-inner relative">
            <CheckCircle2 size={42} strokeWidth={1.8} className="text-[#042509]" />
            <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#042509] text-white text-[8px] font-mono uppercase font-bold tracking-widest">
              CERTIFIED
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#518F5C] font-semibold">
              MATCHA ATELIER • DISPATCH CERTIFICATE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#111111] font-serif tracking-tight mt-1">
              Order Confirmed
            </h2>
            <p className="text-xs font-mono text-[#666666] mt-1.5">
              Thank you, <strong>{formData?.firstName || 'Collector'} {formData?.lastName || ''}</strong>. Your garment curation is now registered in our atelier queue.
            </p>
          </div>
        </div>

        {/* Order Progress Timeline */}
        <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E2D9]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[#888888] mb-2">
            <span className="text-[#042509] font-black">1. Placed</span>
            <span className="text-[#042509] font-black">2. Atelier Prep</span>
            <span>3. Dispatched</span>
            <span>4. Handover</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#EAE7DC] overflow-hidden flex">
            <div className="w-1/2 h-full bg-[#042509] rounded-full" />
          </div>
        </div>

        {/* Official Atelier Receipt Box */}
        <div className="p-5 rounded-2xl bg-[#F7F6F2] border border-[#E5E2D9] text-left text-xs font-mono space-y-3 relative overflow-hidden">
          {/* Subtle Barcode Visual at Top */}
          <div className="pb-3 border-b border-[#E5E2D9] flex items-center justify-between">
            <div>
              <span className="text-[9px] text-[#888888] uppercase block tracking-wider">Atelier Tracking ID</span>
              <span className="font-bold text-sm text-[#042509]">#{activeOrderId}</span>
            </div>
            <div className="h-7 w-28 bg-[repeating-linear-gradient(90deg,#042509_0,#042509_2px,transparent_2px,transparent_4px)] opacity-60" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#888888] block text-[9px] uppercase">Destination</span>
              <span className="font-medium text-[#111111] truncate block">{formData?.address || '123 Sukhumvit Road'}</span>
              <span className="text-[#666666] text-[10px]">{formData?.city || 'Bangkok'} {formData?.zipCode || ''}</span>
            </div>
            <div className="text-right">
              <span className="text-[#888888] block text-[9px] uppercase">Payment Mode</span>
              <span className="font-bold text-[#111111] uppercase">{paymentMethod}</span>
              <span className="text-[10px] text-[#256029] font-bold block">Authorized</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E2D9] flex justify-between items-baseline">
            <span className="text-[#888888] uppercase text-[10px]">Total Transaction</span>
            <span className="font-black text-lg text-[#042509]">${totalAmount?.toFixed(2)}</span>
          </div>

          <div className="text-[9px] text-[#888888] pt-1">
            Registered: {currentDateTime}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#042509]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Return to Catalog Collection</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 text-xs font-mono font-semibold text-[#666666] hover:text-[#042509] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print Atelier Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
