import React from 'react';
import { CreditCard, QrCode, ShieldCheck, Lock, ArrowLeft, CheckCircle2, Banknote, Sparkles, Smartphone } from 'lucide-react';

export default function PaymentMethodStep({
  paymentMethods = [],
  selectedPayment = 'visa',
  onSelectPayment,
  cardData = { cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' },
  onCardDataChange,
  onBack,
  onPlaceOrder,
  isProcessing = false,
  totalAmount = 0
}) {
  const handleCardChange = (e) => {
    let { name, value } = e.target;
    
    // Auto format card number in groups of 4
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      value = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    // Auto format MM/YY
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      if (cleaned.length >= 3) {
        value = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      } else {
        value = cleaned;
      }
    }
    // Limit CVV
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    // Cardholder uppercase
    if (name === 'cardHolder') {
      value = value.toUpperCase();
    }

    onCardDataChange({
      ...cardData,
      [name]: value
    });
  };

  const rawCardNumber = (cardData.cardNumber || '').replace(/\s/g, '');
  const isCardValid = selectedPayment !== 'visa' && selectedPayment !== 'mastercard' 
    ? true 
    : (rawCardNumber.length === 16 && cardData.cardHolder?.trim().length > 2 && cardData.expiryDate?.length === 5 && cardData.cvv?.length >= 3);

  const formattedDisplayNumber = () => {
    if (!rawCardNumber) return '•••• •••• •••• ••••';
    const padded = rawCardNumber.padEnd(16, '•');
    return padded.match(/.{1,4}/g)?.join(' ') || '•••• •••• •••• ••••';
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E2D9] gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE9] text-[#042509] flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-[#111111] font-serif">
                Payment Method & Authorization
              </h2>
              <span className="text-[10px] font-mono text-[#666666] tracking-wider uppercase">
                Step 2 of 2 • お支払い方法
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#042509] bg-[#E8EFE9] px-3 py-1 rounded-full self-start sm:self-auto">
            <Lock size={12} className="text-[#042509]" />
            <span className="font-bold">256-Bit Encrypted Vault</span>
          </div>
        </div>

        {/* Payment Methods Selection Tabs */}
        <div className="mb-8">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#666666] mb-3">
            Select Payment Gateway
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Credit / Debit Card */}
            <div
              onClick={() => onSelectPayment('visa')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'visa' || selectedPayment === 'mastercard'
                  ? 'border-[#042509] bg-[#F7F9F7] shadow-xs ring-1 ring-[#042509]'
                  : 'border-[#E5E2D9] bg-white hover:border-[#518F5C]/60 hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <CreditCard size={20} className="text-[#042509]" />
                {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
                  <CheckCircle2 size={16} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-serif font-bold text-xs text-[#111111] block">Credit / Debit Card</span>
                <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">Visa, Mastercard, JCB</span>
              </div>
            </div>

            {/* 2. PromptPay QR */}
            <div
              onClick={() => onSelectPayment('qr')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'qr'
                  ? 'border-[#042509] bg-[#F7F9F7] shadow-xs ring-1 ring-[#042509]'
                  : 'border-[#E5E2D9] bg-white hover:border-[#518F5C]/60 hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <QrCode size={20} className="text-[#042509]" />
                {selectedPayment === 'qr' && (
                  <CheckCircle2 size={16} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-serif font-bold text-xs text-[#111111] block">PromptPay Thai QR</span>
                <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">Mobile Banking Scan</span>
              </div>
            </div>

            {/* 3. Cash on Delivery (COD) */}
            <div
              onClick={() => onSelectPayment('cod')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'cod'
                  ? 'border-[#042509] bg-[#F7F9F7] shadow-xs ring-1 ring-[#042509]'
                  : 'border-[#E5E2D9] bg-white hover:border-[#518F5C]/60 hover:bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Banknote size={20} className="text-[#042509]" />
                {selectedPayment === 'cod' && (
                  <CheckCircle2 size={16} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-serif font-bold text-xs text-[#111111] block">Cash on Delivery</span>
                <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">White-glove handover</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Credit Card Interactive Canvas */}
        {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
          <div className="pt-2 space-y-6">
            {/* Live Card Visualizer */}
            <div className="w-full max-w-sm mx-auto aspect-[1.586/1] rounded-3xl p-6 text-white bg-gradient-to-tr from-[#021505] via-[#042509] to-[#204E27] shadow-2xl relative overflow-hidden flex flex-col justify-between border border-[#518F5C]/40">
              {/* Subtle background texture */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#518F5C]/15 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍵</span>
                  <span className="font-serif font-bold tracking-widest text-xs uppercase text-[#E8EFE9]">MatchA Atelier</span>
                </div>
                <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-white/10 uppercase">
                  Black Vault
                </span>
              </div>

              {/* Realistic Chip & Contactless */}
              <div className="flex items-center gap-3 relative z-10 my-1">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-[#E2B961] to-[#BA903B] border border-[#FDE68A]/60 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-5 border border-black/20 rounded-xs" />
                </div>
                <div className="w-4 h-4 text-white/60">
                  <Sparkles size={14} />
                </div>
              </div>

              {/* Number display */}
              <div className="relative z-10">
                <div className="font-mono text-sm sm:text-base tracking-[0.25em] font-bold text-white drop-shadow-sm">
                  {formattedDisplayNumber()}
                </div>
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex items-end justify-between relative z-10 text-[10px] font-mono uppercase tracking-wider text-white/80">
                <div>
                  <span className="text-[8px] text-white/50 block">CARDHOLDER</span>
                  <span className="font-bold text-white tracking-widest truncate max-w-[170px] inline-block">
                    {cardData.cardHolder || 'ALEX COLLECTOR'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-white/50 block">EXPIRES</span>
                  <span className="font-bold text-white tracking-widest">
                    {cardData.expiryDate || 'MM/YY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F2F0EA]">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                  Card Number <span className="text-[#C91D1D]">*</span>
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  maxLength={19}
                  value={cardData.cardNumber}
                  onChange={handleCardChange}
                  placeholder="4532 8821 0092 8899"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] tracking-wider transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                  Cardholder Name <span className="text-[#C91D1D]">*</span>
                </label>
                <input
                  type="text"
                  name="cardHolder"
                  value={cardData.cardHolder}
                  onChange={handleCardChange}
                  placeholder="ALEX COLLECTOR"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] uppercase transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                    Expiry <span className="text-[#C91D1D]">*</span>
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    maxLength={5}
                    value={cardData.expiryDate}
                    onChange={handleCardChange}
                    placeholder="MM/YY"
                    className="w-full px-3 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] text-center transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                    CVV / CVC <span className="text-[#C91D1D]">*</span>
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={handleCardChange}
                    placeholder="•••"
                    className="w-full px-3 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] text-center transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PromptPay QR Code Canvas */}
        {selectedPayment === 'qr' && (
          <div className="pt-2 text-center space-y-4">
            <div className="max-w-xs mx-auto p-6 rounded-3xl bg-[#FAF9F6] border border-[#E5E2D9] shadow-inner space-y-3">
              {/* PromptPay Official Logo Header Bar */}
              <div className="bg-[#003B64] text-white py-2 px-4 rounded-xl flex items-center justify-between">
                <span className="font-bold text-xs tracking-wider">PromptPay</span>
                <span className="text-[10px] font-mono">พร้อมเพย์</span>
              </div>

              {/* QR Code Matrix */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border border-[#D5D2C9] shadow-sm flex items-center justify-center">
                <QrCode size={140} strokeWidth={1.5} className="text-[#003B64]" />
              </div>

              <div className="text-xs font-mono text-[#111111] font-bold">
                MatchA Atelier Co., Ltd.
              </div>
              <div className="text-xl font-mono font-black text-[#042509]">
                ${totalAmount.toFixed(2)}
              </div>
              <p className="text-[10px] font-mono text-[#666666]">
                Scan with SCB Easy, K PLUS, Krungthai NEXT or any Thai banking app
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8EFE9] text-[#042509] text-xs font-mono">
              <Smartphone size={14} />
              <span>Interactive Demo Simulator: Instant Authorization Ready</span>
            </div>
          </div>
        )}

        {/* 3. Cash on Delivery Atelier Concierge */}
        {selectedPayment === 'cod' && (
          <div className="pt-2">
            <div className="p-6 rounded-3xl bg-[#F7F9F7] border border-[#518F5C]/40 space-y-3">
              <div className="flex items-center gap-2 text-[#042509]">
                <Banknote size={20} />
                <h3 className="font-serif font-bold text-sm text-[#111111]">
                  Atelier White-Glove Cash Handover
                </h3>
              </div>
              <p className="text-xs font-mono text-[#555555] leading-relaxed">
                Our courier will deliver your garments in custom eco-protective botanical packaging. Please have the exact amount of <strong className="text-[#042509]">${totalAmount.toFixed(2)}</strong> prepared upon arrival.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#888888] flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#518F5C]" />
                <span>Contactless signature available upon request.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#666666] hover:text-[#042509] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Edit Shipping Address</span>
        </button>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!isCardValid || isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#042509]/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authorizing Order...</span>
            </span>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Complete Order (${totalAmount.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
