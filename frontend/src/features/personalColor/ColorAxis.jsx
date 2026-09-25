import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { dyesForSeason } from '../../utils/dye';

export const UNDERTONE_MAX = 8;
export const UNDERTONE_STEPS = UNDERTONE_MAX + 1; // −8, −6 … +6, +8

// Where each season sits on the board, so the reading can be placed in it.
export const SEASON_AXIS = {
  Spring: { tone: 'Warm', depth: 'Light' },
  Summer: { tone: 'Cool', depth: 'Light' },
  Autumn: { tone: 'Warm', depth: 'Deep' },
  Winter: { tone: 'Cool', depth: 'Deep' },
};

/* The reading, drawn at the resolution the quiz actually has.
   Across: questions 1–4 each push +2 warm, +2 cool or nothing, landing on one of nine ticks.
   Down: only question 5 speaks to depth, and only as Light or Deep. */
export default function ColorAxis({ season, reading, dyes }) {
  const { t } = useLanguage();
  const axis = SEASON_AXIS[season];
  const depth = reading?.depth || axis?.depth;

  // −8 … +8 in steps of 2. Negative is cool, positive is warm.
  const diff = reading ? reading.warm - reading.cool : null;
  const tickIndex = diff === null ? null : (diff + UNDERTONE_MAX) / 2;

  const rows = ['Light', 'Deep'];
  const columns = ['Cool', 'Warm'];

  // Which of the four seasons owns a given cell of the board.
  const seasonAt = (tone, band) =>
    Object.keys(SEASON_AXIS).find(
      (key) => SEASON_AXIS[key].tone === tone && SEASON_AXIS[key].depth === band
    );

  return (
    <div className="space-y-4">
      <div className="border border-matcha-border">
        {rows.map((band) => (
          <div key={band} className="grid grid-cols-2 border-b border-matcha-border last:border-b-0">
            {columns.map((tone) => {
              const cellSeason = seasonAt(tone, band);
              const isYours = cellSeason === season;
              const inBand = band === depth;
              return (
                <div
                  key={tone}
                  className={`relative p-4 sm:p-5 border-r border-matcha-border last:border-r-0 transition-colors ${
                    isYours ? 'bg-[#0A0A0A] text-matcha-bg' : inBand ? 'bg-white' : ''
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-[0.18em] block ${
                    isYours ? 'text-matcha-bg/60' : 'text-[#999999]'
                  }`}>
                    {tone} · {band}
                  </span>
                  <span className={`font-bold text-lg sm:text-xl block mt-1 ${
                    isYours ? 'text-matcha-bg' : 'text-matcha-muted'
                  }`}>
                    {cellSeason}
                  </span>

                  {/* Every season's own colours, so the board is itself a
                      comparison rather than four labelled boxes. */}
                  <span className="flex mt-3 h-2">
                    {dyesForSeason(dyes, cellSeason).map((c) => (
                      <span key={c.name} className="flex-1" style={{ backgroundColor: c.hex }} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* The undertone scale, with the answer standing on its tick. */}
      <div>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
          <span>Cool</span>
          <span className="text-[#0A0A0A]">Undertone</span>
          <span>Warm</span>
        </div>

        <div className="flex items-end gap-1" role="img" aria-label={
          diff === null
            ? t('quiz.undertoneAria', { tone: axis?.tone })
            : t('quiz.undertoneLevelAria', {
                tone: t(diff > 0 ? 'quiz.warm' : diff < 0 ? 'quiz.cool' : 'quiz.balanced'),
                score: Math.abs(diff),
                max: UNDERTONE_MAX,
              })
        }>
          {Array.from({ length: UNDERTONE_STEPS }).map((_, i) => {
            const isMark = i === tickIndex;
            const isMiddle = i === (UNDERTONE_STEPS - 1) / 2;
            return (
              <span
                key={i}
                className={`flex-1 transition-all ${
                  isMark ? 'h-10 bg-matcha-accent' : isMiddle ? 'h-5 bg-[#999999]' : 'h-3 bg-matcha-border'
                }`}
              />
            );
          })}
        </div>

        {diff === null ? (
          <p className="mt-3 font-mono text-[11px] text-matcha-muted">
            {t('quiz.savedNote')}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] text-matcha-muted">
            <span>
              {t('quiz.warm')} <span className="text-[#0A0A0A] tabular-nums">{reading.warm}</span>
              <span className="mx-1.5">·</span>
              {t('quiz.cool')} <span className="text-[#0A0A0A] tabular-nums">{reading.cool}</span>
              <span className="mx-1.5">·</span>
              {t('quiz.outOf')} <span className="text-[#0A0A0A] tabular-nums">{UNDERTONE_MAX}</span>
            </span>
            <span>
              {t('quiz.depthFromQ5', { depth })}
            </span>
          </div>
        )}

        {/* A tie is the one result worth saying out loud: it means the
            undertone questions did not decide this, question 5 did. */}
        {diff === 0 && (
          <p className="mt-2 text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
            {t('quiz.tiedScores')}{' '}
            {t('quiz.compareOther', { season: seasonAt(axis?.tone === 'Warm' ? 'Cool' : 'Warm', depth) })}
          </p>
        )}
      </div>
    </div>
  );
}
