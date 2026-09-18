import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CreditCard } from 'lucide-react';

export default function PaymentMethodsTab() {
  const { t } = useLanguage();
  // These are masked display fixtures only; full card details must never be stored in
  // frontend state. A payment-provider integration can replace this summary list.
  const cards = [
    { id: 'c1', brand: 'Visa', last4: '8899', exp: '08/28', isDefault: true },
    { id: 'c2', brand: 'Mastercard', last4: '4412', exp: '11/27', isDefault: false }
  ];

  return (
    <div className="bg-white border border-[#DCDCDC] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC]">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-[#042509]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Saved Payment Cards
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.id} className="p-5 border border-[#DCDCDC] bg-[#0A0A0A] text-white space-y-4 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#518F5C]">{c.brand}</span>
              {c.isDefault && (
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="text-base tracking-widest font-bold">
              •••• •••• •••• {c.last4}
            </div>
            <div className="flex justify-between text-[11px] text-[#518F5C]">
              <span>{t('account.cardholder')}: ALEX C.</span>
              <span>Exp: {c.exp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
