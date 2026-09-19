import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { User, CheckCircle2, Save } from 'lucide-react';

export default function ProfileTab({
  profile,
  onProfileChange,
  onSave,
  saveSuccess
}) {
  const { t } = useLanguage();
  const handleChange = (e) => {
    // All fields share this controlled-input handler. The input's name selects the
    // profile property while the spread preserves values from the other fields.
    onProfileChange({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white border border-[#DCDCDC] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC]">
        <div className="flex items-center gap-2">
          <User size={18} className="text-[#042509]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Personal Details & Membership
          </h2>
        </div>
        {saveSuccess && (
          <span className="text-xs font-mono text-[#042509] font-bold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>{t('account.saved')}</span>
          </span>
        )}
      </div>

      {/* Submission stays in the parent, where account/auth state is available. */}
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              placeholder="Alex"
              className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              placeholder="Collector"
              className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="alex@matcha.vip"
              className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              placeholder="081-999-8888"
              className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Save size={14} />
            <span>{t('account.saveProfile')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
