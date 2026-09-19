import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CreditCard, QrCode, Lock, ArrowLeft, CheckCircle2, Banknote, Sparkles, Smartphone } from 'lucide-react';

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
  const { t } = useLanguage();
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
      <div className="bg-white border border-[#DCDCDC] p-6 sm:p-7">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCDCDC] gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">
              {t('checkout.methodTitle')}
            </h2>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              {t('checkout.methodNote')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#042509] self-start sm:self-auto">
            <Lock size={13} />
            <span>{t('checkout.secure')}</span>
          </div>
        </div>

        {/* Payment Methods Selection Tabs */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Credit / Debit Card */}
            <div
              onClick={() => onSelectPayment('visa')}
              className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'visa' || selectedPayment === 'mastercard'
                  ? 'border-[#042509] bg-[#F1F1F1]'
                  : 'border-[#DCDCDC] bg-white hover:border-[#518F5C]/60 hover:bg-[#F1F1F1]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard size={18} className="text-[#042509]" />
                {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
                  <CheckCircle2 size={15} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-[#0A0A0A] block">{t('checkout.methodCard')}</span>
                <span className="text-[11px] font-mono text-[#666666] mt-0.5 block">{t('checkout.methodCardNote')}</span>
              </div>
            </div>

            {/* 2. PromptPay QR */}
            <div
              onClick={() => onSelectPayment('qr')}
              className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'qr'
                  ? 'border-[#042509] bg-[#F1F1F1]'
                  : 'border-[#DCDCDC] bg-white hover:border-[#518F5C]/60 hover:bg-[#F1F1F1]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <QrCode size={18} className="text-[#042509]" />
                {selectedPayment === 'qr' && (
                  <CheckCircle2 size={15} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-[#0A0A0A] block">{t('checkout.methodQr')}</span>
                <span className="text-[11px] font-mono text-[#666666] mt-0.5 block">{t('checkout.methodQrNote')}</span>
              </div>
            </div>

            {/* 3. Cash on Delivery (COD) */}
            <div
              onClick={() => onSelectPayment('cod')}
              className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPayment === 'cod'
                  ? 'border-[#042509] bg-[#F1F1F1]'
                  : 'border-[#DCDCDC] bg-white hover:border-[#518F5C]/60 hover:bg-[#F1F1F1]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Banknote size={18} className="text-[#042509]" />
                {selectedPayment === 'cod' && (
                  <CheckCircle2 size={15} className="text-[#042509]" />
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-[#0A0A0A] block">{t('checkout.methodCod')}</span>
                <span className="text-[11px] font-mono text-[#666666] mt-0.5 block">{t('checkout.methodCodNote')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Credit Card Interactive Visualizer */}
        {(selectedPayment === 'visa' || selectedPayment === 'mastercard') && (
          <div className="pt-2 space-y-6">
            {/* Live Card Visualizer */}
            <div className="w-full max-w-sm mx-auto aspect-[1.586/1] p-6 text-white bg-gradient-to-tr from-[#021505] via-[#042509] to-[#1E4524] relative overflow-hidden flex flex-col justify-between border border-[#518F5C]/40">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider text-xs uppercase text-[#F1F1F1]">MatchA Atelier</span>
                </div>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-white/10 uppercase">
                  Black Card
                </span>
              </div>

              {/* Realistic Chip */}
              <div className="flex items-center gap-3 relative z-10 my-1">
                <div className="w-8 h-6 rounded bg-gradient-to-br from-[#E2B961] to-[#BA903B] border border-[#FDE68A]/60 flex items-center justify-center">
                  <div className="w-6 h-4 border border-black/20" />
                </div>
                <Sparkles size={13} className="text-white/60" />
              </div>

              {/* Number display */}
              <div className="relative z-10 font-mono text-sm sm:text-base tracking-[0.2em] font-bold text-white">
                {formattedDisplayNumber()}
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex items-end justify-between relative z-10 text-[10px] font-mono uppercase tracking-wider text-white/80">
                <div>
                  <span className="text-[8px] text-white/50 block">{t('checkout.cardholder')}</span>
                  <span className="font-bold text-white tracking-wider truncate max-w-[170px] inline-block">
                    {cardData.cardHolder || 'ALEX COLLECTOR'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-white/50 block">{t('checkout.expires')}</span>
                  <span className="font-bold text-white tracking-wider">
                    {cardData.expiryDate || 'MM/YY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F1F1F1]">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#666666] mb-1">
                  {t('checkout.cardNumber')} <span className="text-[#C91D1D]">*</span>
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  maxLength={19}
                  value={cardData.cardNumber}
                  onChange={handleCardChange}
                  placeholder="4532 8821 0092 8899"
                  className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] tracking-wider transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#666666] mb-1">
                  {t('checkout.cardName')} <span className="text-[#C91D1D]">*</span>
                </label>
                <input
                  type="text"
                  name="cardHolder"
                  value={cardData.cardHolder}
                  onChange={handleCardChange}
                  placeholder="ALEX COLLECTOR"
                  className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] uppercase transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#666666] mb-1">
                    {t('checkout.expiry')} <span className="text-[#C91D1D]">*</span>
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    maxLength={5}
                    value={cardData.expiryDate}
                    onChange={handleCardChange}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] text-center transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#666666] mb-1">
                    {t('checkout.cvv')} <span className="text-[#C91D1D]">*</span>
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={handleCardChange}
                    placeholder="•••"
                    className="w-full px-3 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] text-center transition-colors"
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
            <div className="max-w-xs mx-auto p-5 bg-[#F1F1F1] border border-[#DCDCDC] space-y-3">
              <div className="bg-[#003B64] text-white py-1.5 px-3 flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider">PromptPay</span>
                <span className="text-[10px] font-mono">พร้อมเพย์</span>
              </div>

              <div className="w-40 h-40 mx-auto bg-white p-2.5 border border-[#DCDCDC] flex items-center justify-center">
                <QrCode size={135} strokeWidth={1.5} className="text-[#003B64]" />
              </div>

              <div className="text-xs font-mono font-bold text-[#0A0A0A]">
                MatchA Atelier Co., Ltd.
              </div>
              <div className="text-lg font-mono font-bold text-[#042509]">
                ${totalAmount.toFixed(2)}
              </div>
              <p className="text-[11px] font-mono text-[#666666]">
                Scan with any Thai mobile banking application
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F1F1] text-[#042509] text-xs font-mono">
              <Smartphone size={13} />
              <span>{t('checkout.testMode')}</span>
            </div>
          </div>
        )}

        {/* 3. Cash on Delivery */}
        {selectedPayment === 'cod' && (
          <div className="pt-2">
            <div className="p-5 bg-[#F1F1F1] border border-[#518F5C]/40 space-y-2">
              <div className="flex items-center gap-2 text-[#042509]">
                <Banknote size={18} />
                <h3 className="font-bold text-sm text-[#0A0A0A]">
                  Cash on delivery
                </h3>
              </div>
              <p className="text-xs font-mono text-[#666666] leading-relaxed">
                {t('checkout.codReady', { amount: totalAmount.toFixed(2) })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#666666] hover:text-[#042509] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('checkout.editAddress')}</span>
        </button>

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!isCardValid || isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-3.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('checkout.processing')}</span>
            </span>
          ) : (
            <span>{t('checkout.placeOrder', { amount: `$${totalAmount.toFixed(2)}` })}</span>
          )}
        </button>
      </div>
    </div>
  );
}
