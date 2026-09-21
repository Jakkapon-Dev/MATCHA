import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Lock, Globe, Loader2, KeyRound } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api';
import {
  getCurrentFirebaseUser,
  getConnectedProviders,
  linkGoogleProvider,
  linkPasswordProvider,
  unlinkFirebaseProvider,
} from '../../services/firebaseAuth';

export default function LinkedAccountsTab() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { currentUser, updateProfile } = useAuth();

  const [busyProvider, setBusyProvider] = useState('');
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Combine providers known from backend user document and live Firebase session
  const firebaseUser = getCurrentFirebaseUser();
  const connectedList = useMemo(() => {
    const fromFirebase = getConnectedProviders().map((p) => p.providerId);
    const fromUser = currentUser?.authProviders || [];
    const set = new Set([...fromFirebase, ...fromUser]);
    // Fallback: if user has passwordHash or no authProviders specified yet, assume password
    if (set.size === 0 && currentUser?.email) set.add('password');
    return Array.from(set);
  }, [currentUser, firebaseUser]);

  const hasGoogle = connectedList.includes('google') || connectedList.includes('google.com');
  const hasPassword = connectedList.includes('password');
  const totalConnected = (hasGoogle ? 1 : 0) + (hasPassword ? 1 : 0);

  const syncBackend = async () => {
    const user = getCurrentFirebaseUser();
    if (!user) return;
    try {
      const idToken = await user.getIdToken(true);
      const res = await api.syncProviders(idToken);
      if (res?.data) updateProfile(res.data);
    } catch {
      // Quiet sync error fallback
    }
  };

  const handleLinkGoogle = async () => {
    setError('');
    setBusyProvider('google');
    try {
      await linkGoogleProvider();
      await syncBackend();
      showToast(t('linkedAccounts.connectSuccess', { provider: 'Google' }), 'success');
    } catch (err) {
      if (err?.code === 'auth/credential-already-in-use') {
        setError(t('linkedAccounts.alreadyLinkedNotice'));
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || t('linkedAccounts.errorHeading'));
      }
    } finally {
      setBusyProvider('');
    }
  };

  const handleUnlinkGoogle = async () => {
    if (totalConnected <= 1) return;
    setError('');
    setBusyProvider('google');
    try {
      await unlinkFirebaseProvider('google.com');
      await syncBackend();
      showToast(t('linkedAccounts.disconnectSuccess', { provider: 'Google' }), 'info');
    } catch (err) {
      setError(err?.message || t('linkedAccounts.errorHeading'));
    } finally {
      setBusyProvider('');
    }
  };

  const handleLinkPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError(t('linkedAccounts.passwordPolicyHint'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('access.mismatch'));
      return;
    }

    setBusyProvider('password');
    try {
      await linkPasswordProvider(newPassword);
      await syncBackend();
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('linkedAccounts.connectSuccess', { provider: 'Password' }), 'success');
    } catch (err) {
      if (err?.code === 'auth/credential-already-in-use') {
        setError(t('linkedAccounts.alreadyLinkedNotice'));
      } else {
        setError(err?.message || t('linkedAccounts.errorHeading'));
      }
    } finally {
      setBusyProvider('');
    }
  };

  const handleUnlinkPassword = async () => {
    if (totalConnected <= 1) return;
    setError('');
    setBusyProvider('password');
    try {
      await unlinkFirebaseProvider('password');
      await syncBackend();
      showToast(t('linkedAccounts.disconnectSuccess', { provider: 'Password' }), 'info');
    } catch (err) {
      setError(err?.message || t('linkedAccounts.errorHeading'));
    } finally {
      setBusyProvider('');
    }
  };

  return (
    <div className="bg-white border border-matcha-border p-6 sm:p-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-matcha-border pb-6 space-y-2">
        <div className="flex items-center gap-2.5 text-[#0A0A0A]">
          <ShieldCheck size={20} className="text-matcha-accent" />
          <h2 className="text-xl font-extrabold uppercase tracking-tight">
            {t('linkedAccounts.title')}
          </h2>
        </div>
        <p className="text-xs font-mono text-matcha-muted leading-relaxed max-w-2xl">
          {t('linkedAccounts.lead')}
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs font-mono text-red-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {/* Google Provider Card */}
        <div className="border border-matcha-border p-5 bg-matcha-bg/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white border border-matcha-border flex items-center justify-center shrink-0 text-[#0A0A0A]">
              <Globe size={18} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#0A0A0A]">
                  {t('linkedAccounts.googleLabel')}
                </span>
                {hasGoogle ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-800 border border-green-200">
                    <CheckCircle2 size={10} /> {t('linkedAccounts.connected')}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                    {t('linkedAccounts.notConnected')}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-matcha-muted">
                {hasGoogle
                  ? (firebaseUser?.email || currentUser?.email)
                  : 'Fast one-click authentication with Google.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {hasGoogle ? (
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={totalConnected <= 1 || busyProvider === 'google'}
                className="px-4 py-2 border border-matcha-border hover:border-red-600 hover:text-red-600 disabled:opacity-40 disabled:hover:border-matcha-border disabled:hover:text-matcha-muted text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {busyProvider === 'google' && <Loader2 size={13} className="animate-spin" />}
                {t('linkedAccounts.disconnect')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={busyProvider === 'google'}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-matcha-accent text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-wait flex items-center gap-1.5"
              >
                {busyProvider === 'google' && <Loader2 size={13} className="animate-spin" />}
                {t('linkedAccounts.connectGoogle')}
              </button>
            )}
            {hasGoogle && totalConnected <= 1 && (
              <span className="text-[10px] font-mono text-matcha-muted text-right max-w-[220px]">
                {t('linkedAccounts.cannotDisconnectLast')}
              </span>
            )}
          </div>
        </div>

        {/* Email & Password Provider Card */}
        <div className="border border-matcha-border p-5 bg-matcha-bg/30 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white border border-matcha-border flex items-center justify-center shrink-0 text-[#0A0A0A]">
                <KeyRound size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0A0A0A]">
                    {t('linkedAccounts.passwordLabel')}
                  </span>
                  {hasPassword ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle2 size={10} /> {t('linkedAccounts.connected')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                      {t('linkedAccounts.notConnected')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-matcha-muted">
                  {currentUser?.email || firebaseUser?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {hasPassword ? (
                <button
                  type="button"
                  onClick={handleUnlinkPassword}
                  disabled={totalConnected <= 1 || busyProvider === 'password'}
                  className="px-4 py-2 border border-matcha-border hover:border-red-600 hover:text-red-600 disabled:opacity-40 disabled:hover:border-matcha-border disabled:hover:text-matcha-muted text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {busyProvider === 'password' && <Loader2 size={13} className="animate-spin" />}
                  {t('linkedAccounts.disconnect')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((v) => !v)}
                  disabled={busyProvider === 'password'}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-matcha-accent text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {t('linkedAccounts.connectPassword')}
                </button>
              )}
              {hasPassword && totalConnected <= 1 && (
                <span className="text-[10px] font-mono text-matcha-muted text-right max-w-[220px]">
                  {t('linkedAccounts.cannotDisconnectLast')}
                </span>
              )}
            </div>
          </div>

          {/* Form to set password if password not connected yet */}
          {!hasPassword && showPasswordForm && (
            <form onSubmit={handleLinkPassword} className="mt-4 pt-4 border-t border-matcha-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => { setError(''); setNewPassword(e.target.value); }}
                  placeholder={t('linkedAccounts.passwordPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-white border border-matcha-border text-xs font-mono text-[#0A0A0A] outline-hidden focus:border-[#0A0A0A]"
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setError(''); setConfirmPassword(e.target.value); }}
                  placeholder={t('linkedAccounts.passwordConfirmPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-white border border-matcha-border text-xs font-mono text-[#0A0A0A] outline-hidden focus:border-[#0A0A0A]"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-matcha-muted">
                  {t('linkedAccounts.passwordPolicyHint')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-3 py-1.5 border border-matcha-border text-xs font-mono uppercase text-matcha-muted hover:text-[#0A0A0A]"
                  >
                    {t('linkedAccounts.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={busyProvider === 'password'}
                    className="px-4 py-1.5 bg-[#0A0A0A] hover:bg-matcha-accent text-white text-xs font-mono font-bold uppercase"
                  >
                    {busyProvider === 'password' ? t('access.working') : t('linkedAccounts.savePassword')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
