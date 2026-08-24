import React, { useState } from 'react';

export default function JoinDropList({ onSubscribe }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    if (onSubscribe) onSubscribe(email);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 4000);
  };

  return (
    <section className="w-full bg-[#D0DEC6]/40 text-[#2D231E] py-20 px-6 md:px-12 border-b border-[#D9D3C7]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FAF8F5] rounded-3xl p-8 sm:p-12 border border-[#D9D3C7] shadow-lg">
        
        {/* Left Side: Cat Illustration / Image */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[#D0DEC6]/60 rounded-2xl border border-[#B8CBAE] text-center relative group">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white flex items-center justify-center text-6xl shadow-inner border border-[#D0DEC6] group-hover:scale-110 transition-transform duration-300">
            🍵🐱
          </div>
          <span className="mt-4 text-xs font-bold text-[#2D231E] tracking-wider uppercase font-mono">
            MATCHA CAT MASCOT
          </span>
          <p className="text-[11px] text-[#6B5E55] mt-1">
            "Don't miss the secret drops meow!"
          </p>
        </div>

        {/* Right Side: Subscription Form */}
        <div className="md:col-span-7 flex flex-col items-start justify-center pl-0 md:pl-4">
          <span className="text-xs uppercase tracking-widest text-[#2D5A27] font-bold">VIP Early Access</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2D231E] uppercase tracking-tight mt-1">
            JOIN THE DROP LIST
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5E55] mt-2 leading-relaxed">
            Drop Your Email Below To Get Instant Flash Alerts For Secret Drops, Collections, And Member Only Secret Sales.
          </p>

          <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter Your Email Address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-[#D9D3C7] rounded-xl text-xs text-[#2D231E] focus:outline-none focus:ring-2 focus:ring-[#2D5A27] font-mono"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Subscribe →
            </button>
          </form>

          {subscribed && (
            <p className="mt-3 text-xs font-semibold text-[#2D5A27] flex items-center gap-1.5 animate-fade-in font-mono">
              <span>✅</span> Welcome to the VIP Drop List! Check your inbox soon.
            </p>
          )}

          <p className="text-[10px] text-[#6B5E55] mt-4 font-mono">
            *We respect your privacy. Unsubscribe at any time.
          </p>
        </div>

      </div>
    </section>
  );
}
