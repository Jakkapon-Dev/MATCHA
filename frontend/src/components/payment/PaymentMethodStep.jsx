import React from 'react';
import { CreditCard, QrCode, Shield, Lock, Check } from 'lucide-react';

export default function PaymentMethodStep({
  paymentMethods,
  selectedPayment,
  onSelectPayment,
  cardData,
  onCardDataChange,
  onBack,
  onPlaceOrder,
  isProcessing,
  totalAmount
}) {
  const handleCardChange = (e) => {
    // Card fields are controlled by the checkout page so values survive step changes.
    onCardDataChange({
      ...cardData,
      [e.target.name]: e.target.value
    });
  };

  // Only card methods require these fields. QR and COD are immediately eligible to
  // submit; card validation currently checks presence and minimum string lengths.
  const isCardValid = selectedPayment !== 'visa' && selectedPayment !== 'mastercard' 
    ? true 
    : (cardData.cardNumber.length >= 16 && cardData.cardHolder && cardData.expiryDate && cardData.cvv.length >= 3);

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
            ระบบยังไม่ได้เชื่อมต่อ Payment Gateway จริง ออเดอร์ใหม่จะถูกบันทึกเป็น <strong>“รับออเดอร์แล้ว (Pending)”</strong> และสถานะชำระเงินเป็น <strong>“รอชำระเงิน (Unpaid)”</strong>
          </p>
        </div>

        {/* Method Radio Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => onSelectPayment(pm.id)}
              className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
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
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                maxLength={19}
                value={cardData.cardNumber}
                onChange={handleCardChange}
                placeholder="4532 •••• •••• 8899"
                className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 tracking-wider transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardHolder"
                value={cardData.cardHolder}
                onChange={handleCardChange}
                placeholder="ALEX COLLECTOR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 uppercase transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  maxLength={5}
                  value={cardData.expiryDate}
                  onChange={handleCardChange}
                  placeholder="MM/YY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 text-center transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  name="cvv"
                  maxLength={4}
                  value={cardData.cvv}
                  onChange={handleCardChange}
                  placeholder="•••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 text-center transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* QR Code Thai PromptPay Display */}
        {selectedPayment === 'qr' && (
          <div className="text-center py-6 border-t border-[#DCDCDC] space-y-3">
            <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border border-[#DCDCDC] shadow-sm flex items-center justify-center">
              <QrCode size={110} className="text-[#000000]" />
            </div>
            <p className="text-xs font-mono text-[#666666]">
              Scan PromptPay QR code with any mobile banking app
            </p>
            <p className="text-[11px] font-mono text-amber-800 bg-amber-50 py-1 px-3 rounded-lg border border-amber-200/80 inline-block">
              ⚠️ โหมดทดสอบ: ยังไม่มีการยืนยันยอดเงินจากธนาคารจริง ออเดอร์จะบันทึกสถานะเป็นรอชำระเงิน
            </p>
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

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono font-bold text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
        >
          ← Edit Shipping Address
        </button>
        {/* Block duplicate requests while processing and incomplete card submissions. */}
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!isCardValid || isProcessing}
          className="px-8 py-3.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
        >
          {isProcessing ? (
            <span>Placing Order...</span>
          ) : (
            <>
              <Shield size={14} />
              <span>Place Order (${totalAmount.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
