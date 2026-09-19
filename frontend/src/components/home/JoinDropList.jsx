import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import BorderBeam from '../ui/BorderBeam';
import { Reveal } from '../motion';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function JoinDropList({ onSubscribe }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    // The browser validates the email format through type="email" and required; this
    // guard also prevents programmatic submissions with an empty value.
    if (!email || !email.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('matcha_subscribers') || '[]');
      if (!existing.includes(email.trim())) {
        existing.push(email.trim());
        localStorage.setItem('matcha_subscribers', JSON.stringify(existing));
      }
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    // Switch to the success panel immediately, then let the parent persist the address.
    setSubscribed(true);
    showToast(t('drop.toast'), 'success');
    if (onSubscribe) onSubscribe(email);
  };

  return (
    <section className="w-full bg-matcha-bg text-matcha-text py-20 px-5 sm:px-8 lg:px-12 border-b border-matcha-border select-none overflow-hidden">
      <div className="max-w-6xl mx-auto bg-white border-t border-[#0A0A0A] p-6 sm:p-10 lg:p-14 relative">
        
        {/* Subtle Background Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-matcha-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Side: 3D VIP Metal Black Card Showcase with Orbiting Border Beam.
              บัตรลอยเข้ามาจากซ้ายแล้วค่อยตั้งตรง ส่วน hover ของบัตรยังเป็นของเดิม */}
          <Reveal x={-52} y={24} scale={0.92} duration={0.85} amount={0.25} className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm aspect-[1.58/1] bg-linear-to-br from-matcha-text via-[#1A1513] to-black rounded-2xl p-6 text-white shadow-2xl border border-white/20 holographic-sheen transform hover:scale-105 hover:-rotate-1 transition-all duration-300 group overflow-hidden">
              
              {/* ReactVibe Orbiting Border Beam */}
              <BorderBeam size={160} duration={8} colorFrom="#C91D1D" colorTo="#518F5C" />

              {/* Card Chip & Brand */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-matcha-primary flex items-center justify-center text-sm shadow-md">
                    🍵
                  </div>
                  <span className="font-extrabold tracking-tight text-sm uppercase text-matcha-bg">
                    MatchA VIP
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-matcha-accent text-[9px] font-mono font-bold tracking-widest text-white uppercase shadow-sm">
                  {t('drop.vipPass')}
                </span>
              </div>

              {/* Metallic Chip Visual */}
              <div className="mt-5 flex items-center gap-3 relative z-10">
                <div className="w-9 h-7 rounded-md bg-linear-to-tr from-amber-300 via-amber-100 to-amber-400 border border-amber-500/50 shadow-inner flex items-center justify-center">
                  <div className="w-5 h-4 border border-amber-600/40 rounded-xs" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-matcha-secondary opacity-80">
                  {t('drop.nfc')}
                </span>
              </div>

              {/* Cardholder & Pass Details */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-matcha-secondary relative z-10">
                <div>
                  <span className="block text-[8px] text-matcha-muted uppercase">{t('drop.memberAccess')}</span>
                  <span className="font-bold text-white tracking-wider">{t('drop.memberName')}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-matcha-muted uppercase">{t('drop.promoLabel')}</span>
                  <span className="font-bold text-matcha-accent tracking-wider">MATCHA15</span>
                </div>
              </div>

            </div>
            
            <p className="mt-3 text-[11px] font-mono text-matcha-muted text-center">
              {t('drop.cardNote')}
            </p>
          </Reveal>

          {/* Right Side: High-Fashion Newsletter Form */}
          <Reveal x={52} y={0} delay={0.14} duration={0.8} amount={0.25} className="lg:col-span-7 flex flex-col justify-center">
            
            <span className="text-xs font-mono font-bold text-matcha-accent tracking-widest uppercase mb-2">
              {t('drop.insider')}
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-black text-matcha-text uppercase tracking-tight font-sans leading-none">
              {t('drop.title')}
            </h2>
            
            <p className="text-xs sm:text-sm text-matcha-muted mt-3 leading-relaxed font-sans font-medium">
              {t('drop.description')}
            </p>

            {subscribed ? (
              <div className="mt-6 p-4 bg-matcha-secondary/50 border border-matcha-primary rounded-xl flex items-center gap-3 animate-scale-up">
                <CheckCircle2 size={24} className="text-matcha-primary shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-matcha-text">{t('drop.successTitle')}</h4>
                  <p className="text-xs text-matcha-muted font-mono mt-0.5">{t('drop.successBodyPrefix')} <strong>MATCHA15</strong> {t('drop.successBody')}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  placeholder={t('drop.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-matcha-bg border border-matcha-border text-xs sm:text-sm text-matcha-text focus:outline-hidden focus:ring-2 focus:ring-matcha-accent font-mono transition-colors"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-matcha-accent hover:bg-matcha-accent-hover text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <span>{t('drop.cta')}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-matcha-muted">
              <ShieldCheck size={13} className="text-matcha-primary" />
              <span>{t('drop.noSpam')}</span>
            </div>

          </Reveal>

        </div>

      </div>
    </section>
  );
}
