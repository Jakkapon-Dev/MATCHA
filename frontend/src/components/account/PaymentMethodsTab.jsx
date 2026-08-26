import React from 'react';
import { CreditCard, Plus, ShieldCheck } from 'lucide-react';

export default function PaymentMethodsTab() {
  const cards = [
    { id: 'c1', brand: 'Visa', last4: '8899', exp: '08/28', isDefault: true },
    { id: 'c2', brand: 'Mastercard', last4: '4412', exp: '11/27', isDefault: false }
  ];

  return (
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Saved Payment Cards
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.id} className="p-5 rounded-2xl border border-[#D9D3C7] bg-[#2D231E] text-white space-y-4 shadow-md font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#D0DEC6]">{c.brand}</span>
              {c.isDefault && (
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="text-base tracking-widest font-bold">
              •••• •••• •••• {c.last4}
            </div>
            <div className="flex justify-between text-[11px] text-[#D0DEC6]">
              <span>Cardholder: ALEX C.</span>
              <span>Exp: {c.exp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
