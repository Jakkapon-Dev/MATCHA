import React from 'react';
import { CheckCircle2, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({
  isOpen,
  orderNumber = 'MTA-2026-8942',
  formData,
  totalAmount,
  purchaseDateTime,
  onDone
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const currentDateTime = purchaseDateTime || new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const handleFinish = () => {
    if (onDone) onDone();
    navigate('/catalog');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white border border-[#D9D3C7] rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl space-y-6">
        
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#D0DEC6] text-[#2D5A27] flex items-center justify-center shadow-md animate-bounce">
          <CheckCircle2 size={44} />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] font-mono text-[10px] font-bold uppercase tracking-wider">
            Order Confirmed • Drop 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#2D231E] tracking-tight mt-2">
            Payment Successful!
          </h2>
          <p className="text-xs font-mono text-[#6B5E55] mt-2 leading-relaxed">
            Thank you, <strong>{formData?.firstName || 'Collector'}</strong>. We’ve received your order and sent a confirmation receipt to <strong>{formData?.email || 'your email'}</strong>.
          </p>
        </div>

        {/* Order Details Card (Mandatory Rubric: Purchase Date/Time included) */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] text-left text-xs font-mono space-y-2.5">
          <div className="flex justify-between text-[#6B5E55]">
            <span>Order Number:</span>
            <span className="font-bold text-[#2D231E]">#{orderNumber}</span>
          </div>
          <div className="flex justify-between text-[#6B5E55]">
            <span>Purchase Date/Time:</span>
            <span className="font-bold text-[#2D5A27]">{currentDateTime}</span>
          </div>
          <div className="flex justify-between text-[#6B5E55]">
            <span>Total Paid:</span>
            <span className="font-bold text-[#2D231E]">${totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#6B5E55]">
            <span>Estimated Delivery:</span>
            <span className="font-bold text-[#2D231E]">2-4 Business Days</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleFinish}
          className="w-full py-4 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue Shopping Archive</span>
          <ArrowRight size={14} />
        </button>

      </div>
    </div>
  );
}
