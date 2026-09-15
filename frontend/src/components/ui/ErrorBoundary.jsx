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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full bg-[#FAF8F5] min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full text-center">

          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-[#D0DEC6] flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[#2D5A27]" strokeWidth={1.75} />
          </div>

          <span className="text-xs font-mono font-bold text-[#BC5A36] uppercase tracking-widest">
            Something interrupted
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-[#2D231E]">
            This page didn&rsquo;t finish loading
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#6B5E55]">
            The rest of the store is still fine. Try this page again, or head back
            to the front and pick up where you left off.
          </p>

          {/* รายละเอียดข้อผิดพลาดมีไว้ให้นักพัฒนาเท่านั้น ไม่ใช่สิ่งที่ลูกค้าควรเห็น */}
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 text-left text-xs font-mono text-[#6B5E55] bg-white border border-[#D9D3C7] rounded-lg p-3 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#2D5A27] text-white text-sm font-semibold tracking-wide hover:bg-[#23471E] transition-colors"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              ลองใหม่
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#D9D3C7] text-[#2D231E] text-sm font-semibold tracking-wide hover:bg-[#D0DEC6] transition-colors"
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
