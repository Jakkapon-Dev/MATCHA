import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { SUPPORTED_LANGS } from '../../i18n/translations.js';

/**
 * Segmented EN / TH switch styled to sit beside the cart button in the navbar.
 * Both options stay visible so the inactive language reads as the thing you get
 * by clicking, rather than as a label for the current state.
 */
export default function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('nav.languageAria')}
      className={`flex items-center gap-0.5 p-0.5 rounded-xl bg-white border border-[#DCDCDC] shadow-xs font-mono ${className}`}
    >
      {SUPPORTED_LANGS.map((code) => {
        const isActive = code === lang;

        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={isActive}
            lang={code}
            className={`px-2 py-1.5 rounded-[0.6rem] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#000000] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#000000] hover:bg-[#F1F1F1]'
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
