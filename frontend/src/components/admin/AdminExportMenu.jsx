import React, { useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileJson } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AdminExportMenu({
  isOpen: controlledIsOpen,
  onToggle,
  onClose,
  onExportInventory,
  onExportOrders,
  onExportFullJSON,
}) {
  const langCtx = useLanguage();
  const t = langCtx?.t || ((key) => key);

  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const toggle = onToggle || (() => setUncontrolledIsOpen(prev => !prev));
  const close = onClose || (() => setUncontrolledIsOpen(false));

  const exportLabel = langCtx?.t ? t('admin.shell.exportData') : 'Export Data';
  const exportInvLabel = langCtx?.t ? t('admin.shell.exportInventory') : 'Inventory CSV';
  const exportOrdersLabel = langCtx?.t ? t('admin.shell.exportOrders') : 'Orders Pipeline CSV';
  const exportJsonLabel = langCtx?.t ? t('admin.shell.exportJson') : 'Admin Data Export (JSON)';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={exportLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="h-9 px-3 bg-white border border-matcha-border hover:border-matcha-primary text-matcha-text rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary"
      >
        <Download size={13} className="text-matcha-primary" />
        <span>{exportLabel}</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20 cursor-default" onClick={close} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-matcha-border shadow-2xl p-2 z-30 font-mono text-xs animate-fade-in">
            <div className="p-1.5 space-y-1 border-b border-matcha-border/40">
              <button
                type="button"
                onClick={onExportInventory}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-matcha-bg text-left transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-matcha-primary" />
                <span>{exportInvLabel}</span>
              </button>
              <button
                type="button"
                onClick={onExportOrders}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-matcha-bg text-left transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-matcha-primary" />
                <span>{exportOrdersLabel}</span>
              </button>
            </div>
            <div className="p-1.5">
              <button
                type="button"
                onClick={onExportFullJSON}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-matcha-accent/10 text-matcha-accent font-bold text-left transition-colors cursor-pointer"
              >
                <FileJson size={14} />
                <span>{exportJsonLabel}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
