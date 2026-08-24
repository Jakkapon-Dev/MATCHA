import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#FAF8F5] border border-[#D9D3C7] rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-[#2D231E] text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#2D5A27]/40 rounded-full blur-2xl pointer-events-none" />
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#2D5A27] text-white flex items-center justify-center text-xl shadow-md mb-2">
            🍵
          </div>
          <h3 className="text-xl font-extrabold tracking-tight uppercase">
            {mode === 'login' ? 'Welcome Back to MatchA' : 'Join the MatchA Collective'}
          </h3>
          <p className="text-xs text-[#D0DEC6] mt-1 font-mono">
            {mode === 'login' ? 'Access your drops, lookbooks & orders' : 'Unlock 15% off your first drop & custom palette'}
          </p>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#D9D3C7] bg-[#D0DEC6]/30">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer ${
              mode === 'login' 
                ? 'bg-[#FAF8F5] text-[#2D5A27] border-b-2 border-[#2D5A27]' 
                : 'text-[#6B5E55] hover:text-[#2D231E]'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer ${
              mode === 'signup' 
                ? 'bg-[#FAF8F5] text-[#2D5A27] border-b-2 border-[#2D5A27]' 
                : 'text-[#6B5E55] hover:text-[#2D231E]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#2D5A27] text-white flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles size={28} />
              </div>
              <h4 className="text-lg font-bold text-[#2D231E]">
                {mode === 'login' ? 'Logged In Successfully!' : 'Account Created! Welcome to MatchA'}
              </h4>
              <p className="text-xs text-[#6B5E55] font-mono">Redirecting to your personalized feed...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono font-bold text-[#2D231E] uppercase mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D231E] focus:outline-hidden focus:border-[#2D5A27] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold text-[#2D231E] uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@matcha.style"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D231E] focus:outline-hidden focus:border-[#2D5A27] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-mono font-bold text-[#2D231E] uppercase">
                    Password
                  </label>
                  {mode === 'login' && (
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] font-mono text-[#BC5A36] hover:underline">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D231E] focus:outline-hidden focus:border-[#2D5A27] transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-2 w-full py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-[#2D5A27]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{mode === 'login' ? 'Sign In to MatchA' : 'Create Free Account'}</span>
                <ArrowRight size={14} />
              </button>

              {/* Security note */}
              <div className="pt-3 border-t border-[#D9D3C7]/60 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#6B5E55]">
                <ShieldCheck size={13} className="text-[#2D5A27]" />
                <span>256-BIT ENCRYPTED AUTHENTICATION</span>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
