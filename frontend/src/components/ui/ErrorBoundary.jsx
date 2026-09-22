import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext.jsx';

// React 18 ยังไม่มี hook สำหรับดักข้อผิดพลาดตอน render — ต้องเป็น class component เท่านั้น
export default class ErrorBoundary extends React.Component {
  /* A class cannot call useLanguage, and this one has to keep working in the
     worst case anyway: if the failure it caught happened above the language
     provider, there is no context to read. Hence the guard rather than a bare
     this.context.t — an untranslated screen is a poor result, a boundary that
     throws while reporting an error is a much worse one. */
  static contextType = LanguageContext;

  translate(key, fallback) {
    const t = this.context?.t;
    return typeof t === 'function' ? t(key) : fallback;
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  /* Clear the error when the thing that caused it changes.

     This boundary used to be given key={location.pathname}, which does clear
     it on navigation — by destroying and rebuilding the entire subtree every
     time, taking form state, scroll position and any in-flight work with it.
     Watching the keys instead resets only this boundary, and only when it is
     actually holding an error, so a working page is left alone. */
  componentDidUpdate(prevProps) {
    if (!this.state.hasError) return;
    const prev = prevProps.resetKeys || [];
    const next = this.props.resetKeys || [];
    const changed = prev.length !== next.length
      || next.some((key, i) => !Object.is(key, prev[i]));
    if (changed) this.setState({ hasError: false, error: null });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full bg-matcha-bg min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full text-center">

          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-matcha-secondary flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-matcha-primary" strokeWidth={1.75} />
          </div>

          <span className="text-xs font-mono font-bold text-matcha-accent uppercase tracking-widest">
            {this.translate('errors.interrupted', 'Something interrupted')}
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-matcha-text">
            {this.translate('errors.pageTitle', 'This page didn’t finish loading')}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-matcha-muted">
            {this.translate('errors.pageBody', 'The rest of the store is still fine. Try this page again, or head back to the front and pick up where you left off.')}
          </p>

          {/* รายละเอียดข้อผิดพลาดมีไว้ให้นักพัฒนาเท่านั้น ไม่ใช่สิ่งที่ลูกค้าควรเห็น */}
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 text-left text-xs font-mono text-matcha-muted bg-white border border-matcha-border rounded-lg p-3 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-matcha-primary text-white text-sm font-semibold tracking-wide hover:bg-matcha-primary-dark transition-colors"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              {this.translate('common.retry', 'Try again')}
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-matcha-border text-matcha-text text-sm font-semibold tracking-wide hover:bg-matcha-secondary transition-colors"
            >
              <Home className="w-4 h-4" strokeWidth={2} />
              {this.translate('errors.backHome', 'Back to home')}
            </button>
          </div>

        </div>
      </div>
    );
  }
}
