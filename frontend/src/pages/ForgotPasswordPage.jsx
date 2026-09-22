import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail } from 'lucide-react';
import { api, apiErrorText } from '../services/api';
import { useLanguage } from '../context/LanguageContext.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const address = email.trim();
    setError('');

    if (!EMAIL_PATTERN.test(address)) {
      setError(t('access.resetRequestInvalidEmail'));
      return;
    }

    setStatus('sending');
    try {
      // The server deliberately answers known and unknown addresses alike.
      await api.forgotPassword(address, lang);
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setError(apiErrorText(err, t) || t('access.resetRequestError'));
    }
  };

  return (
    <div className="w-full bg-matcha-bg min-h-[80vh] px-5 sm:px-8 lg:px-12 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 border border-[#0A0A0A]">
        <aside className="hidden lg:flex lg:col-span-5 bg-[#0A0A0A] text-matcha-bg p-10 flex-col justify-between min-h-[520px]">
          <div className="flex items-center gap-3 text-sm font-extrabold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center border border-matcha-bg/40">M</span>
            <span>MatchA</span>
          </div>
          <div className="space-y-5 max-w-sm">
            <LockKeyhole size={30} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-3xl font-extrabold uppercase tracking-tight leading-[0.95]">
              {t('access.resetRequestAsideTitle')}
            </h2>
            <p className="text-sm text-matcha-bg/70 leading-relaxed">
              {t('access.resetRequestAsideBody')}
            </p>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-matcha-bg/50">
            {t('access.resetRequestAsideFoot')}
          </p>
        </aside>

        <main className="lg:col-span-7 bg-matcha-bg p-6 sm:p-10 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {status === 'sent' ? (
              <section aria-live="polite" className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center border border-matcha-primary text-matcha-primary">
                  <CheckCircle2 size={26} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#0A0A0A] leading-none">
                    {t('access.resetRequestSentTitle')}
                  </h1>
                  <p className="text-sm text-[#0A0A0A]/75 leading-relaxed">
                    {t('access.resetRequestSentLead')}
                  </p>
                </div>
                <div className="border border-matcha-border bg-white p-4 text-xs font-mono leading-relaxed text-matcha-muted">
                  {t('access.resetRequestSentHint')}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <Link to="/login" className="inline-flex items-center gap-2 text-[#0A0A0A] underline underline-offset-4 decoration-matcha-accent decoration-2">
                    <ArrowLeft size={14} aria-hidden="true" />
                    {t('access.resetBackToSignIn')}
                  </Link>
                  <button type="button" onClick={() => setStatus('idle')} className="text-matcha-muted underline underline-offset-4 cursor-pointer">
                    {t('access.resetRequestTryAgain')}
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div className="inline-flex h-12 w-12 items-center justify-center border border-matcha-primary text-matcha-primary mb-6">
                  <Mail size={25} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div className="space-y-3 mb-8">
                  <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#0A0A0A] leading-none">
                    {t('access.resetRequestTitle')}
                  </h1>
                  <p className="text-sm text-[#0A0A0A]/75 leading-relaxed max-w-[44ch]">
                    {t('access.resetRequestLead')}
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-mono uppercase tracking-wider text-matcha-muted mb-2">
                      {t('access.resetRequestEmail')}
                    </label>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setError(''); }}
                      className="w-full px-4 py-3 bg-white border border-matcha-border text-sm text-[#0A0A0A] outline-hidden focus:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A] transition-colors"
                      placeholder={t('access.emailPlaceholder')}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>

                  {error && <p role="alert" className="text-xs font-mono text-matcha-accent leading-relaxed">{error}</p>}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-matcha-primary hover:bg-matcha-primary-dark disabled:opacity-40 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {status === 'sending' ? t('access.resetRequestSending') : t('access.resetRequestSubmit')}
                  </button>
                </form>

                <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-xs font-mono text-matcha-muted underline underline-offset-4 decoration-matcha-accent decoration-2">
                  <ArrowLeft size={14} aria-hidden="true" />
                  {t('access.resetBackToSignIn')}
                </Link>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
