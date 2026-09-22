import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, SUPPORTED_LANGS, DEFAULT_LANG } from '../i18n/translations';

// Exported because ErrorBoundary is a class and cannot call useLanguage.
export const LanguageContext = createContext(null);
const STORAGE_KEY = 'matcha:lang';

// 'nav.cart' -> translations[lang].nav.cart
const resolve = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

// English is the default for every first visit, regardless of the browser's own
// language. Only a language the visitor picked here is remembered.
function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {
    // Private mode or blocked storage: fall through to the default
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage is a convenience here, never a requirement
    }
  }, [lang]);

  const value = useMemo(() => {
    const setLang = (next) => {
      if (SUPPORTED_LANGS.includes(next)) setLangState(next);
    };
    return {
      lang,
      setLang,
      toggleLang: () => setLangState(prev => (prev === 'th' ? 'en' : 'th')),
      // Missing keys fall back to English, then to the key itself, so a gap in the
      // dictionary shows up as a visible breadcrumb instead of a blank screen.
      //
      // `vars` fills {placeholders} in the result. Without it a sentence carrying
      // a price or a name had to be assembled in JSX, which is how half of them
      // ended up hardcoded in the first place: the parts read as code, not copy,
      // so nobody lifted them out. Non-strings (the care lists) pass straight
      // through, and a placeholder with no matching value is left alone rather
      // than blanked, so the gap is visible.
      t: (key, vars) => {
        const value = resolve(translations[lang], key)
          ?? resolve(translations[DEFAULT_LANG], key)
          ?? key;
        if (!vars || typeof value !== 'string') return value;
        return value.replace(/\{(\w+)\}/g, (match, name) => (
          vars[name] === undefined || vars[name] === null ? match : String(vars[name])
        ));
      },
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
