import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, apiErrorText } from '../services/api';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/* Where an emailed reset link lands.
 *
 * The token rides in the query string because that is what a link can carry,
 * and it is spent the moment this form is submitted — the server clears it in
 * the same write that sets the password, so a link that has been used, or that
 * has run out, fails here rather than half-working.
 *
 * Nothing on this page says whether the token is a real one until it is
 * submitted. Checking it on arrival would turn opening the page into a way to
 * test guesses, and there is nothing useful to show a visitor either way. */
export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const field = 'w-full bg-white border border-matcha-border px-4 py-3 text-sm font-mono text-[#0A0A0A] outline-hidden focus-visible:border-matcha-primary transition-colors';
  const label = 'block text-[10px] font-mono uppercase tracking-widest text-matcha-muted mb-2';

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    // Checked here so the person is told before a round trip, and again on the
    // server, which is the one that counts.
    if (password.length < 8) {
      setError(t('access.resetTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('access.resetMismatch'));
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword(token, password);
      showToast(t('access.resetDone'), 'success');
      // Straight to signing in: the server deliberately does not hand back a
      // session, so that a stolen link cannot become one.
      navigate('/login');
    } catch (err) {
      setError(apiErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  // A link with nothing in it is a mistake worth naming, and the only case
  // that can be told apart without asking the server anything.
  if (!token) {
    return (
      <div className="min-h-[70vh] bg-matcha-bg px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto bg-white border border-matcha-border p-8 text-center space-y-4">
          <h1 className="text-lg font-extrabold uppercase tracking-tight text-[#0A0A0A]">{t('access.resetTitle')}</h1>
          <p className="text-xs font-mono text-matcha-muted leading-relaxed">{t('access.resetNoToken')}</p>
          <Link to="/login" className="inline-block px-5 py-2.5 bg-matcha-primary hover:bg-matcha-primary-dark text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors">
            {t('access.resetBackToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-matcha-bg px-4 sm:px-6 py-16">
      <form onSubmit={submit} className="max-w-md mx-auto bg-white border border-matcha-border p-8 space-y-5">
        <div className="space-y-2">
          <h1 className="text-lg font-extrabold uppercase tracking-tight text-[#0A0A0A]">{t('access.resetTitle')}</h1>
          <p className="text-xs font-mono text-matcha-muted leading-relaxed">{t('access.resetLead')}</p>
        </div>

        <div>
          <label htmlFor="reset-password" className={label}>{t('access.resetNew')}</label>
          <div className="relative">
            <input
              id="reset-password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
              className={`${field} pr-11`}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? t('access.hidePassword') : t('access.showPassword')}
              className="absolute inset-y-0 right-0 px-3 text-xs font-mono text-matcha-muted hover:text-[#0A0A0A] cursor-pointer"
            >
              {show ? '‹›' : '••'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="reset-confirm" className={label}>{t('access.resetConfirm')}</label>
          <input
            id="reset-confirm"
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setError(''); setConfirm(e.target.value); }}
            className={field}
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-mono text-matcha-accent leading-relaxed">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full px-5 py-3 bg-matcha-primary hover:bg-matcha-primary-dark disabled:opacity-40 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          {busy ? t('access.working') : t('access.resetSubmit')}
        </button>

        <p className="text-[11px] font-mono text-matcha-muted text-center">
          <Link to="/login" className="underline underline-offset-4 decoration-matcha-accent decoration-2">
            {t('access.resetBackToSignIn')}
          </Link>
        </p>
      </form>
    </div>
  );
}
