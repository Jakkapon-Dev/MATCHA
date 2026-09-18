import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, ShoppingBag, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] bg-[#F1F1F1] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white border border-[#DCDCDC] rounded-3xl p-8 sm:p-12 shadow-xl shadow-black/5 relative overflow-hidden">
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#000000] text-[#518F5C] text-[10px] font-mono font-bold tracking-widest uppercase rounded-full mb-6">
          <Sparkles size={11} className="text-[#C91D1D]" />
          <span>Error 404 • Page Not Found</span>
        </div>

        <h1 className="text-6xl sm:text-7xl font-black text-[#000000] tracking-tighter mb-2 font-mono">
          404
        </h1>

        <p className="text-sm font-bold uppercase tracking-wide text-[#000000] mb-2">
          หน้าเว็บที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายแล้ว
        </p>

        <p className="text-xs font-mono text-[#666666] leading-relaxed mb-8">
          The requested capsule, garment, or editorial piece could not be found. Let's get you back to the collection.
        </p>

        <div className="space-y-2.5">
          <Link
            to="/"
            className="w-full py-3.5 px-4 bg-[#042509] hover:bg-[#021505] text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>กลับสู่หน้าหลัก (Back to Home)</span>
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/catalog"
              className="py-2.5 px-3 bg-[#F1F1F1] hover:bg-[#DCDCDC] text-[#000000] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingBag size={13} />
              <span>ดูสินค้าทั้งหมด</span>
            </Link>

            <Link
              to="/mix-match"
              className="py-2.5 px-3 bg-[#F1F1F1] hover:bg-[#DCDCDC] text-[#000000] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Compass size={13} />
              <span>Mix & Match</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
