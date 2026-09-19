import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

/* A wrong address is a dead end, so the only job here is to be a short one.

   The page used to lead with a tracked-out "Error 404 · Page Not Found"
   above a 404 that said the same thing, inside a floating card, and offered
   one way home. It now says what happened once and opens the four routes
   that actually go somewhere. */

const ROUTES = [
  { to: '/', key: 'notFound.home' },
  { to: '/catalog', key: 'notFound.catalog' },
  { to: '/lookbook', key: 'notFound.lookbook' },
  { to: '/personal-color', key: 'notFound.colorLab' },
];

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] bg-[#F1F1F1] flex items-center px-5 sm:px-8 lg:px-12 py-16">
      <div className="max-w-2xl w-full">

        <p className="font-mono text-sm text-[#666666] tabular-nums">
          {t('notFound.code')}
        </p>

        <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight uppercase leading-none">
          {t('notFound.title')}
        </h1>

        <p className="mt-4 max-w-[52ch] text-sm text-[#0A0A0A]/75 leading-relaxed">
          {t('notFound.body')}
        </p>

        <ul className="mt-8 border-t border-[#0A0A0A]">
          {ROUTES.map(({ to, key }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-baseline justify-between gap-4 py-3.5 border-b border-[#DCDCDC] text-[#0A0A0A] outline-hidden focus-visible:bg-[#DCDCDC]"
              >
                <span className="text-base font-extrabold uppercase tracking-tight group-hover:underline underline-offset-4 decoration-2 decoration-[#C91D1D]">
                  {t(key)}
                </span>
                <span className="font-mono text-xs text-[#666666] shrink-0">{to}</span>
              </Link>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
