import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Fills a translated sentence's {placeholders} with bold numbers, so each
// language keeps its own word order around them.
const withBold = (template, vars) => String(template).split(/(\{\w+\})/).map((part, i) => {
  const name = part.match(/^\{(\w+)\}$/)?.[1];
  return name && name in vars
    ? <span key={i} className="font-bold text-matcha-text">{vars[name]}</span>
    : part;
});

export default function AdminPagination({
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  loading = false,
  disabled = false,
}) {
  const { t } = useLanguage();
  if (total === 0 && totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-matcha-border font-mono text-xs text-matcha-muted">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {withBold(t('admin.pagination.showing'), { page, totalPages })}
        </span>
        <span className="text-matcha-border">|</span>
        <span>{withBold(t('admin.pagination.total'), { total })}</span>
        {loading && (
          <span className="flex items-center gap-1 text-matcha-primary ml-2 font-bold animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>{t('admin.common.loading')}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-xl border border-matcha-border bg-matcha-bg hover:bg-white text-matcha-text disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft size={13} />
          <span>{t('admin.common.previous')}</span>
        </button>

        <span className="px-3 py-1.5 rounded-xl bg-matcha-primary text-white font-bold">
          {page}
        </span>

        <button
          type="button"
          disabled={disabled || loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-xl border border-matcha-border bg-matcha-bg hover:bg-white text-matcha-text disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>{t('admin.common.next')}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
