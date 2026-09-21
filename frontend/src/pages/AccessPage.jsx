import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EASE } from '../components/motion';
import AtelierPanel from '../components/auth/AtelierPanel';
import { api, apiErrorText, isNetworkErrorKey } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { passwordStrength } from '../features/auth/passwordStrength';
import { signInWithGoogle, signUpWithEmail } from '../services/firebaseAuth';

/* Signing in and signing up, on one page.

   They were two pages carrying the same panel, the same pledge and the same
   three perks, written out twice. They are also the same act — a person
   arriving at the door — and which side of it they are on is something the
   form can ask in one line rather than something they must decide before
   they are allowed to type.

   So this is one form that grows, not two forms behind a switch: an email
   and a password either way, and three more fields when the account does not
   exist yet. Whatever has been typed stays typed.

   /login and /signup both render this and both still work, because they are
   in the navbar, in the hash router, and in whatever links people already
   have. They differ only in which mode opens. */

/* Errors from services/api.js now name themselves, so the usual case is a
   key comparison. The text hints stay for failures raised outside that module
   — fetch rejecting before any status exists, most of all — where there is
   nothing but a message to go on. */
const NETWORK_HINTS = [
  'Failed to communicate',
  'Failed to fetch',
  'NetworkError',
];

const isNetworkError = (err) =>
  isNetworkErrorKey(err) || NETWORK_HINTS.some((hint) => String(err?.message || '').includes(hint));

const STRENGTH_WIDTH = { tooShort: '10%', weak: '33%', fair: '66%', strong: '100%' };
const STRENGTH_COLOUR = { tooShort: '#DCDCDC', weak: '#C91D1D', fair: '#D4A338', strong: '#042509' };

const validatePasswordPolicy = (password) => {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

export default function AccessPage({ mode: initialMode = 'signin', onLoginSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();

  const [mode, setMode] = useState(initialMode);
  const registering = mode === 'register';

  // The route decides the opening mode, and going from /login to /signup in
  // the navbar has to move the form even though the component never unmounts.
  useEffect(() => { setMode(initialMode); }, [initialMode]);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', confirm: '',
  });
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSentEmail, setVerificationSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const firstExtraRef = useRef(null);

  /* Ask for a reset link.

     The address comes from the field the visitor is already looking at, so
     nothing has to be typed twice. The message afterwards is the same whether
     or not that address has an account: the server answers that way on purpose
     so this endpoint cannot be used to find out who shops here, and showing a
     different message for a failure would give away exactly what the server
     was careful not to. */
  const requestReset = async () => {
    const address = form.email.trim();
    if (!address) {
      setError(t('access.forgotNeedsEmail'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.forgotPassword(address, lang);
    } catch (err) {
      console.warn('Reset request failed:', err?.message);
    } finally {
      setBusy(false);
      showToast(t('access.forgotSent'), 'info');
    }
  };


  const set = (name) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const strength = passwordStrength(form.password);

  /* Switching mode deliberately does not navigate. App remounts the page on
     every path change — its error boundary is keyed by pathname — so routing
     from /login to /signup would throw away whatever had been typed, which is
     the one thing this form promises not to do. The title is set directly
     instead, so the tab still says what the visitor is doing. */
  const toggleMode = () => {
    setError('');
    setVerificationSentEmail('');
    const next = registering ? 'signin' : 'register';
    if (next === 'register') askedToRegister.current = true;
    setMode(next);
    document.title = t(next === 'register' ? 'titles.signup' : 'titles.login');
  };

  /* Focus follows the disclosure, but only when the visitor asked for it —
     not when the route opened in register mode, where stealing focus would
     scroll a phone past the heading before it had been read. A frame callback
     fired before the new fields had mounted, so this waits for the render
     that actually put them on the page. */
  const askedToRegister = useRef(false);
  useEffect(() => {
    if (!registering || !askedToRegister.current) return;
    askedToRegister.current = false;
    firstExtraRef.current?.focus();
  }, [registering]);

  const finish = (user, token) => {
    login(user, remember, token);
    if (onLoginSuccess) onLoginSuccess(user);
    navigate(user.role === 'Admin' ? '/admin' : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError(t('access.needBoth'));
      return;
    }

    if (registering) {
      if (!validatePasswordPolicy(form.password)) {
        setError(t('access.passwordPolicy'));
        return;
      }
      if (form.password !== form.confirm) {
        setError(t('access.mismatch'));
        return;
      }
      if (!agreed) {
        setError(t('access.termsRequired'));
        return;
      }
    }

    setBusy(true);
    try {
      if (registering) {
        const name = `${form.firstName} ${form.lastName}`.trim() || form.email.split('@')[0];
        await signUpWithEmail(form.email.trim(), form.password, name);
        setVerificationSentEmail(form.email.trim());
        showToast(t('access.verificationSentTitle'), 'success');
      } else {
        const res = await api.login(form.email.trim(), form.password);
        const account = res.data || {};
        finish({
          id: account._id,
          name: account.name || form.email.split('@')[0],
          email: account.email,
          role: account.role || 'Member',
          tier: account.tier,
        }, res.token);
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError(t('access.emailInUse'));
      } else if (code === 'auth/invalid-email') {
        setError(t('access.invalidEmail'));
      } else if (code === 'auth/weak-password') {
        setError(t('access.weakPassword'));
      } else if (code === 'auth/too-many-requests') {
        setError(t('access.tooManyRequests'));
      } else if (isNetworkError(err)) {
        setError(t('common.offline'));
      } else {
        setError(apiErrorText(err, t) || t('auth.invalidCredentials'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      const idToken = await signInWithGoogle();
      const res = await api.firebaseLogin(idToken);
      const account = res.data || {};
      finish({
        id: account._id || account.id,
        name: account.name || account.email?.split('@')[0],
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role || 'Member',
        tier: account.tier,
        avatarUrl: account.avatarUrl,
      }, res.token);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') setError(t('access.googleFailed'));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full px-3.5 py-2.5 bg-matcha-bg border border-matcha-border text-sm text-[#0A0A0A] outline-hidden focus:border-[#0A0A0A] transition-colors';
  const label = 'block text-xs font-mono text-matcha-muted mb-1.5';

  /* The three extra fields arrive one after another rather than together: at
     40ms apart it reads as the form making room, not as the page replacing
     itself. Under reduced motion they are simply there. */
  const stagger = (index) => (reduced
    ? false
    : { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, delay: index * 0.04, ease: EASE } });

  return (
    <div className="w-full bg-matcha-bg min-h-[80vh] px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 border border-[#0A0A0A]">

        {/* The form comes first in the source, so a phone opens on the thing
            it came to do. On a wide screen the panel takes the left column
            again through order. */}
        <div className="lg:col-span-7 lg:order-2 bg-matcha-bg p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            {registering ? t('access.registerTitle') : t('access.signInTitle')}
          </h1>
          <p className="mt-2 mb-7 text-sm text-[#0A0A0A]/75 max-w-[46ch]">
            {registering ? t('access.registerLead') : t('access.signInLead')}
          </p>

          {verificationSentEmail ? (
            <div className="py-6 border-t border-b border-matcha-border my-4">
              <div className="flex items-center gap-3 text-matcha-accent mb-3">
                <CheckCircle2 size={24} className="shrink-0" />
                <h2 className="text-lg font-bold uppercase tracking-tight text-[#0A0A0A]">
                  {t('access.verificationSentTitle')}
                </h2>
              </div>
              <p className="text-sm text-[#0A0A0A]/80 leading-relaxed mb-6">
                {t('access.verificationSentBody', { email: verificationSentEmail })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVerificationSentEmail('');
                  setMode('signin');
                }}
                className="w-full py-3.5 bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('access.toSignIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {registering && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <motion.div {...(stagger(0) || {})}>
                    <label htmlFor="access-first" className={label}>{t('access.firstName')}</label>
                    <input id="access-first" ref={firstExtraRef} name="firstName" type="text"
                      value={form.firstName} onChange={set('firstName')} className={field} autoComplete="given-name" />
                  </motion.div>
                  <motion.div {...(stagger(1) || {})}>
                    <label htmlFor="access-last" className={label}>{t('access.lastName')}</label>
                    <input id="access-last" name="lastName" type="text"
                      value={form.lastName} onChange={set('lastName')} className={field} autoComplete="family-name" />
                  </motion.div>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="access-email" className={label}>{t('access.email')}</label>
                <input id="access-email" name="email" type="email" required
                  value={form.email} onChange={set('email')} className={field}
                  placeholder={t('access.emailPlaceholder')} autoComplete="email" />
              </div>

              <div className="mb-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="access-password" className={label}>{t('access.password')}</label>
                  {!registering && (
                    <button type="button" onClick={requestReset} disabled={busy}
                      className="text-xs font-mono text-[#0A0A0A] underline underline-offset-4 decoration-matcha-accent decoration-2 cursor-pointer">
                      {t('access.forgot')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input id="access-password" name="password" required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} className={`${field} pr-11`}
                    placeholder={registering ? t('access.passwordPlaceholder') : undefined}
                    autoComplete={registering ? 'new-password' : 'current-password'} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('access.hidePassword') : t('access.showPassword')}
                    className="absolute right-0 top-0 h-full px-3 text-matcha-muted hover:text-[#0A0A0A] cursor-pointer outline-hidden focus-visible:text-[#0A0A0A]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {registering && (
                <motion.div {...(stagger(2) || {})} className="mb-4">
                  {/* The meter reports; the eight-character floor is what the
                      form actually enforces. */}
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-[11px] font-mono text-matcha-muted">{t('access.strength.label')}</span>
                    <span className="text-[11px] font-mono" style={{ color: STRENGTH_COLOUR[strength.band] }}>
                      {t(`access.strength.${strength.band}`)}
                    </span>
                  </div>
                  <div className="h-1 bg-matcha-border">
                    <div className="h-full transition-all duration-300"
                      style={{ width: STRENGTH_WIDTH[strength.band], backgroundColor: STRENGTH_COLOUR[strength.band] }} />
                  </div>
                </motion.div>
              )}

              {registering && (
                <motion.div {...(stagger(3) || {})} className="mb-4">
                  <label htmlFor="access-confirm" className={label}>{t('access.confirm')}</label>
                  <div className="relative">
                    <input id="access-confirm" name="confirm" type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirm} onChange={set('confirm')} className={`${field} pr-11`} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? t('access.hidePassword') : t('access.showPassword')}
                      className="absolute right-0 top-0 h-full px-3 text-matcha-muted hover:text-[#0A0A0A] cursor-pointer outline-hidden focus-visible:text-[#0A0A0A]">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}

              {registering ? (
                <motion.label {...(stagger(4) || {})}
                  className="flex items-start gap-2.5 mb-5 text-xs text-[#0A0A0A]/80 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => { setError(''); setAgreed(e.target.checked); }}
                    className="mt-0.5 accent-[#0A0A0A] w-4 h-4 shrink-0" />
                  <span>
                    {t('access.terms')}{' '}
                    <Link to="/legal/terms" className="underline underline-offset-4 decoration-matcha-accent decoration-2">
                      {t('access.termsLink')}
                    </Link>
                  </span>
                </motion.label>
              ) : (
                <label className="flex items-center gap-2.5 mb-5 text-xs text-[#0A0A0A]/80 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#0A0A0A] w-4 h-4" />
                  <span>{t('access.remember')}</span>
                </label>
              )}

              {error && (
                <p role="alert" className="flex items-start gap-2 mb-4 text-xs font-mono text-matcha-accent">
                  <AlertCircle size={14} className="shrink-0 mt-px" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}

              <button type="submit" disabled={busy}
                className="w-full py-3.5 bg-[#0A0A0A] hover:bg-matcha-accent disabled:bg-matcha-border disabled:text-matcha-muted text-matcha-bg font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]">
                {busy ? t('access.working') : registering ? t('access.submitRegister') : t('access.submitSignIn')}
              </button>
            </form>
          )}

          {/* The only button on this page is the one that submits. Switching
              side is a sentence with a link in it, so the eye is not asked to
              choose between two things of equal weight. */}
          <p className="mt-4 text-xs text-matcha-muted">
            {registering ? t('access.haveAccount') : t('access.noAccount')}{' '}
            <button type="button" onClick={toggleMode}
              className="text-[#0A0A0A] underline underline-offset-4 decoration-matcha-accent decoration-2 cursor-pointer outline-hidden focus-visible:bg-matcha-border">
              {registering ? t('access.toSignIn') : t('access.toRegister')}
            </button>
          </p>

          {/* The one-click demo sign-in the old page carried. It hands out a
              role without a password, Admin included, so it is compiled out of
              production — but it is genuinely useful while presenting, and
              dropping it silently would have taken a tool away. */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-dashed border-matcha-border">
              <p className="text-[11px] font-mono uppercase tracking-wider text-matcha-muted mb-3">
                {t('auth.demoModeTitle')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[['Member', 'demo-member', 'Demo Member', 'demo@matcha.com', 'VIP Connoisseur'],
                  ['Admin', 'demo-admin', 'Demo Admin', 'admin@matcha.com', 'System Admin']].map(
                  ([role, id, name, email, tier]) => (
                    <button key={role} type="button"
                      onClick={() => finish({ id, name, email, role, tier, isDemoSession: true }, 'demo-offline-token')}
                      className="py-2.5 px-3 border border-matcha-border text-xs font-mono text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]">
                      {role}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-matcha-border">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-matcha-muted">
                {t('access.socialTitle')}
              </span>
            </div>
            <div>
              <button type="button" onClick={handleGoogleSignIn} disabled={busy}
                className="w-full py-2.5 px-3 border border-[#0A0A0A] text-xs font-mono font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]">
                {t('access.google')}
              </button>
            </div>
          </div>
        </div>

        <AtelierPanel
          title={registering ? t('auth.signUpTitle') : t('auth.signInTitle')}
          footer={t('auth.archiveLine')}
        />
      </div>
    </div>
  );
}
