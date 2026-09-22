import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Shield, Lock, Loader2, X } from 'lucide-react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '13px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#000000',
      letterSpacing: '0.02em',
      '::placeholder': { color: '#9CA3AF' }
    },
    invalid: {
      color: '#C91D1D'
    }
  }
};

export default function PaymentMethodStep({
  paymentMethods,
  selectedPayment,
  onSelectPayment,
  cardData,
  onCardDataChange,
  onBack,
  onPlaceOrder,
  isProcessing,
  totalAmount,
  qrDisplay,
  onCancelQr,
  canRetryPayment,
  paymentDeadline,
  onAbandonOrder
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleCardHolderChange = (e) => {
    // Card fields are controlled by the checkout page so values survive step changes.
    onCardDataChange({ ...cardData, cardHolder: e.target.value });
  };

  const handleCardElementChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : '');
  };

  // Raw card details never reach this app's own state or server — Stripe Elements
  // tokenizes them directly, so validity here just checks the billing name and
  // whatever completeness Stripe's own CardElement reports.
  const isCardValid = selectedPayment !== 'visa' && selectedPayment !== 'mastercard'
    ? true
    : Boolean(cardData.cardHolder.trim()) && cardComplete;

  /* An attempt that ended without payment leaves the order alive and still
     holding its stock until this moment. The retry offer below is shown only
     while that is true, so the button never leads to a rejected payment. */
  const [windowOpen, setWindowOpen] = useState(true);
  useEffect(() => {
    if (!paymentDeadline) { setWindowOpen(true); return undefined; }
    const closesIn = new Date(paymentDeadline).getTime() - Date.now();
    if (closesIn <= 0) { setWindowOpen(false); return undefined; }
    setWindowOpen(true);
    const timer = setTimeout(() => setWindowOpen(false), closesIn);
    return () => clearTimeout(timer);
  }, [paymentDeadline]);

  const retryOffered = canRetryPayment && windowOpen && !qrDisplay;

  const handlePlaceOrderClick = () => {
    if (selectedPayment === 'visa' || selectedPayment === 'mastercard') {
      onPlaceOrder({ stripe, cardElement: elements?.getElement(CardElement) });
    } else if (selectedPayment === 'qr') {
      onPlaceOrder({ stripe });
    } else {
      onPlaceOrder({});
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Payment Method Selection */}
      <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DCDCDC]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#042509]" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#000000]">
              3. Payment Selection
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#042509]">
            <Lock size={12} />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Test Mode Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs font-mono text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
              Test Simulation Mode
            </span>
            <span>โหมดทดสอบ — ยังไม่มีการตัดเงินจริง</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            บัตร Visa/Mastercard และ PromptPay QR เชื่อมต่อกับ <strong>Stripe จริงในโหมดทดสอบ</strong> (ใช้เลขบัตร/QR ทดสอบเท่านั้น ไม่มีการตัดเงินจริง)
            ส่วนเก็บเงินปลายทางยังเป็นการจำลอง — ออเดอร์ใหม่จะถูกบันทึกเป็น <strong>"รับออเดอร์แล้ว (Pending)"</strong> และสถานะชำระเงินเป็น <strong>"รอชำระเงิน (Unpaid)"</strong> จนกว่าจะได้รับการยืนยัน
          </p>
        </div>

        {/* Method Radio Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => onSelectPayment(pm.id)}
              disabled={Boolean(qrDisplay)}
              className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedPayment === pm.id
                  ? 'border-[#042509] bg-[#518F5C]/40 text-[#000000] shadow-xs ring-1 ring-[#042509]'
                  : 'border-[#DCDCDC] text-[#666666] hover:border-[#042509]'
              }`}
            >
              <span className="text-xl">{pm.icon}</span>
              <span className="text-[11px]">{pm.name}</span>
            </button>
          ))}
        </div>

        {/* Card Input Form (For Visa / Mastercard) */}
        {/* Method-specific panels keep irrelevant fields out of the visible checkout. */}
        {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
          <div className="space-y-4 pt-4 border-t border-[#DCDCDC]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#635BFF]">
              <Shield size={12} />
              <span>Powered by Stripe · Test Mode</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardHolder"
                value={cardData.cardHolder}
                onChange={handleCardHolderChange}
                placeholder="ALEX COLLECTOR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 uppercase transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                Card Details
              </label>
              <div className="w-full px-3.5 py-3 rounded-xl border border-matcha-border focus-within:border-matcha-primary focus-within:ring-1 focus-within:ring-matcha-primary bg-matcha-bg/40 transition-colors">
                <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardElementChange} />
              </div>
              {cardError ? (
                <p className="mt-1.5 text-[11px] font-mono text-[#C91D1D]">{cardError}</p>
              ) : (
                <p className="mt-1.5 text-[11px] font-mono text-[#666666]">
                  บัตรทดสอบ: 4242 4242 4242 4242 · วันหมดอายุอนาคตใดก็ได้ · CVC/รหัสไปรษณีย์ใดก็ได้
                </p>
              )}
            </div>
          </div>
        )}

        {/* QR Code Thai PromptPay Display — Stripe PromptPay จริง (Test Mode) */}
        {selectedPayment === 'qr' && (
          <div className="text-center py-6 border-t border-[#DCDCDC] space-y-3">
            {qrDisplay ? (
              <>
                {qrDisplay.imageUrl ? (
                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border border-[#DCDCDC] shadow-sm flex items-center justify-center overflow-hidden">
                    <img src={qrDisplay.imageUrl} alt="Stripe PromptPay QR code" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  // Stripe บางครั้งไม่ส่ง image_url_png/svg มาให้ตรงๆ — ใช้หน้า QR ที่ Stripe
                  // โฮสต์ไว้เองแทน (รับประกันว่าใช้งานได้เสมอไม่ว่ารูปแบบ next_action จะเป็นอย่างไร)
                  <div className="max-w-xs mx-auto space-y-1.5">
                    <iframe
                      src={qrDisplay.hostedUrl}
                      title="Stripe PromptPay QR"
                      className="w-full h-72 rounded-2xl border border-[#DCDCDC] bg-white"
                    />
                    <a
                      href={qrDisplay.hostedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#042509] underline"
                    >
                      เปิดหน้า QR แบบเต็มจอ
                    </a>
                  </div>
                )}
                <p className="text-sm font-mono font-bold text-[#000000]">
                  สแกนจ่าย ฿{qrDisplay.amountThb.toFixed(2)} ด้วยแอปธนาคารของคุณ
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#666666]">
                  <Loader2 size={14} className="animate-spin text-[#042509]" />
                  <span>กำลังรอการยืนยันการชำระเงิน...</span>
                </div>
                <button
                  type="button"
                  onClick={onCancelQr}
                  className="text-[11px] font-mono font-bold text-[#666666] hover:text-[#C91D1D] underline cursor-pointer inline-flex items-center gap-1"
                >
                  <X size={11} />
                  <span>ปิด QR (กลับมาจ่ายใหม่ได้)</span>
                </button>
                <p className="text-[11px] font-mono text-amber-800 bg-amber-50 py-1 px-3 rounded-lg border border-amber-200/80 inline-block">
                  QR นี้เชื่อมต่อ Stripe PromptPay จริง (Test Mode) — ยอด ฿ แปลงจาก ${totalAmount.toFixed(2)} ด้วยอัตราคงที่สำหรับทดสอบเท่านั้น
                </p>
              </>
            ) : (
              <>
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border border-[#DCDCDC] shadow-sm flex items-center justify-center">
                  <QrCode size={110} className="text-[#000000]" />
                </div>
                <div className="flex items-center gap-1.5 justify-center text-[10px] font-mono font-bold text-[#635BFF]">
                  <Shield size={12} />
                  <span>Powered by Stripe · Test Mode</span>
                </div>
                <p className="text-xs font-mono text-[#666666]">
                  กด "Place Order" เพื่อสร้าง QR PromptPay จริงผ่าน Stripe แล้วสแกนจ่ายด้วยแอปธนาคาร
                </p>
              </>
            )}
          </div>
        )}

        {/* Cash on Delivery Note */}
        {selectedPayment === 'cod' && (
          <div className="p-4 rounded-2xl bg-[#518F5C]/30 border border-[#3E7047] text-xs font-mono text-[#000000] space-y-1 mt-4">
            <div className="font-bold flex items-center gap-1.5 text-[#042509]">
              <span>💵 Cash On Delivery (COD)</span>
              <span className="px-2 py-0.5 rounded bg-[#042509]/10 text-[#042509] text-[10px]">ชำระเงินปลายทาง</span>
            </div>
            <p className="text-[11px] text-[#666666]">
              กรุณาเตรียมเงินสดจำนวน <strong>${totalAmount.toFixed(2)}</strong> ให้พนักงานจัดส่ง (ออเดอร์จะบันทึกในสถานะรอชำระเงินจนกว่าจะส่งมอบสินค้า)
            </p>
          </div>
        )}
      </div>

      {/* An attempt that did not go through — a declined card, a QR the
          customer closed, a wait that ran out. The order is still theirs and
          still holding its stock until the window closes, so the offer is to
          try again rather than to start over. */}
      {retryOffered && (
        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 space-y-3" role="status">
          <p className="text-sm font-bold text-amber-900">ยังไม่ได้รับการชำระเงินสำหรับคำสั่งซื้อนี้</p>
          <p className="text-xs font-mono text-amber-900/80">
            สินค้าในคำสั่งซื้อยังถูกจองไว้ให้คุณ
            {paymentDeadline ? ` จนถึง ${new Date(paymentDeadline).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}` : ''}
            {' '}— ลองชำระเงินอีกครั้งได้เลย
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePlaceOrderClick}
              disabled={!isCardValid || isProcessing}
              className="px-5 py-2.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              ลองชำระเงินอีกครั้ง
            </button>
            <button
              type="button"
              onClick={onAbandonOrder}
              disabled={isProcessing}
              className="text-[11px] font-mono font-bold text-[#666666] hover:text-[#C91D1D] underline cursor-pointer disabled:opacity-40"
            >
              ยกเลิกคำสั่งซื้อและคืนสินค้าเข้าคลัง
            </button>
          </div>
        </div>
      )}

      {/* The window closed while the customer was still on the page: the
          stock has gone back and the order can no longer be paid. Saying so
          here is kinder than a 409 from the next attempt. */}
      {canRetryPayment && !windowOpen && (
        <div className="p-5 rounded-2xl border border-[#DCDCDC] bg-[#F1F1F1]" role="alert">
          <p className="text-sm font-bold text-[#C91D1D]">หมดเวลาชำระเงินสำหรับคำสั่งซื้อนี้แล้ว</p>
          <p className="text-xs font-mono text-[#666666] mt-1">
            สินค้าถูกคืนเข้าคลังเรียบร้อยแล้ว กรุณาสั่งซื้อใหม่อีกครั้ง
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono font-bold text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
        >
          ← Edit Shipping Address
        </button>
        {/* Block duplicate requests while processing and incomplete card submissions.
            Hidden while a PromptPay QR is up — the cancel link above is the only
            way out of that state; there's nothing to "place" again mid-scan. */}
        {!qrDisplay && !retryOffered && (
          <button
            type="button"
            onClick={handlePlaceOrderClick}
            disabled={!isCardValid || isProcessing}
            className="px-8 py-3.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <span>{selectedPayment === 'qr' ? 'Generating QR...' : 'Placing Order...'}</span>
            ) : (
              <>
                <Shield size={14} />
                <span>Place Order (${totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
