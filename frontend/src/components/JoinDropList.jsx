import React, { useState } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, CreditCard, CheckCircle2 } from 'lucide-react';

export default function JoinDropList({ onSubscribe }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    if (onSubscribe) onSubscribe(email);
  };

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-20 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] select-none overflow-hidden">
      <div className="max-w-6xl mx-auto bg-white border-2 border-[#BC5A36] shadow-2xl p-6 sm:p-10 lg:p-14 relative">
        
        {/* Subtle Background Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#BC5A36]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Side: 3D VIP Metal Black Card Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm aspect-[1.58/1] bg-linear-to-br from-[#2D231E] via-[#1A1513] to-black rounded-2xl p-6 text-white shadow-2xl border border-white/20 holographic-sheen transform hover:scale-105 hover:-rotate-1 transition-all duration-300 group">
              
              {/* Card Chip & Brand */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2D5A27] flex items-center justify-center text-sm shadow-md">
                    🍵
                  </div>
                  <span className="font-extrabold tracking-tight text-sm uppercase text-[#FAF8F5]">
                    MatchA VIP
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#BC5A36] text-[9px] font-mono font-bold tracking-widest text-white uppercase shadow-sm">
                  15% OFF PASS
                </span>
              </div>

              {/* Metallic Chip Visual */}
              <div className="mt-5 flex items-center gap-3">
                <div className="w-9 h-7 rounded-md bg-linear-to-tr from-amber-300 via-amber-100 to-amber-400 border border-amber-500/50 shadow-inner flex items-center justify-center">
                  <div className="w-5 h-4 border border-amber-600/40 rounded-xs" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#D0DEC6] opacity-80">
                  NFC ENABLED // 2026
                </span>
              </div>

              {/* Cardholder & Pass Details */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#D0DEC6]">
                <div>
                  <span className="block text-[8px] text-[#6B5E55] uppercase">Member Access</span>
                  <span className="font-bold text-white tracking-wider">MATCHA COLLECTIVE</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-[#6B5E55] uppercase">Promo Code</span>
                  <span className="font-bold text-[#BC5A36] tracking-wider">MATCHA15</span>
                </div>
              </div>

            </div>
            
            <p className="mt-3 text-[11px] font-mono text-[#6B5E55] text-center">
              ✦ Unlock instant 15% discount + private early drop notifications
            </p>
          </div>

          {/* Right Side: High-Fashion Newsletter Form */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            <span className="text-xs font-mono font-bold text-[#BC5A36] tracking-widest uppercase mb-2">
              ✦ PRIVATE INSIDER ACCESS
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-black text-[#2D231E] uppercase tracking-tight font-sans leading-none">
              JOIN THE DROP LIST
            </h2>
            
            <p className="text-xs sm:text-sm text-[#6B5E55] mt-3 leading-relaxed font-sans font-medium">
              Receive secret lookbook drops, limited archive releases, and custom personal color formulas delivered directly to your inbox.
            </p>

            {subscribed ? (
              <div className="mt-6 p-4 bg-[#D0DEC6]/50 border border-[#2D5A27] rounded-xl flex items-center gap-3 animate-scale-up">
                <CheckCircle2 size={24} className="text-[#2D5A27] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#2D231E]">You're officially on the VIP Drop List!</h4>
                  <p className="text-xs text-[#6B5E55] font-mono mt-0.5">Use code <strong>MATCHA15</strong> at checkout for 15% off.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#D9D3C7] text-xs sm:text-sm text-[#2D231E] focus:outline-hidden focus:ring-2 focus:ring-[#BC5A36] font-mono transition-colors"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-sans font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <span>GET VIP ACCESS</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-[#6B5E55]">
              <ShieldCheck size={13} className="text-[#2D5A27]" />
              <span>NO SPAM EVER. ONLY EXCLUSIVE DROPS & LOOKBOOKS.</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
