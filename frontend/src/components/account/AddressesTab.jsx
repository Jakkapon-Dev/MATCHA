import React from 'react';
import { MapPin, Plus, Check } from 'lucide-react';

export default function AddressesTab({ addresses = [] }) {
  const defaultAddresses = addresses.length > 0 ? addresses : [
    {
      id: 'addr-1',
      title: 'Primary Residence (Bangkok)',
      name: 'Alex Collector',
      address: '123 Sukhumvit 55, Thong Lo, Apt 4B',
      city: 'Bangkok, 10110',
      phone: '081-999-8888',
      isDefault: true
    },
    {
      id: 'addr-2',
      title: 'Studio & Office',
      name: 'MatchA Studio Alex',
      address: '88 Charoenkrung Road, Bang Rak',
      city: 'Bangkok, 10500',
      phone: '082-111-2222',
      isDefault: false
    }
  ];

  return (
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Shipping Addresses ({defaultAddresses.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {defaultAddresses.map((addr) => (
          <div key={addr.id} className="p-5 rounded-2xl border border-[#D9D3C7] bg-[#FAF8F5]/40 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2D231E]">{addr.title}</span>
              {addr.isDefault && (
                <span className="px-2 py-0.5 rounded-md bg-[#D0DEC6] text-[#2D5A27] text-[10px] font-bold">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="text-[#6B5E55]">{addr.name}</div>
            <div className="text-[#2D231E] font-medium">{addr.address}</div>
            <div className="text-[#6B5E55]">{addr.city} • Tel: {addr.phone}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
