import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext.jsx';

const TOAST_CONTEXT_KEY = Symbol.for('matcha.toast.context');
const ToastContext = globalThis[TOAST_CONTEXT_KEY] || (globalThis[TOAST_CONTEXT_KEY] = createContext(null));

const VISIBLE_MS = 4000;

/* The thing that actually appears on screen.

   Kept in this file because it exists only to serve the provider below: there
   is one of it, nobody else renders it, and splitting it out would mean two
   files to keep in step for no gain.

   An error does not look like a success. That sounds obvious, and the toast
   this replaces ignored the `type` every caller was already passing, so
   "Could not place order" arrived in the same cheerful box as "Added to bag".
   Errors also announce themselves through role="alert" rather than waiting
   their turn, because by the time a screen reader gets to a polite status the
   customer may already be somewhere else. */
function Toast({ toast, onDismiss }) {
  // Safe: App nests ToastProvider inside LanguageProvider.
  const { t } = useLanguage();
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  const tone = isError
    ? 'bg-matcha-accent text-white border-matcha-accent-hover'
    : isSuccess
      ? 'bg-matcha-primary text-white border-matcha-primary-dark'
      : 'bg-matcha-text text-matcha-bg border-matcha-muted';

  return (
    <div
      className="fixed inset-x-4 bottom-6 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end print:hidden"
      // The wrapper must not swallow clicks meant for the page underneath; the
      // message itself takes them back so the dismiss button still works.
      style={{ pointerEvents: 'none' }}
    >
      <div
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
        style={{ pointerEvents: 'auto' }}
        className={`max-w-sm w-full sm:w-auto flex items-start gap-3 px-4 py-3 border text-xs font-mono leading-relaxed shadow-lg animate-fade-in ${tone}`}
      >
        <span aria-hidden="true" className="font-bold shrink-0">{isError ? '!' : isSuccess ? '✓' : '•'}</span>
        <span className="flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('common.dismiss')}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer px-1 -my-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hideToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  /* The timer lives in a ref rather than in the closure it was created in.

     The version this replaces returned its own cleanup function, which nothing
     called, and started a fresh timer on every message without stopping the
     one before. Two messages in quick succession therefore shared the first
     one's deadline, and the second vanished early — sometimes almost at once. */
  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;
    clearTimer();
    setToast({ message, type, id: Date.now() });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToast(null);
    }, VISIBLE_MS);
  }, []);

  useEffect(() => clearTimer, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast && <Toast key={toast.id} toast={toast} onDismiss={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
