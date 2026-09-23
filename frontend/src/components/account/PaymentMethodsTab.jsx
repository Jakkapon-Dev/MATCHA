import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CreditCard } from 'lucide-react';
import PreviewBadge from '../ui/PreviewBadge';

export default function PaymentMethodsTab() {
  const { t } = useLanguage();
  /* Saving a card is not built yet — there is no provider customer or token
     behind this list. The two cards are a layout sample, and they used to be
     shown as if they were the shopper's own, each signed "ALEX C." whoever was
     logged in. The team's rule for mockups is to keep them and say so, so they
     stay, marked as samples, with no name on them. Full card details must never
     live in frontend state; a tokenised provider list can replace this one. */
  const cards = [
    { id: 'c1', brand: 'Visa', last4: '8899', exp: '08/28', isDefault: true },
    { id: 'c2', brand: 'Mastercard', last4: '4412', exp: '11/27', isDefault: false }
  ];

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-matcha-primary" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Saved Payment Cards
          </h2>
          <PreviewBadge label={t('account.paymentSampleBadge')} />
        </div>
      </div>

      <p role="note" className="text-xs font-mono text-matcha-muted leading-relaxed">
        {t('account.paymentSampleNote')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.id} aria-label={t('account.paymentSampleCard')} className="p-5 border border-matcha-border bg-[#0A0A0A] text-white space-y-4 font-mono opacity-70">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-matcha-secondary">{c.brand}</span>
              {c.isDefault && (
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="text-base tracking-widest font-bold">
              •••• •••• •••• {c.last4}
            </div>
            <div className="flex justify-between text-[11px] text-matcha-secondary">
              <span>{t('account.paymentSampleCard')}</span>
              <span>Exp: {c.exp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
