import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Single square switch sized to match the cart and menu buttons, so the navbar's
 * right edge stays one row of equal tiles. It shows the language you are reading
 * now; the tooltip names the one you get by clicking.
 */
export default function LanguageToggle({ className = '' }) {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={t('nav.switchLanguage')}
      aria-label={t('nav.switchLanguage')}
      className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white hover:bg-matcha-bg text-matcha-text border border-matcha-border shadow-xs transition-colors cursor-pointer font-mono text-[11px] font-bold uppercase tracking-wider ${className}`}
    >
      {lang}
    </button>
  );
}
