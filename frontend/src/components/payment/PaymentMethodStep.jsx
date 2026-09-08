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
    onCardDataChange({
      ...cardData,
      [e.target.name]: e.target.value
    });
  };

  const isCardValid = selectedPayment !== 'visa' && selectedPayment !== 'mastercard' 
    ? true 
    : (cardData.cardNumber.length >= 16 && cardData.cardHolder && cardData.expiryDate && cardData.cvv.length >= 3);

  return (
    <div className="space-y-8">
      {/* 1. Payment Method Selection */}
      <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D9D3C7]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#2D5A27]" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
              3. Payment Selection
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#2D5A27]">
            <Lock size={12} />
            <span>256-Bit SSL Encrypted</span>
          </div>
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
                  ? 'border-[#2D5A27] bg-[#D0DEC6]/40 text-[#2D231E] shadow-xs ring-1 ring-[#2D5A27]'
                  : 'border-[#D9D3C7] text-[#6B5E55] hover:border-[#2D5A27]'
              }`}
            >
              <span className="text-xl">{pm.icon}</span>
              <span className="text-[11px]">{pm.name}</span>
            </button>
          ))}
        </div>

        {/* Card Input Form (For Visa / Mastercard) */}
        {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
          <div className="space-y-4 pt-4 border-t border-[#D9D3C7]">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
              <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
                <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
                <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
          <div className="text-center py-6 border-t border-[#D9D3C7] space-y-3">
            <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border border-[#D9D3C7] shadow-sm flex items-center justify-center">
              <QrCode size={110} className="text-[#2D231E]" />
            </div>
            <p className="text-xs font-mono text-[#6B5E55]">
              Scan PromptPay QR code with any mobile banking app
            </p>
          </div>
        )}

        {/* Cash on Delivery Note */}
        {selectedPayment === 'cod' && (
          <div className="p-4 rounded-2xl bg-[#D0DEC6]/30 border border-[#B8CBAE] text-xs font-mono text-[#2D231E] space-y-1 mt-4">
            <div className="font-bold flex items-center gap-1.5 text-[#2D5A27]">
              <span>💵 Cash On Delivery Selected</span>
            </div>
            <p className="text-[11px] text-[#6B5E55]">
              Please prepare exact cash of <strong>${totalAmount.toFixed(2)}</strong> upon delivery.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono font-bold text-[#6B5E55] hover:text-[#2D231E] transition-colors cursor-pointer"
        >
          ← Edit Shipping Address
        </button>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!isCardValid || isProcessing}
          className="px-8 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
        >
          {isProcessing ? (
            <span>Processing Payment...</span>
          ) : (
            <>
              <Shield size={14} />
              <span>Complete Order (${totalAmount.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
