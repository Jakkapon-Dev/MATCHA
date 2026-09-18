import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/* The panel beside the sign-in and sign-up forms.

   It was written twice, once in each page, down to the same three perks and
   the same pledge sentence — so the two pages could drift apart without
   anyone noticing, and the copy had to be corrected in two places. The only
   real difference was the heading and the line at the foot, so those are
   what the caller passes in. */

export default function AtelierPanel({ title, footer }) {
  const { t } = useLanguage();

  const perks = [
    t('auth.perkColor'),
    t('auth.perkDrops'),
    t('auth.perkTailoring'),
  ];

  return (
    <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-[#042509] text-[#F1F1F1] flex flex-col justify-between relative overflow-hidden">

      <div className="relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#F1F1F1]/70 hover:text-[#F1F1F1] transition-colors mb-8 outline-hidden focus-visible:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{t('auth.backToStore')}</span>
        </Link>

        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F1F1F1] leading-snug uppercase">
            {title}
          </h2>

          <p className="text-xs text-[#F1F1F1]/70 leading-relaxed max-w-[46ch]">
            {t('auth.atelierPledgeBody')}
          </p>
        </div>
      </div>

      {/* The perks are a set, not a sequence, so they are marked rather than
          numbered — and marked with a rule rather than a badge. */}
      <ul className="relative z-10 my-8 py-6 border-y border-[#F1F1F1]/15 space-y-3">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-xs">
            <span className="w-4 h-px bg-[#518F5C] shrink-0 mt-2" aria-hidden="true" />
            <span className="text-[#F1F1F1]/85 leading-relaxed">{perk}</span>
          </li>
        ))}
      </ul>

      {footer && (
        <div className="relative z-10 pt-2 text-[11px] font-mono text-[#F1F1F1]/55 border-t border-[#F1F1F1]/15">
          {footer}
        </div>
      )}
    </div>
  );
}
