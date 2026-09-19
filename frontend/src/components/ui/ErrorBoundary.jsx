import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

// React 18 ยังไม่มี hook สำหรับดักข้อผิดพลาดตอน render — ต้องเป็น class component เท่านั้น
export default class ErrorBoundary extends React.Component {
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
      <div className="w-full bg-[#F1F1F1] min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full text-center">

          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-[#518F5C] flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[#042509]" strokeWidth={1.75} />
          </div>

          <span className="text-xs font-mono font-bold text-[#C91D1D] uppercase tracking-widest">
            Something interrupted
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-[#000000]">
            This page didn&rsquo;t finish loading
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#666666]">
            The rest of the store is still fine. Try this page again, or head back
            to the front and pick up where you left off.
          </p>

          {/* รายละเอียดข้อผิดพลาดมีไว้ให้นักพัฒนาเท่านั้น ไม่ใช่สิ่งที่ลูกค้าควรเห็น */}
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 text-left text-xs font-mono text-[#666666] bg-white border border-[#DCDCDC] rounded-lg p-3 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#042509] text-white text-sm font-semibold tracking-wide hover:bg-[#021505] transition-colors"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              ลองใหม่
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#DCDCDC] text-[#000000] text-sm font-semibold tracking-wide hover:bg-[#518F5C] transition-colors"
            >
              <Home className="w-4 h-4" strokeWidth={2} />
              กลับหน้าแรก
            </button>
          </div>

        </div>
      </div>
    );
  }
}
