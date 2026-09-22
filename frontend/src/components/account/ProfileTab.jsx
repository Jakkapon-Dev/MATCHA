import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { User, CheckCircle2, Save, Camera, Trash2 } from 'lucide-react';
import { mediaSrc } from '../../services/apiConfig';

export default function ProfileTab({
  profile,
  onProfileChange,
  onSave,
  saveSuccess,
  onAvatarUpload,
  onAvatarDelete
}) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'M';

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setAvatarError('Choose a JPEG, PNG or WebP image up to 8 MB.');
      return;
    }
    setAvatarBusy(true);
    setAvatarError('');
    try {
      const saved = await onAvatarUpload(file);
      onProfileChange({ ...profile, avatarUrl: saved.avatarUrl || '' });
    } catch (error) {
      setAvatarError(error.message || 'Could not upload photo.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    setAvatarError('');
    try {
      await onAvatarDelete();
      onProfileChange({ ...profile, avatarUrl: '' });
    } catch (error) {
      setAvatarError(error.message || 'Could not remove photo.');
    } finally {
      setAvatarBusy(false);
    }
  };
  const handleChange = (e) => {
    // All fields share this controlled-input handler. The input's name selects the
    // profile property while the spread preserves values from the other fields.
    onProfileChange({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
        <div className="flex items-center gap-2">
          <User size={18} className="text-matcha-primary" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Personal Details & Membership
          </h2>
        </div>
        {saveSuccess && (
          <span className="text-xs font-mono text-matcha-primary font-bold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>{t('account.saved')}</span>
          </span>
        )}
      </div>

      {/* Submission stays in the parent, where account/auth state is available. */}
      <form onSubmit={onSave} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 border-b border-matcha-border">
          <div className="w-24 h-24 shrink-0 border border-matcha-border bg-matcha-bg overflow-hidden flex items-center justify-center" aria-label="Profile photo preview">
            {profile.avatarUrl ? (
              <img src={mediaSrc(profile.avatarUrl)} alt="Your profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-matcha-primary" aria-hidden="true">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono font-bold uppercase text-matcha-muted">Profile photo</p>
            <p className="mt-1 text-xs font-mono text-matcha-muted">JPEG, PNG or WebP · Maximum 8 MB</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleAvatar} disabled={avatarBusy} />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={avatarBusy} className="px-4 py-2.5 bg-[#0A0A0A] text-white text-[11px] font-bold font-mono uppercase inline-flex items-center gap-2 disabled:opacity-50">
                <Camera size={14} />{avatarBusy ? 'Uploading…' : profile.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {profile.avatarUrl && (
                <button type="button" onClick={removeAvatar} disabled={avatarBusy} className="px-4 py-2.5 border border-matcha-border text-[11px] font-bold font-mono uppercase inline-flex items-center gap-2 hover:border-matcha-accent hover:text-matcha-accent disabled:opacity-50">
                  <Trash2 size={14} />Remove
                </button>
              )}
            </div>
            {avatarError && <p role="alert" className="mt-2 text-xs font-mono text-matcha-accent">{avatarError}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-matcha-muted mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-matcha-muted mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-matcha-muted mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              readOnly
              aria-readonly="true"
              placeholder="alex@matcha.vip"
              className="w-full px-3.5 py-2.5 border border-matcha-border outline-none text-xs font-mono text-matcha-muted bg-matcha-bg/70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-matcha-muted mb-1">
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
            className="px-6 py-3 bg-matcha-primary hover:bg-matcha-primary-dark text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Save size={14} />
            <span>{t('account.saveProfile')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
