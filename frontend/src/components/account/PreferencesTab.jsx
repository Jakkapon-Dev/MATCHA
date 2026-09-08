import React from 'react';
import { Sliders, Bell } from 'lucide-react';

export default function PreferencesTab({ preferences, onTogglePreference }) {
  const prefItems = [
    { key: 'vipAlerts', title: 'VIP Early Drop Alerts', desc: 'Get notified 30 minutes before limited seasonal collections drop.' },
    { key: 'orderUpdates', title: 'Order & Shipping Notifications', desc: 'Receive real-time tracking updates via SMS & Email.' },
    { key: 'newsletter', title: 'MatchA Editorial Newsletter', desc: 'Weekly stories, streetwear lookbooks, and exclusive discounts.' },
    { key: 'smsAlerts', title: 'SMS Priority Access', desc: 'Direct text alerts for surprise restocks and warehouse drops.' }
  ];

  return (
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            Communication & Drop Preferences
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {prefItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 border border-[#D9D3C7] rounded-2xl bg-[#FAF8F5]/40">
            <div>
              <h4 className="text-xs font-bold text-[#2D231E] uppercase font-mono">{item.title}</h4>
              <p className="text-[11px] font-mono text-[#6B5E55] mt-0.5">{item.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => onTogglePreference(item.key)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                preferences[item.key] ? 'bg-[#2D5A27] justify-end' : 'bg-[#D9D3C7] justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
