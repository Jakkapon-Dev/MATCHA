import React from 'react';
import { Sliders } from 'lucide-react';

export default function PreferencesTab({ preferences, onTogglePreference }) {
  // Keeping labels and descriptions in configuration makes every switch use the same
  // rendering and click path. The key links a row to its boolean in parent state.
  const prefItems = [
    { key: 'vipAlerts', title: 'VIP Early Drop Alerts', desc: 'Get notified 30 minutes before limited seasonal collections drop.' },
    { key: 'orderUpdates', title: 'Order & Shipping Notifications', desc: 'Receive real-time tracking updates via SMS & Email.' },
    { key: 'newsletter', title: 'MatchA Editorial Newsletter', desc: 'Weekly stories, streetwear lookbooks, and exclusive discounts.' },
    { key: 'smsAlerts', title: 'SMS Priority Access', desc: 'Direct text alerts for surprise restocks and warehouse drops.' }
  ];

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-matcha-primary" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Communication & Drop Preferences
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {prefItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 border border-matcha-border bg-matcha-bg/40">
            <div>
              <h4 className="text-xs font-bold text-[#0A0A0A] uppercase font-mono">{item.title}</h4>
              <p className="text-[11px] font-mono text-matcha-muted mt-0.5">{item.desc}</p>
            </div>
            {/* State is owned by the account page; this tab reports which key changed. */}
            <button
              type="button"
              onClick={() => onTogglePreference(item.key)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                preferences[item.key] ? 'bg-matcha-primary justify-end' : 'bg-matcha-border justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
