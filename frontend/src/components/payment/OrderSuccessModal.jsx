import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({
  isOpen,
  order,
  orderNumber = 'MTA-2026-8942',
  formData,
  totalAmount,
  purchaseDateTime,
  onDone
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const currentDateTime = purchaseDateTime || (order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }));

  const activeOrderId = order?.orderId || orderNumber;
  const status = order?.status || 'pending';
  const paymentStatus = order?.paymentStatus || 'unpaid';
  const paymentMethod = order?.paymentMethod || 'visa';

  const handleFinish = () => {
    if (onDone) onDone();
    navigate('/catalog');
  };

  const statusLabel = {
    pending: 'รอดำเนินการ (Pending)',
    processing: 'กำลังประมวลผล (Processing)',
    shipped: 'จัดส่งแล้ว (Shipped)',
    completed: 'จัดส่งสำเร็จ (Completed)',
    cancelled: 'ยกเลิก (Cancelled)'
  }[status.toLowerCase()] || status;

  const paymentStatusLabel = {
    unpaid: 'รอชำระเงิน (Unpaid)',
    paid: 'ชำระแล้ว (Paid)',
    refunded: 'คืนเงินแล้ว (Refunded)'
  }[paymentStatus.toLowerCase()] || paymentStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        data-lenis-prevent="true"
        className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 relative animate-scale-up"
      >
        
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#D0DEC6] text-[#2D5A27] flex items-center justify-center shadow-md animate-bounce">
          <CheckCircle2 size={40} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>Order Received • Drop 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-[#2D231E] tracking-tight mt-2">
            รับคำสั่งซื้อเรียบร้อยแล้ว
          </h2>
          <p className="text-xs font-mono text-[#6B5E55] mt-1.5 leading-relaxed">
            ขอบคุณคุณ <strong>{formData?.firstName || 'Collector'}</strong> บันทึกคำสั่งซื้อเข้าระบบเรียบร้อยแล้ว
          </p>
        </div>

        {/* Sandbox / Test Notice */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-left text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
            <ShieldAlert size={14} className="text-amber-700 shrink-0" />
            <span>โหมดทดสอบ (Test Mode — ยังไม่มี Gateway จริง)</span>
          </div>
          <p className="text-[10px] text-amber-800 leading-relaxed">
            {paymentMethod === 'cod'
              ? 'คำสั่งซื้อนี้เป็นการเก็บเงินปลายทาง (COD) — สถานะการชำระเงินเป็น "รอชำระเงิน" จนกว่าสินค้าจะจัดส่งถึงมือคุณ'
              : 'คำสั่งซื้อบันทึกสำเร็จโดยไม่มีการตัดเงินจริง สถานะการชำระเงินจึงถูกบันทึกเป็น "รอชำระเงิน (Unpaid)" อย่างถูกต้อง'}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] text-left text-xs font-mono space-y-2.5">
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Order Number:</span>
            <span className="font-bold text-[#2D231E]">#{activeOrderId}</span>
          </div>
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Order Status:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
              {statusLabel}
            </span>
          </div>
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Payment Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              paymentStatus.toLowerCase() === 'paid'
                ? 'bg-[#D0DEC6] text-[#2D5A27]'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {paymentStatusLabel}
            </span>
          </div>
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Payment Method:</span>
            <span className="font-bold text-[#2D231E] uppercase">{paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Order Total:</span>
            <span className="font-bold text-[#2D231E]">${totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[#6B5E55]">
            <span>Date/Time:</span>
            <span className="font-bold text-[#2D5A27]">{currentDateTime}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={14} />
        </button>

      </div>
    </div>
  );
}
