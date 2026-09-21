import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api';
import {
  getCurrentFirebaseUser,
  reloadFirebaseUser,
  sendVerificationEmail,
} from '../services/firebaseAuth';

const COOLDOWN_KEY = 'matcha_verify_cooldown_until';

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [firebaseUser, setFirebaseUser] = useState(() => getCurrentFirebaseUser());
  const email = params.get('email') || firebaseUser?.email || '';

  const [cooldown, setCooldown] = useState(() => {
    try {
      const savedUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
      const remaining = Math.ceil((savedUntil - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try { localStorage.removeItem(COOLDOWN_KEY); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const user = getCurrentFirebaseUser();
      await sendVerificationEmail(user);

      const cooldownSeconds = 60;
      setCooldown(cooldownSeconds);
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() + cooldownSeconds * 1000));
      } catch {}

      setSuccess(t('verifyEmail.resendSuccess', { email }));
      showToast(t('verifyEmail.resendSuccess', { email }), 'success');
    } catch (err) {
      if (err?.code === 'auth/too-many-requests') {
        setError(t('access.tooManyRequests'));
      } else {
        setError(t('verifyEmail.notice'));
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setError('');
    setSuccess('');
    setChecking(true);

    try {
      const updatedUser = await reloadFirebaseUser();
      setFirebaseUser(updatedUser);

      if (updatedUser?.emailVerified) {
        showToast(t('verifyEmail.verifiedSuccess'), 'success');

        // Exchange refreshed token with backend session
        try {
          const idToken = await updatedUser.getIdToken(true);
          const res = await api.firebaseLogin(idToken);
          const account = res.data || {};
          login(
            {
              id: account._id || account.id,
              name: account.name || updatedUser.displayName || email.split('@')[0],
              email: account.email || updatedUser.email,
              role: account.role || 'Member',
              tier: account.tier,
            },
            true,
            res.token,
          );
          navigate('/account');
        } catch {
          // If backend session exchange fails (e.g. backend offline or not configured yet),
          // redirect to login so they can sign in with verified credentials.
          navigate('/login');
        }
      } else {
        setError(t('verifyEmail.notVerified'));
      }
    } catch {
      setError(t('verifyEmail.notVerified'));
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="min-h-[75vh] bg-matcha-bg px-4 sm:px-6 py-14 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white border border-[#0A0A0A] p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
          <span className="text-[11px] font-mono uppercase tracking-widest text-matcha-muted">
            {t('verifyEmail.badge')}
          </span>
          <div className="w-8 h-8 rounded-full bg-matcha-bg flex items-center justify-center text-[#0A0A0A]">
            <Mail size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            {t('verifyEmail.title')}
          </h1>
          <p className="text-sm text-[#0A0A0A]/75 leading-relaxed">
            {t('verifyEmail.desc', { email: email || 'your email' })}
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs font-mono text-red-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="status" className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200 text-xs font-mono text-green-800">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3.5 bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-wait flex items-center justify-center gap-2 outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
          >
            {checking && <RefreshCw size={14} className="animate-spin" />}
            {checking ? t('verifyEmail.checking') : t('verifyEmail.checkStatus')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="w-full py-3 border border-matcha-border hover:border-[#0A0A0A] disabled:opacity-50 disabled:border-matcha-border text-xs font-mono font-bold uppercase tracking-wider text-[#0A0A0A] transition-colors cursor-pointer disabled:cursor-not-allowed outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
          >
            {resending
              ? t('access.working')
              : cooldown > 0
                ? t('verifyEmail.resendCooldown', { seconds: cooldown })
                : t('verifyEmail.resend')}
          </button>
        </div>

        <p className="text-[11px] font-mono text-matcha-muted leading-relaxed pt-2">
          {t('verifyEmail.notice')}
        </p>

        <div className="pt-4 border-t border-matcha-border flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#0A0A0A] hover:underline underline-offset-4 decoration-matcha-accent decoration-2"
          >
            <ArrowLeft size={13} />
            <span>{t('verifyEmail.backToSignIn')}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
