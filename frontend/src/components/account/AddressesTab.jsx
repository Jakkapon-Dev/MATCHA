import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { readAddressBook } from '../../features/account/addressBook';

/* The account's delivery addresses.

   This tab used to invent two of them — Alex Collector at Thong Lo and a
   studio at Charoenkrung — whenever the real list was empty, "so the tab is
   still testable". The same pair was written out again in the checkout. An
   empty address book is an ordinary state and now reads as one. */

export default function AddressesTab({ addresses }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const saved = useMemo(
    () => (Array.isArray(addresses) && addresses.length ? addresses : readAddressBook(currentUser)),
    [addresses, currentUser],
  );

  return (
    <div className="bg-[#F1F1F1] border border-[#DCDCDC] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC]">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#0A0A0A]" aria-hidden="true" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            {t('account.addresses')} ({saved.length})
          </h2>
        </div>
      </div>

      {saved.length === 0 ? (
        <p className="max-w-[54ch] text-sm text-[#0A0A0A]/75 leading-relaxed">
          {t('account.noAddresses')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {saved.map((addr) => (
            <div key={addr.id} className="p-5 border border-[#DCDCDC] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0A0A0A]">
                  {addr.title || [addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                </span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-[#0A0A0A] text-[#F1F1F1] text-[10px] font-bold uppercase shrink-0">
                    {t('account.defaultAddress')}
                  </span>
                )}
              </div>
              <div className="text-[#0A0A0A] font-medium">{addr.address}</div>
              <div className="text-[#666666]">
                {[addr.city, addr.zipCode].filter(Boolean).join(' ')}
              </div>
              {addr.phone && (
                <div className="text-[#666666]">{t('checkout.tel')}: {addr.phone}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
